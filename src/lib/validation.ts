// Validation schemas and utility functions for form validation
import { isValidPhoneNumber } from './calculations';

// =============================================
// VALIDATION RULES
// =============================================

export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must contain only letters and spaces (2-50 characters)'
  },
  phone: {
    pattern: /^(\+91)?\d{10}$/,
    message: 'Phone number must be 10 digits (with or without +91)'
  },
  amount: {
    min: 0,
    max: 100000,
    message: 'Amount must be between ₹0 and ₹1,00,000'
  },
  deposit: {
    min: 500,
    max: 50000,
    message: 'Deposit must be between ₹500 and ₹50,000'
  },
  rent: {
    min: 1000,
    max: 10000,
    message: 'Rent must be between ₹1,000 and ₹10,000'
  }
};

// =============================================
// VALIDATION FUNCTIONS
// =============================================

/**
 * Validate student name
 */
export const validateName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return 'Name is required';
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < VALIDATION_RULES.name.minLength) {
    return `Name must be at least ${VALIDATION_RULES.name.minLength} characters`;
  }
  
  if (trimmedName.length > VALIDATION_RULES.name.maxLength) {
    return `Name must not exceed ${VALIDATION_RULES.name.maxLength} characters`;
  }
  
  if (!VALIDATION_RULES.name.pattern.test(trimmedName)) {
    return 'Name must contain only letters and spaces';
  }
  
  return null;
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim().length === 0) {
    return 'Phone number is required';
  }
  
  if (!isValidPhoneNumber(phone)) {
    return VALIDATION_RULES.phone.message;
  }
  
  return null;
};

/**
 * Validate monetary amount
 */
