/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Import configuration operations
import { saveConfiguration, initializeConfiguration } from './config-operations';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Firebase Region Configuration
// Set region directly in function definitions as recommended by Firebase docs
// Reference: https://firebase.google.com/docs/functions/locations
const FIREBASE_REGION = 'asia-south1';

// Log the region being used for debugging  
logger.info('Functions region configuration', { 
  FIREBASE_REGION,
  nodeEnv: process.env['NODE_ENV'],
  functionTarget: process.env['FUNCTION_TARGET']
});

// Configure CORS options and region for callable functions
const callableOptions = {
  cors: true,
  region: FIREBASE_REGION,
};

// Export configuration operations
export { saveConfiguration, initializeConfiguration };

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest({ region: FIREBASE_REGION }, (_request, response) => {
  logger.info('Hello logs!', { structuredData: true });
  response.send('Hello from Firebase!');
});

// Cloud function to handle student deletion with settlement calculation
export const deleteStudentWithSettlement = onCall(callableOptions, async (request) => {
  try {
    // In emulator environment, allow requests without authentication for testing
    const isEmulator = !process.env['FUNCTION_TARGET']; // Firebase automatically sets this in production

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Validate input
    const { studentId, leaveDate } = request.data;
    if (!studentId) {
      throw new HttpsError('invalid-argument', 'Student ID is required');
    }
    if (!leaveDate) {
      throw new HttpsError('invalid-argument', 'Leave date is required');
    }

    const leaveDateObj = new Date(leaveDate);
    if (isNaN(leaveDateObj.getTime())) {
      throw new HttpsError('invalid-argument', 'Invalid leave date format');
    }

    // Run in transaction for atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Get student document
      const studentRef = db.collection('students').doc(studentId);
      const studentDoc = await transaction.get(studentRef);

      if (!studentDoc.exists) {
        throw new HttpsError('not-found', 'Student not found');
      }

      const studentData = studentDoc.data();
      if (!studentData) {
        throw new HttpsError('internal', 'Student data is corrupted');
      }

      // Check if student is already inactive
      if (!studentData['isActive']) {
        throw new HttpsError('failed-precondition', 'Student is already inactive');
      }

      // Get the last month's rent history to get the actual current outstanding
      let currentOutstanding = 0;
      const rentHistoryCollection = studentRef.collection('rentHistory');
      const rentHistoryQuery = rentHistoryCollection.orderBy('billingMonth', 'desc').limit(1);
      const rentHistorySnap = await transaction.get(rentHistoryQuery);

      if (!rentHistorySnap.empty) {
        const lastRentHistory = rentHistorySnap.docs[0]?.data();
        currentOutstanding = Number(lastRentHistory?.['currentOutstanding']) || 0;
        logger.info('Using outstanding from last rent history for deletion', {
          studentId,
          lastMonth: rentHistorySnap.docs[0]?.id,
          currentOutstanding,
        });
      } else {
        logger.info('No rent history found for deletion, using 0 as outstanding', {
          studentId,
          currentOutstanding: 0,
        });
      }

      // Calculate settlement: totalDepositAgreed - currentOutstanding
      const totalDepositAgreed = Number(studentData['totalDepositAgreed']) || 0;
      const refundAmount = totalDepositAgreed - currentOutstanding;

      // Create settlement record in rent history
      const settlementMonth = `${leaveDateObj.getFullYear()}-${String(leaveDateObj.getMonth() + 1).padStart(2, '0')}`;
      const settlementDocRef = rentHistoryCollection.doc(`${settlementMonth}-settlement`);

      const settlementRecord = {
        billingMonth: settlementMonth,
        type: 'settlement',
        leaveDate: leaveDateObj,
        totalDepositAgreed,
        currentOutstandingBalance: currentOutstanding,
        refundAmount,
        status: refundAmount > 0 ? 'Refund Due' : refundAmount < 0 ? 'Payment Due' : 'Settled',
        notes: `Settlement calculation on leave date: ${leaveDateObj.toISOString().split('T')[0]}`,
        createdAt: FieldValue.serverTimestamp(),
      };

      // Update student document
      const studentUpdate = {
        isActive: false,
        leaveDate: leaveDateObj,
        settlementRecord,
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Get config document for count updates
      const configRef = db.collection('config').doc('globalSettings');
      const configDoc = await transaction.get(configRef);

      if (!configDoc.exists) {
        throw new HttpsError('internal', 'Config document not found');
      }

      const configData = configDoc.data();
      if (!configData) {
        throw new HttpsError('internal', 'Config data is corrupted');
      }

      // Calculate new counts
      const activeStudentCounts = configData['activeStudentCounts'] || { total: 0, byFloor: {}, wifiOpted: 0 };
      const newTotal = Math.max(0, (activeStudentCounts.total || 0) - 1);
      const studentFloor = studentData['floor'];
      const newFloorCount = Math.max(0, (activeStudentCounts.byFloor[studentFloor] || 0) - 1);
      const newWifiOptedCount = studentData['optedForWifi']
        ? Math.max(0, (activeStudentCounts.wifiOpted || 0) - 1)
        : activeStudentCounts.wifiOpted || 0;

      const configUpdate = {
        activeStudentCounts: {
          ...activeStudentCounts,
          total: newTotal,
          byFloor: {
            ...activeStudentCounts.byFloor,
            [studentFloor]: newFloorCount,
          },
          wifiOpted: newWifiOptedCount,
        },
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Perform all updates
      transaction.update(studentRef, studentUpdate);
      transaction.set(settlementDocRef, settlementRecord);
      transaction.update(configRef, configUpdate);

      return {
        success: true,
        studentName: studentData['name'],
        refundAmount,
        settlementRecord,
      };
    });

    logger.info(`Student ${result.studentName} deactivated successfully with settlement`, {
      studentId,
      refundAmount: result.refundAmount,
    });

    return result;
  } catch (error) {
    logger.error('Error in deleteStudentWithSettlement', { error, studentId: request.data?.studentId });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'An unexpected error occurred during student deletion');
  }
});

