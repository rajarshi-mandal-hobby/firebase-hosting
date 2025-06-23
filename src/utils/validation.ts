// Frontend validation utilities for configuration forms
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Trim and sanitize string values
 */
export const trimString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

/**
 * Validate numeric input values
 */
export const validateNumber = (
  value: unknown,
  fieldName: string,
  min = 0,
): { isValid: boolean; error?: string; value?: number } => {
  if (value === null || value === undefined || value === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const numValue = Number(value);
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (numValue < min) {
    return { isValid: false, error: `${fieldName} cannot be less than ${min}` };
  }

  return { isValid: true, value: numValue };
};

/**
 * Validate bed type rates for a specific floor
 */
export const validateFloorBedTypes = (
  floorData: Record<string, number>,
  floorName: string,
): ValidationResult => {
  const errors: Record<string, string> = {};
  let hasValidBedType = false;

  const bedTypes = ["Bed", "Room", "Special Room"];

  for (const bedType of bedTypes) {
    if (floorData[bedType] !== undefined && floorData[bedType] !== null) {
      const validation = validateNumber(
        floorData[bedType],
        `${floorName} ${bedType}`,
      );
      if (!validation.isValid) {
        errors[`${floorName}.${bedType}`] = validation.error!;
      } else {
        hasValidBedType = true;
      }
    }
  }

  if (!hasValidBedType) {
    errors[`${floorName}.general`] =
      `At least one bed type must be configured for ${floorName} floor`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate complete configuration form data
 */
export const validateConfigForm = (formData: {
  bedTypes: Record<string, Record<string, number>>;
  defaultSecurityDeposit: number;
  wifiMonthlyCharge: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate bed types for each floor
  const floors = ["2nd", "3rd"];
  for (const floor of floors) {
    if (formData.bedTypes[floor]) {
      const floorValidation = validateFloorBedTypes(
        formData.bedTypes[floor],
        floor,
      );
      if (!floorValidation.isValid) {
        Object.assign(errors, floorValidation.errors);
      }
    } else {
      errors[`${floor}.general`] =
        `Configuration for ${floor} floor is required`;
    }
  }

  // Validate security deposit
  const securityDepositValidation = validateNumber(
    formData.defaultSecurityDeposit,
    "Security deposit",
  );
  if (!securityDepositValidation.isValid) {
    errors["defaultSecurityDeposit"] = securityDepositValidation.error!;
  }

  // Validate WiFi charges
  const wifiValidation = validateNumber(
    formData.wifiMonthlyCharge,
    "WiFi monthly charge",
  );
  if (!wifiValidation.isValid) {
    errors["wifiMonthlyCharge"] = wifiValidation.error!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Sanitize form data before submission
 */
export const sanitizeConfigFormData = (formData: Record<string, unknown>) => {
  return {
    bedTypes:
      (formData["bedTypes"] as Record<string, Record<string, number>>) || {},
    defaultSecurityDeposit: Number(formData["defaultSecurityDeposit"]) || 0,
    wifiMonthlyCharge: Number(formData["wifiMonthlyCharge"]) || 0,
  };
};
