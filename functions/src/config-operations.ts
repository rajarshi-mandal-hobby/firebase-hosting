// Configuration operations cloud functions
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { validateConfigUpdate, logValidationResult } from './utils/validation';

// Get region from environment or fallback to default
// For emulator, always use asia-south1 to avoid .env loading issues
const FIREBASE_REGION = 'asia-south1';

// Configure CORS options and region for callable functions
const callableOptions = {
  cors: true,
  region: FIREBASE_REGION,
};

/**
 * Save configuration data to Firestore
 * This function handles updating global configuration settings
 */
export const saveConfiguration = onCall(callableOptions, async (request) => {
  try {
    // Detect emulator environment - multiple ways to check
    const isEmulator =
      process.env['FUNCTIONS_EMULATOR'] === 'true' ||
      process.env['FIREBASE_CONFIG'] === undefined ||
      !process.env['FUNCTION_TARGET'];

    // Log environment info for debugging
    logger.info('saveConfiguration called', {
      hasAuth: !!request.auth,
      isEmulator,
      functionTarget: process.env['FUNCTION_TARGET'],
      functionsEmulator: process.env['FUNCTIONS_EMULATOR'],
      firebaseConfig: !!process.env['FIREBASE_CONFIG'],
      dataKeys: Object.keys(request.data || {}),
    });

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    // Validate input data exists
    if (!request.data) {
      throw new HttpsError('invalid-argument', 'Configuration data is required');
    }

    // Validate and sanitize the configuration data
    const validationResult = validateConfigUpdate(request.data);
    logValidationResult(validationResult, 'saveConfiguration');

    if (!validationResult.isValid) {
      throw new HttpsError('invalid-argument', `Validation failed: ${validationResult.errors.join(', ')}`);
    }

    const sanitizedData = validationResult.sanitizedData!;

    // Run in transaction for atomicity
    const result = await getFirestore().runTransaction(async (transaction: any) => {
      // Get current config document
      const configRef = getFirestore().collection('config').doc('globalSettings');
      const configDoc = await transaction.get(configRef);

      // Prepare update data with timestamp
      const updateData = {
        ...sanitizedData,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!configDoc.exists) {
        // Create new configuration document
        updateData.createdAt = FieldValue.serverTimestamp();
        transaction.set(configRef, updateData);

        logger.info('Configuration created successfully', {
          createdFields: Object.keys(sanitizedData),
        });

        return {
          success: true,
          message: 'Configuration created successfully',
          createdFields: Object.keys(sanitizedData),
          isNew: true,
        };
      } else {
        // Update existing configuration
        transaction.update(configRef, updateData);

        logger.info('Configuration updated successfully', {
          updatedFields: Object.keys(sanitizedData),
        });

        return {
          success: true,
          message: 'Configuration updated successfully',
          updatedFields: Object.keys(sanitizedData),
          isNew: false,
        };
      }
    });

    return result;
  } catch (error) {
    logger.error('Error in saveConfiguration function:', error);

    // Handle HttpsError (re-throw as is)
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle other errors
    if (error instanceof Error) {
      throw new HttpsError('internal', `Failed to save configuration: ${error.message}`);
    }

    throw new HttpsError('internal', 'Unknown error occurred while saving configuration');
  }
});

/**
 * This is a separate function for setting up initial configuration
 */
export const initializeConfiguration = onCall(callableOptions, async (request) => {
  try {
    // Detect emulator environment - multiple ways to check
    const isEmulator =
      process.env['FUNCTIONS_EMULATOR'] === 'true' ||
      process.env['FIREBASE_CONFIG'] === undefined ||
      !process.env['FUNCTION_TARGET'];

    // Validate authentication (skip in emulator for testing)
    if (!isEmulator && !request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    logger.info('initializeConfiguration called', {
      isEmulator,
      hasAuth: !!request.auth,
    }); // Run in transaction for atomicity
    const result = await getFirestore().runTransaction(async (transaction: any) => {
      // Check if config already exists
      const configRef = getFirestore().collection('config').doc('globalSettings');
      const configDoc = await transaction.get(configRef);

      if (configDoc.exists) {
        return {
          success: true,
          message: 'Configuration already exists',
          isNew: false,
        };
      } // Get base config from baseSettings
      const baseConfigRef = getFirestore().collection('config').doc('baseSettings');
      const baseConfigDoc = await transaction.get(baseConfigRef);

      if (!baseConfigDoc.exists) {
        throw new HttpsError('not-found', 'Base configuration not found. Please set up base settings first.');
      }

      const baseConfig = baseConfigDoc.data()!;

      // Calculate current student counts
      const studentsQuery = getFirestore().collection('students').where('isActive', '==', true);
      const studentsSnapshot = await studentsQuery.get();

      const floorCounts: Record<string, number> = {};
      baseConfig.floors.forEach((floor: string) => {
        floorCounts[floor] = 0;
      });
      let wifiOptedInCount = 0;
      studentsSnapshot.docs.forEach((doc) => {
        const studentData = doc.data();
        const floor = studentData['floor'];
        if (floorCounts[floor] !== undefined) {
          floorCounts[floor]++;
        }
        if (studentData['optedForWifi'] === true) {
          wifiOptedInCount++;
        }
      });

      // Get current date for billing months
      const now = new Date();
      const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      // Create initial configuration
      const initialConfig = {
        floors: baseConfig.floors,
        bedTypes: baseConfig.bedTypes,
        defaultSecurityDeposit: baseConfig.defaultSecurityDeposit,
        wifiMonthlyCharge: baseConfig.wifiMonthlyCharge,
        currentBillingMonth: currentMonth,
        nextBillingMonth: nextMonth,
        activeStudentCounts: {
          total: studentsSnapshot.size,
          byFloor: floorCounts,
          wifiOptedIn: wifiOptedInCount,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(configRef, initialConfig);

      logger.info('Configuration initialized successfully', {
        totalStudents: studentsSnapshot.size,
        wifiOptedIn: wifiOptedInCount,
        floorCounts,
      });

      return {
        success: true,
        message: 'Configuration initialized successfully',
        isNew: true,
        stats: {
          totalStudents: studentsSnapshot.size,
          wifiOptedIn: wifiOptedInCount,
          floorCounts,
        },
      };
    });

    return result;
  } catch (error) {
    logger.error('Error in initializeConfiguration function:', error);

    // Handle HttpsError (re-throw as is)
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle other errors
    if (error instanceof Error) {
      throw new HttpsError('internal', `Failed to initialize configuration: ${error.message}`);
    }

    throw new HttpsError('internal', 'Unknown error occurred while initializing configuration');
  }
});