// Cloud function to calculate settlement preview before deletion
export const calculateSettlementPreview = onCall(callableOptions, async (request) => {
  try {
    // In emulator environment, allow requests without authentication for testing
    const isEmulator = !process.env['FUNCTION_TARGET']; // Firebase automatically sets this in production

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Validate input
    const { studentId, leaveDate } = request.data;
    if (!studentId) {
      throw new HttpsError('invalid-argument', 'Student ID is required');
    }

    // Parse leave date if provided
    let leaveDateObj: Date | null = null;
    if (leaveDate) {
      leaveDateObj = new Date(leaveDate);
      if (isNaN(leaveDateObj.getTime())) {
        throw new HttpsError('invalid-argument', 'Invalid leave date format');
      }
    }

    // Step 1: Get student document for totalDepositAgreed
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      throw new HttpsError('not-found', 'Student not found');
    }

    const studentData = studentDoc.data();
    if (!studentData) {
      throw new HttpsError('internal', 'Failed to read student data');
    }

    const totalDepositAgreed = Number(studentData['totalDepositAgreed']) || 0;

    // Step 2: Get the last month's rent history record
    const rentHistoryRef = db.collection('students').doc(studentId).collection('rentHistory');
    const rentHistoryQuery = rentHistoryRef.orderBy('billingMonth', 'desc').limit(1);
    const rentHistorySnap = await rentHistoryQuery.get();

    logger.info('Rent history query executed', {
      rentHistorySnap,
      studentId,
    });

    console.log('I am here');

    // Step 3: Get currentOutstanding from the last rent history record
    let currentOutstanding = 0;
    if (!rentHistorySnap.empty) {
      const lastRentHistory = rentHistorySnap.docs[0]?.data();
      currentOutstanding = Number(lastRentHistory?.['currentOutstanding']) || 0;
      logger.info('Found last rent history record', {
        studentId,
        lastMonth: rentHistorySnap.docs[0]?.id,
        currentOutstanding,
      });
    } else {
      // If no rent history exists, use 0 as outstanding
      logger.info('No rent history found, using 0 as outstanding', { studentId });
      currentOutstanding = 0;
    }

    // Step 4: Calculate settlement: totalDepositAgreed - currentOutstanding
    const refundAmount = totalDepositAgreed - currentOutstanding;

    logger.info('Settlement calculation', {
      studentId,
      studentName: studentData['name'],
      totalDepositAgreed,
      currentOutstanding,
      refundAmount,
      calculation: `${totalDepositAgreed} - ${currentOutstanding} = ${refundAmount}`,
    });

    // Return result
    return {
      studentName: studentData['name'],
      totalDepositAgreed,
      currentOutstandingBalance: currentOutstanding,
      refundAmount,
      status: refundAmount > 0 ? 'Refund Due' : refundAmount < 0 ? 'Payment Due' : 'Settled',
      leaveDate: leaveDateObj ? leaveDateObj.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    };
  } catch (error) {
    logger.error('Error calculating settlement preview', {
      error,
      studentId: request.data?.studentId,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'Failed to calculate settlement preview');
  }
});

// Trigger function to handle student document updates (backup/monitoring)
export const onStudentUpdate = onDocumentUpdated(
  {
    document: 'students/{studentId}',
    region: FIREBASE_REGION,
  },
  async (event) => {
    try {
      const beforeData = event.data?.before.data();
      const afterData = event.data?.after.data();

      if (!beforeData || !afterData) {
        return;
      }

      // Log student deactivation for monitoring
      if (beforeData['isActive'] && !afterData['isActive']) {
        logger.info('Student deactivated', {
          studentId: event.params.studentId,
          studentName: afterData['name'],
          leaveDate: afterData['leaveDate'],
        });
      }
    } catch (error) {
      logger.error('Error in onStudentUpdate trigger', {
        error,
        studentId: event.params.studentId,
      });
    }
  }
);
