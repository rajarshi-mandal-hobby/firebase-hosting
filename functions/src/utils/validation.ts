// Backend validation utilities for configuration data
import { HttpsError } from 'firebase-functions/v2/https';

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface ConfigUpdateData {
  bedTypes?: Record<string, Record<string, number>>;
  defaultSecurityDeposit?: number;
  wifiMonthlyCharge?: number;
}

/**
 * Trim and sanitize string values
 */
export const sanitizeString = (value: any): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

/**
 * Validate and sanitize numeric values
 */
export const sanitizeNumber = (value: any, fieldName: string, minValue?: number): number => {
  if (value === null || value === undefined) {
    throw new HttpsError('invalid-argument', `${fieldName} is required`);
  }
  
  const numValue = Number(value);
  if (isNaN(numValue)) {
    throw new HttpsError('invalid-argument', `${fieldName} must be a valid number`);
  }
  
  if (numValue < 0) {
    throw new HttpsError('invalid-argument', `${fieldName} cannot be negative`);
  }
  
  if (minValue !== undefined && numValue < minValue) {
    throw new HttpsError('invalid-argument', `${fieldName} must be at least ${minValue}`);
  }
  
  return numValue;
};

/**
 * Validate bed types configuration
 */
export const validateBedTypes = (bedTypes: any): Record<string, Record<string, number>> => {
  if (!bedTypes || typeof bedTypes !== 'object') {
    throw new HttpsError('invalid-argument', 'Bed types configuration is required');
  }

  const validatedBedTypes: Record<string, Record<string, number>> = {};
  const allowedFloors = ['2nd', '3rd'];
  const allowedBedTypes = ['Bed', 'Room', 'Special Room'];

  for (const floor of allowedFloors) {
    if (!bedTypes[floor] || typeof bedTypes[floor] !== 'object') {
      throw new HttpsError('invalid-argument', `Configuration for ${floor} floor is required`);
    }

    validatedBedTypes[floor] = {};
      for (const bedType of allowedBedTypes) {
      if (bedTypes[floor][bedType] !== undefined) {
        validatedBedTypes[floor][bedType] = sanitizeNumber(
          bedTypes[floor][bedType], 
          `${floor} floor ${bedType} rate`,
          1000 // Minimum value of 1000 for all bed types
        );
      }
    }

    // Ensure at least one bed type is configured for each floor
    if (Object.keys(validatedBedTypes[floor]).length === 0) {
      throw new HttpsError('invalid-argument', `At least one bed type must be configured for ${floor} floor`);
    }
  }

  return validatedBedTypes;
};

/**
 * Validate complete configuration update data
 */
export const validateConfigUpdate = (data: any): ConfigValidationResult => {
  const errors: string[] = [];
  const sanitizedData: ConfigUpdateData = {};

  try {
    // Validate bed types
    if (data.bedTypes !== undefined) {
      sanitizedData.bedTypes = validateBedTypes(data.bedTypes);
    }    // Validate security deposit
    if (data.defaultSecurityDeposit !== undefined) {
      sanitizedData.defaultSecurityDeposit = sanitizeNumber(
        data.defaultSecurityDeposit, 
        'Default security deposit',
        1000 // Minimum value of 1000 for security deposit
      );
    }    // Validate WiFi charges (can be 0, so no minimum value)
    if (data.wifiMonthlyCharge !== undefined) {
      sanitizedData.wifiMonthlyCharge = sanitizeNumber(
        data.wifiMonthlyCharge, 
        'WiFi monthly charge'
        // No minimum value - Wi-Fi can be 0
      );
    }

    // Ensure at least one field is being updated
    if (Object.keys(sanitizedData).length === 0) {
      throw new HttpsError('invalid-argument', 'At least one configuration field must be provided for update');
    }

    return {
      isValid: true,
      errors: [],
      sanitizedData
    };

  } catch (error) {
    if (error instanceof HttpsError) {
      errors.push(error.message);
    } else {
      errors.push('Unknown validation error occurred');
    }

    return {
      isValid: false,
      errors,
    };
  }
};

/**
 * Log validation results for debugging
 */
export const logValidationResult = (result: ConfigValidationResult, functionName: string): void => {
  if (result.isValid) {
    console.log(`✅ ${functionName}: Validation successful`);
  } else {
    console.error(`❌ ${functionName}: Validation failed`, { errors: result.errors });
  }
};