export const validateAmount = (amount: number | string, field: string = 'Amount'): string | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${field} must be a valid number`;
  }
  
  if (numAmount < 0) {
    return `${field} cannot be negative`;
  }
  
  if (numAmount > VALIDATION_RULES.amount.max) {
    return `${field} cannot exceed ₹${VALIDATION_RULES.amount.max.toLocaleString()}`;
  }
  
  return null;
};

/**
 * Validate deposit amount
 */
export const validateDeposit = (amount: number | string, field: string = 'Deposit'): string | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return `${field} must be a valid number`;
  }
  
  if (numAmount < VALIDATION_RULES.deposit.min) {
    return `${field} must be at least ₹${VALIDATION_RULES.deposit.min}`;
  }
  
  if (numAmount > VALIDATION_RULES.deposit.max) {
    return `${field} cannot exceed ₹${VALIDATION_RULES.deposit.max.toLocaleString()}`;
  }
  
  return null;
};

/**
 * Validate rent amount
 */
export const validateRent = (amount: number | string): string | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'Rent must be a valid number';
  }
  
  if (numAmount < VALIDATION_RULES.rent.min) {
    return `Rent must be at least ₹${VALIDATION_RULES.rent.min}`;
  }
  
  if (numAmount > VALIDATION_RULES.rent.max) {
    return `Rent cannot exceed ₹${VALIDATION_RULES.rent.max.toLocaleString()}`;
  }
  
  return null;
};

/**
 * Validate date
 */
export const validateDate = (date: Date | string, field: string = 'Date'): string | null => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return `${field} must be a valid date`;
  }
  
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  
  if (dateObj > oneYearFromNow) {
    return `${field} cannot be more than 1 year in the future`;
  }
  
  if (dateObj < oneYearAgo) {
    return `${field} cannot be more than 1 year in the past`;
  }
  
  return null;
};

/**
 * Validate floor selection
 */
export const validateFloor = (floor: string, availableFloors: string[]): string | null => {
  if (!floor || floor.trim().length === 0) {
    return 'Floor selection is required';
  }
  
  if (!availableFloors.includes(floor)) {
    return `Invalid floor selection. Available floors: ${availableFloors.join(', ')}`;
  }
  
  return null;
};

/**
 * Validate bed type selection
 */
export const validateBedType = (
  bedType: string, 
  floor: string, 
  availableBedTypes: Record<string, Record<string, number>>
): string | null => {
  if (!bedType || bedType.trim().length === 0) {
    return 'Bed type selection is required';
  }
  
  if (!floor) {
    return 'Floor must be selected first';
  }
  
  const floorBedTypes = availableBedTypes[floor];
  if (!floorBedTypes || !floorBedTypes[bedType]) {
    const available = floorBedTypes ? Object.keys(floorBedTypes).join(', ') : 'None';
    return `Invalid bed type for ${floor} floor. Available: ${available}`;
  }
  
  return null;
};

// =============================================
// FORM VALIDATION SCHEMAS
// =============================================

import type { AddStudentFormData, EditStudentFormData, ConfigData } from '../types';

/**
 * Validate add student form data
 */
export const validateAddStudentForm = (data: AddStudentFormData, config: ConfigData | null) => {
  const errors: Record<string, string> = {};
  
  // Name validation
  const nameError = validateName(data.name);
  if (nameError) errors['name'] = nameError;
  
  // Phone validation
  const phoneError = validatePhone(data.phone);
  if (phoneError) errors['phone'] = phoneError;
    // Floor validation
  const floorError = validateFloor(data.floor, config?.floors || []);
  if (floorError) errors['floor'] = floorError;
  
  // Bed type validation
  const bedTypeError = validateBedType(data.bedType, data.floor, config?.bedTypes || {});
  if (bedTypeError) errors['bedType'] = bedTypeError;
  
  // Move-in date validation
  const dateError = validateDate(data.moveInDate, 'Move-in date');
  if (dateError) errors['moveInDate'] = dateError;
  
  // Security deposit validation
  const securityDepositError = validateDeposit(data.securityDeposit, 'Security deposit');
  if (securityDepositError) errors['securityDeposit'] = securityDepositError;
  
  // Advance deposit validation
  const advanceDepositError = validateDeposit(data.advanceDeposit, 'Advance deposit');
  if (advanceDepositError) errors['advanceDeposit'] = advanceDepositError;
  
  // Rent at joining validation
  const rentError = validateRent(data.rentAtJoining);
  if (rentError) errors['rentAtJoining'] = rentError;
    // Actual amount paid validation (if full payment is false)
  if (!data.fullPayment) {
    const actualAmountError = validateAmount(data.actualAmountPaid || 0, 'Actual amount paid');
    if (actualAmountError) errors['actualAmountPaid'] = actualAmountError;
    
    // Check if actual amount doesn't exceed total deposit
    const totalDeposit = (data.securityDeposit || 0) + (data.advanceDeposit || 0) + (data.rentAtJoining || 0);
    if ((data.actualAmountPaid || 0) > totalDeposit) {
      errors['actualAmountPaid'] = 'Actual amount paid cannot exceed total deposit agreed';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate edit student form data
 */
export const validateEditStudentForm = (data: EditStudentFormData, config: ConfigData | null) => {
  const errors: Record<string, string> = {};
  
  // Floor validation
  const floorError = validateFloor(data.floor, config?.floors || []);
  if (floorError) errors['floor'] = floorError;
  
  // Bed type validation
  const bedTypeError = validateBedType(data.bedType, data.floor, config?.bedTypes || {});
  if (bedTypeError) errors['bedType'] = bedTypeError;
  
  // Current rent validation
  const rentError = validateRent(data.currentRent);
  if (rentError) errors['currentRent'] = rentError;
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate billing form data
 */
export const validateBillingForm = (data: { electricityAmounts?: Record<string, number>; wifiAmount?: number }) => {
  const errors: Record<string, string> = {};
  
  // Electricity amounts validation
  if (data.electricityAmounts) {
    Object.entries(data.electricityAmounts).forEach(([floor, amount]: [string, number]) => {
      const amountError = validateAmount(amount, `Electricity amount for ${floor} floor`);
      if (amountError) errors[`electricity_${floor}`] = amountError;
    });
  }
  
  // WiFi amount validation
  if (data.wifiAmount !== undefined) {
    const wifiError = validateAmount(data.wifiAmount, 'WiFi amount');
    if (wifiError) errors['wifiAmount'] = wifiError;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Check if form has any validation errors
 */
export const hasValidationErrors = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Get first validation error message
 */
export const getFirstError = (errors: Record<string, string>): string | null => {
  const firstKey = Object.keys(errors)[0];
  return firstKey ? (errors[firstKey] || null) : null;
};

/**
 * Clean form data by trimming strings and converting numbers
 */
export const cleanFormData = (data: Record<string, unknown>): Record<string, unknown> => {
  const cleaned: Record<string, unknown> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      cleaned[key] = value.trim();
    } else if (typeof value === 'number' || value instanceof Date) {
      cleaned[key] = value;
    } else if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};
