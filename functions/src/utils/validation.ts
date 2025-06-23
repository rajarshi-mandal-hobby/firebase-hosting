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

// =============================================
// MEMBER VALIDATION INTERFACES AND TYPES
// =============================================

export interface MemberValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: ValidatedMemberData;
}

export interface ValidatedMemberData {
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  moveInDate: Date;
  securityDeposit: number;
  advanceDeposit: number;
  rentAtJoining: number;
  fullPayment: boolean;
  actualAmountPaid?: number;
}

export interface MemberUpdateData {
  memberId: string;
  floor: string;
  bedType: string;
  currentRent: number;
}

// =============================================
// MEMBER VALIDATION FUNCTIONS
// =============================================

/**
 * Generate secure member ID from name and phone
 */
export const generateMemberId = (name: string, phone: string): string => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  return `${cleanName}_${cleanPhone}`;
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: any): string => {
  if (!phone || typeof phone !== 'string') {
    throw new HttpsError('invalid-argument', 'Phone number is required');
  }

  const cleanPhone = phone.replace(/\s/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
    throw new HttpsError('invalid-argument', 'Valid phone number is required (10-15 digits)');
  }

  return cleanPhone;
};

/**
 * Validate floor value
 */
export const validateFloor = (floor: any): string => {
  const allowedFloors = ['2nd', '3rd'];
  
  if (!floor || typeof floor !== 'string') {
    throw new HttpsError('invalid-argument', 'Floor is required');
  }

  if (!allowedFloors.includes(floor)) {
    throw new HttpsError('invalid-argument', `Floor must be one of: ${allowedFloors.join(', ')}`);
  }

  return floor;
};

/**
 * Validate bed type value
 */
export const validateBedType = (bedType: any): string => {
  const allowedBedTypes = ['Bed', 'Room', 'Special Room'];
  
  if (!bedType || typeof bedType !== 'string') {
    throw new HttpsError('invalid-argument', 'Bed type is required');
  }

  if (!allowedBedTypes.includes(bedType)) {
    throw new HttpsError('invalid-argument', `Bed type must be one of: ${allowedBedTypes.join(', ')}`);
  }

  return bedType;
};

/**
 * Validate move-in date
 */
export const validateMoveInDate = (moveInDate: any): Date => {
  if (!moveInDate) {
    throw new HttpsError('invalid-argument', 'Move-in date is required');
  }

  const moveInDateObj = new Date(moveInDate);
  if (isNaN(moveInDateObj.getTime())) {
    throw new HttpsError('invalid-argument', 'Invalid move-in date format');
  }

  // Check if date is not too far in the future (more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (moveInDateObj > oneYearFromNow) {
    throw new HttpsError('invalid-argument', 'Move-in date cannot be more than 1 year in the future');
  }

  return moveInDateObj;
};

/**
 * Validate complete member data for adding a new member
 */
export const validateMemberData = (data: any): MemberValidationResult => {
  const errors: string[] = [];
  
  try {
    const sanitizedData: ValidatedMemberData = {
      name: sanitizeString(data.name),
      phone: validatePhoneNumber(data.phone),
      floor: validateFloor(data.floor),
      bedType: validateBedType(data.bedType),
      moveInDate: validateMoveInDate(data.moveInDate),
      securityDeposit: sanitizeNumber(data.securityDeposit, 'Security deposit', 0),
      advanceDeposit: sanitizeNumber(data.advanceDeposit, 'Advance deposit', 0),
      rentAtJoining: sanitizeNumber(data.rentAtJoining, 'Rent at joining', 1000),      fullPayment: data.fullPayment === true,
      actualAmountPaid: data.fullPayment === true ? sanitizeNumber(data.actualAmountPaid, 'Actual amount paid', 0) : 0
    };

    // Additional name validation
    if (sanitizedData.name.length === 0) {
      throw new HttpsError('invalid-argument', 'Valid name is required');
    }

    if (sanitizedData.name.length < 2) {
      throw new HttpsError('invalid-argument', 'Name must be at least 2 characters long');
    }

    // Full payment validation
    if (typeof data.fullPayment !== 'boolean') {
      throw new HttpsError('invalid-argument', 'Full payment flag must be boolean');
    }

    if (!sanitizedData.fullPayment) {
      if (data.actualAmountPaid === undefined || data.actualAmountPaid === null) {
        throw new HttpsError('invalid-argument', 'Actual amount paid is required when full payment is false');
      }
      sanitizedData.actualAmountPaid = sanitizeNumber(data.actualAmountPaid, 'Actual amount paid', 0);
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
      errors
    };
  }
};

/**
 * Validate member update data
 */
export const validateMemberUpdateData = (data: any): MemberValidationResult => {
  const errors: string[] = [];
  
  try {
    if (!data.memberId || typeof data.memberId !== 'string') {
      throw new HttpsError('invalid-argument', 'Valid member ID is required');
    }

    const updateData: MemberUpdateData = {
      memberId: sanitizeString(data.memberId),
      floor: validateFloor(data.floor),
      bedType: validateBedType(data.bedType),
      currentRent: sanitizeNumber(data.currentRent, 'Current rent', 1000)
    };

    return {
      isValid: true,
      errors: [],
      sanitizedData: updateData as any
    };

  } catch (error) {
    if (error instanceof HttpsError) {
      errors.push(error.message);
    } else {
      errors.push('Unknown validation error occurred');
    }

    return {
      isValid: false,
      errors
    };
  }
};

/**
 * Validate member ID for deactivation
 */
export const validateMemberIdForDeactivation = (memberId: any): string => {
  if (!memberId || typeof memberId !== 'string') {
    throw new HttpsError('invalid-argument', 'Valid member ID is required');
  }

  const cleanMemberId = sanitizeString(memberId);
  if (cleanMemberId.length === 0) {
    throw new HttpsError('invalid-argument', 'Member ID cannot be empty');
  }

  return cleanMemberId;
};
