// Member operations cloud functions
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import {
  validateMemberData,
  validateMemberUpdateData,
  validateMemberIdForDeactivation,
  generateMemberId,
  logValidationResult,
} from './utils/validation';

// Firebase Region Configuration
const FIREBASE_REGION = 'asia-south1';

// Configure CORS options and region for callable functions
const callableOptions = {
  cors: true,
  region: FIREBASE_REGION,
};

// =============================================
// SECURITY HELPER FUNCTIONS
// =============================================

/**
 * Validate admin permissions
 */
const validateAdminPermissions = async (uid: string): Promise<void> => {
  const db = getFirestore();
  const adminConfigRef = db.collection('config').doc('admins');
  const adminConfigSnap = await adminConfigRef.get();

  if (!adminConfigSnap.exists) {
    throw new HttpsError('permission-denied', 'Admin configuration not found');
  }

  const adminConfig = adminConfigSnap.data();
  const adminList = adminConfig?.['list'] || [];

  if (!adminList.includes(uid)) {
    throw new HttpsError('permission-denied', 'Insufficient permissions');
  }
};

// =============================================
// MEMBER OPERATIONS CLOUD FUNCTIONS
// =============================================

/**
 * Add a new member with initial rent history record
 */
export const addMember = onCall(callableOptions, async (request) => {
  try {
    // Detect emulator environment - use same simple detection as config operations
    const isEmulator =
      process.env['FUNCTIONS_EMULATOR'] === 'true' ||
      process.env['FIREBASE_CONFIG'] === undefined ||
      !process.env['FUNCTION_TARGET'];

    // Log environment info for debugging
    logger.info('addMember called', {
      hasAuth: !!request.auth,
      isEmulator,
      functionTarget: process.env['FUNCTION_TARGET'],
      functionsEmulator: process.env['FUNCTIONS_EMULATOR'],
      firebaseConfig: !!process.env['FIREBASE_CONFIG'],
    });

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Validate admin permissions (skip in emulator)
    if (!isEmulator && request.auth) {
      await validateAdminPermissions(request.auth.uid);
    }

    // Validate and sanitize input data
    const validationResult = validateMemberData(request.data);
    logValidationResult(validationResult, 'addMember');

    if (!validationResult.isValid) {
      throw new HttpsError('invalid-argument', validationResult.errors.join('; '));
    }
    const validatedData = validationResult.sanitizedData!;

    const db = getFirestore();
    return await db.runTransaction(async (transaction) => {
      // Generate secure member ID
      const memberId = generateMemberId(validatedData.name, validatedData.phone);

      // Check if member already exists
      const memberRef = db.collection('members').doc(memberId);
      const existingMember = await transaction.get(memberRef);

      if (existingMember.exists) {
        throw new HttpsError('already-exists', 'Member with this name and phone already exists');
      }

      // Get config and validate rent
      const configRef = db.collection('config').doc('globalSettings');
      const configSnap = await transaction.get(configRef);

      if (!configSnap.exists) {
        throw new HttpsError('not-found', 'System configuration not found');
      }

      const config = configSnap.data();
      const currentRent = config?.bedTypes?.[validatedData.floor]?.[validatedData.bedType];

      if (!currentRent) {
        throw new HttpsError(
          'invalid-argument',
          `Rent not configured for ${validatedData.floor} - ${validatedData.bedType}`
        );
      }

      // Calculate totals
      const totalAgreedDeposit =
        validatedData.rentAtJoining + validatedData.advanceDeposit + validatedData.securityDeposit;
      const actualPaid = validatedData.fullPayment ? totalAgreedDeposit : validatedData.actualAmountPaid || 0;
      const outstandingBalance = totalAgreedDeposit - actualPaid;

      // Create member document
      const memberData = {
        id: memberId,
        name: validatedData.name,
        phone: validatedData.phone,
        floor: validatedData.floor,
        bedType: validatedData.bedType,
        moveInDate: validatedData.moveInDate,
        securityDeposit: validatedData.securityDeposit,
        advanceDeposit: validatedData.advanceDeposit,
        rentAtJoining: validatedData.rentAtJoining,
        currentRent,
        totalAgreedDeposit,
        outstandingBalance,
        isActive: true,
        optedForWifi: false,
        electricityAmount: 0,
        wifiAmount: 0,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(memberRef, memberData);

      // Create initial rent history
      const moveInMonth = validatedData.moveInDate.toISOString().slice(0, 7);
      const rentHistoryRef = memberRef.collection('rentHistory').doc(moveInMonth);

      const shortfallAmount = outstandingBalance > 0 ? outstandingBalance : 0;
      const expenses = shortfallAmount > 0 ? [{ description: 'Joining Shortfall', amount: shortfallAmount }] : [];
      const totalDue = validatedData.rentAtJoining + shortfallAmount;
      const currentOutstanding = totalDue - actualPaid;

      let status = 'Due';
      if (currentOutstanding <= 0) status = 'Paid';
      else if (actualPaid > 0) status = 'Partially Paid';

      const rentHistoryData = {
        id: moveInMonth,
        billingMonth: moveInMonth,
        rent: validatedData.rentAtJoining,
        electricity: 0,
        wifi: 0,
        previousOutstanding: 0,
        newCharges: 0,
        expenses,
        totalDue,
        amountPaid: actualPaid,
        currentOutstanding,
        status,
        notes: 'Initial joining record',
        generatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(rentHistoryRef, rentHistoryData);

      // Update member counts
      const newCounts = {
        total: (config?.activeStudentCounts?.total || 0) + 1,
        byFloor: {
          ...(config?.activeStudentCounts?.byFloor || {}),
          [validatedData.floor]: (config?.activeStudentCounts?.byFloor?.[validatedData.floor] || 0) + 1,
        },
        wifiOptedIn: config?.activeStudentCounts?.wifiOptedIn || 0,
      };

      transaction.update(configRef, {
        activeStudentCounts: newCounts,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info('Member added successfully', {
        memberId,
        memberName: validatedData.name,
        floor: validatedData.floor,
        bedType: validatedData.bedType,
        currentRent,
        outstandingBalance,
      });

      return {
        success: true,
        memberId,
        memberName: validatedData.name,
        message: 'Member added successfully',
      };
    });
  } catch (error) {
    logger.error('Error adding member', {
      error,
      memberData: request.data,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'An unexpected error occurred while adding member');
  }
});

/**
 * Update member information (floor, bedType, currentRent only)
 */
export const updateMember = onCall(callableOptions, async (request) => {
  try {
    // Detect emulator environment - use same simple detection as config operations
    const isEmulator =
      process.env['FUNCTIONS_EMULATOR'] === 'true' ||
      process.env['FIREBASE_CONFIG'] === undefined ||
      !process.env['FUNCTION_TARGET'];

    // Log environment info for debugging
    logger.info('updateMember called', {
      hasAuth: !!request.auth,
      isEmulator,
      functionTarget: process.env['FUNCTION_TARGET'],
      functionsEmulator: process.env['FUNCTIONS_EMULATOR'],
      firebaseConfig: !!process.env['FIREBASE_CONFIG'],
    });

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Validate admin permissions (skip in emulator)
    if (!isEmulator && request.auth) {
      await validateAdminPermissions(request.auth.uid);
    }

    // Validate input data
    const validationResult = validateMemberUpdateData(request.data);
    logValidationResult(validationResult, 'updateMember');

    if (!validationResult.isValid) {
      throw new HttpsError('invalid-argument', validationResult.errors.join('; '));
    }
    const { memberId, floor, bedType, currentRent } = validationResult.sanitizedData as any;

    const db = getFirestore();
    return await db.runTransaction(async (transaction) => {
      const memberRef = db.collection('members').doc(memberId);
      const memberSnap = await transaction.get(memberRef);

      if (!memberSnap.exists) {
        throw new HttpsError('not-found', 'Member not found');
      }

      const currentData = memberSnap.data();

      // Update config counts if floor changed
      if (currentData?.floor !== floor) {
        const configRef = db.collection('config').doc('globalSettings');
        const configSnap = await transaction.get(configRef);

        if (configSnap.exists) {
          const config = configSnap.data();
          const newCounts = {
            ...(config?.activeStudentCounts || {}),
            byFloor: {
              ...(config?.activeStudentCounts?.byFloor || {}),
              [currentData?.floor]: Math.max(0, (config?.activeStudentCounts?.byFloor?.[currentData?.floor] || 0) - 1),
              [floor]: (config?.activeStudentCounts?.byFloor?.[floor] || 0) + 1,
            },
          };

          transaction.update(configRef, {
            activeStudentCounts: newCounts,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // Update member data
      transaction.update(memberRef, {
        floor,
        bedType,
        currentRent,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info('Member updated successfully', {
        memberId,
        memberName: currentData?.name,
        oldFloor: currentData?.floor,
        newFloor: floor,
        newBedType: bedType,
        newCurrentRent: currentRent,
      });

      return {
        success: true,
        message: 'Member updated successfully',
      };
    });
  } catch (error) {
    logger.error('Error updating member', {
      error,
      memberId: request.data?.memberId,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'An unexpected error occurred while updating member');
  }
});

/**
 * Deactivate a member (soft delete)
 */
export const deactivateMember = onCall(callableOptions, async (request) => {
  try {
    // Detect emulator environment - use same simple detection as config operations
    const isEmulator =
      process.env['FUNCTIONS_EMULATOR'] === 'true' ||
      process.env['FIREBASE_CONFIG'] === undefined ||
      !process.env['FUNCTION_TARGET'];

    // Log environment info for debugging
    logger.info('deactivateMember called', {
      hasAuth: !!request.auth,
      isEmulator,
      functionTarget: process.env['FUNCTION_TARGET'],
      functionsEmulator: process.env['FUNCTIONS_EMULATOR'],
      firebaseConfig: !!process.env['FIREBASE_CONFIG'],
    });

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Validate admin permissions (skip in emulator)
    if (!isEmulator && request.auth) {
      await validateAdminPermissions(request.auth.uid);
    }

    // Validate input data
    const memberId = validateMemberIdForDeactivation(request.data.memberId);

    const db = getFirestore();
    return await db.runTransaction(async (transaction) => {
      const memberRef = db.collection('members').doc(memberId);
      const memberSnap = await transaction.get(memberRef);

      if (!memberSnap.exists) {
        throw new HttpsError('not-found', 'Member not found');
      }

      const memberData = memberSnap.data();

      // Check if already inactive
      if (!memberData?.isActive) {
        throw new HttpsError('failed-precondition', 'Member is already inactive');
      }

      // Update config counts
      const configRef = db.collection('config').doc('globalSettings');
      const configSnap = await transaction.get(configRef);

      if (configSnap.exists) {
        const config = configSnap.data();
        const newCounts = {
          total: Math.max(0, (config?.activeStudentCounts?.total || 0) - 1),
          byFloor: {
            ...(config?.activeStudentCounts?.byFloor || {}),
            [memberData?.floor]: Math.max(0, (config?.activeStudentCounts?.byFloor?.[memberData?.floor] || 0) - 1),
          },
          wifiOptedIn: memberData?.optedForWifi
            ? Math.max(0, (config?.activeStudentCounts?.wifiOptedIn || 0) - 1)
            : config?.activeStudentCounts?.wifiOptedIn || 0,
        };

        transaction.update(configRef, {
          activeStudentCounts: newCounts,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }      // Deactivate member with TTL for automatic deletion
      const ttlDate = new Date();
      ttlDate.setFullYear(ttlDate.getFullYear() + 1); // Set TTL to 1 year from now
      
      transaction.update(memberRef, {
        isActive: false,
        leaveDate: FieldValue.serverTimestamp(),
        ttlExpiry: ttlDate,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info('Member deactivated successfully', {
        memberId,
        memberName: memberData?.name,
        floor: memberData?.floor,
      });

      return {
        success: true,
        memberName: memberData?.name,
        message: 'Member deactivated successfully',
      };
    });
  } catch (error) {
    logger.error('Error deactivating member', {
      error,
      memberId: request.data?.memberId,
    });

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError('internal', 'An unexpected error occurred while deactivating member');
  }
});
