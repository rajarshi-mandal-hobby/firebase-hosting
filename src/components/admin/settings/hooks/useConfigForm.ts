import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useForm } from "@mantine/form";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../../lib/firebase";
import { useConfig } from "../../../../hooks/useConfig";
import { handleError, handleSuccess } from "../../../../utils/notifications";
import type { ConfigData } from "../types/config";

// Form data type
export interface ConfigFormData {
  bedTypes: Record<string, Record<string, string | number>>;
  defaultSecurityDeposit: string | number;
  wifiMonthlyCharge: string | number;
}

// Confirmation modal state type
export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

// Return type for the hook
export interface UseConfigFormReturn {
  // Config data
  config: ConfigData | null;
  loading: boolean;
  error: string | null;

  // Form state
  configForm: ReturnType<typeof useForm<ConfigFormData>>;
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  submitting: boolean;
  showForm: boolean;
  setShowForm: (showForm: boolean) => void;

  // Error states
  fieldErrors: Record<string, string>;
  showValidationErrors: boolean;

  // Confirmation modal
  confirmationModal: ConfirmationModalState;
  setConfirmationModal: (
    modal:
      | ConfirmationModalState
      | ((prev: ConfirmationModalState) => ConfirmationModalState),
  ) => void;

  // Computed values
  shouldShowForm: boolean;
  hasChanges: boolean;
  areAllFieldsFilled: boolean;

  // Helper functions
  handleNumericValue: (value: string | number) => string | number;
  isFieldUnset: (
    value: string | number | undefined,
    allowZero?: boolean,
  ) => boolean;
  getFieldError: (fieldPath: string) => string | undefined;
  clearErrorsOnChange: (fieldPath: string) => void;

  // Action handlers
  handleBedValueChange: (floor: string, value: string | number) => void;
  showConfigurationForm: () => void;
  handleReset: () => void;
  handleUpdate: () => Promise<void>;
}

export const useConfigForm = (): UseConfigFormReturn => {
  const { config, loading, error } = useConfig();

  // Form state
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalState>({
      isOpen: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });

  // Stable empty form values - computed once
  const emptyFormValues = useMemo(
    () => ({
      bedTypes: {
        "2nd": {
          Bed: "",
          Room: "",
          "Special Room": "",
        },
        "3rd": {
          Bed: "",
          Room: "",
        },
      },
      defaultSecurityDeposit: "",
      wifiMonthlyCharge: "",
    }),
    [],
  );

  // Form for configuration values - stable initialization to prevent infinite loops
  const configForm = useForm<ConfigFormData>({
    initialValues: emptyFormValues,
  });
  // Track the last config we synced to avoid infinite loops
  const lastSyncedConfigRef = useRef<ConfigData | null>(null);

  // Sync form values when config loads/changes - using proper key comparison
  useEffect(() => {
    if (
      config &&
      config !== lastSyncedConfigRef.current &&
      config.updatedAt !== lastSyncedConfigRef.current?.updatedAt
    ) {
      lastSyncedConfigRef.current = config;
      configForm.setValues({
        bedTypes: config.bedTypes || {},
        defaultSecurityDeposit: config.defaultSecurityDeposit || 0,
        wifiMonthlyCharge: config.wifiMonthlyCharge || 0,
      });
    }
  }, [config, configForm]);

  // Auto-clear validation errors when edit mode is disabled
  useEffect(() => {
    if (!editMode) {
      setShowValidationErrors(false);
    }
  }, [editMode]);
  // Show form when config exists or when explicitly requested
  const shouldShowForm = Boolean(config) || showForm;

  // Simplified change detection - compare current values with config directly
  const hasChanges = useMemo(() => {
    if (!config || !shouldShowForm) return false;

    const currentValues = configForm.values;

    // Quick comparison with original config values
    if (
      currentValues.defaultSecurityDeposit !==
        (config.defaultSecurityDeposit || 0) ||
      currentValues.wifiMonthlyCharge !== (config.wifiMonthlyCharge || 0)
    ) {
      return true;
    }

    // Compare bed types - only check if structures differ
    const currentBedTypes = currentValues.bedTypes;
    const configBedTypes = config.bedTypes || {};

    // Fast structural comparison
    const currentFloors = Object.keys(currentBedTypes);
    const configFloors = Object.keys(configBedTypes);

    if (currentFloors.length !== configFloors.length) return true;

    for (const floor of currentFloors) {
      const currentFloor = currentBedTypes[floor] || {};
      const configFloor = configBedTypes[floor] || {};

      const currentKeys = Object.keys(currentFloor);
      const configKeys = Object.keys(configFloor);

      if (currentKeys.length !== configKeys.length) return true;

      for (const bedType of currentKeys) {
        if (currentFloor[bedType] !== configFloor[bedType]) return true;
      }
    }

    return false;
  }, [configForm.values, config, shouldShowForm]);
  // Helper function to handle number input values properly
  const handleNumericValue = useCallback(
    (value: string | number): string | number => {
      if (typeof value === "number") return value;
      if (value === "" || value === undefined || value === null) return "";
      return value;
    },
    [],
  );
  // Helper function to check if a field has empty/unset value
  const isFieldUnset = useCallback(
    (
      value: string | number | undefined,
      allowZero: boolean = false,
    ): boolean => {
      if (value === "" || value === null || value === undefined) return true;
      if (!allowZero && value === 0) return true;
      return false;
    },
    [],
  );
  // Derived value - check if all required fields are filled (optimized with useMemo)
  const areAllFieldsFilled = useMemo(() => {
    const values = configForm.values;

    // Quick check for other fields first (most likely to be empty)
    if (isFieldUnset(values.defaultSecurityDeposit)) return false;
    if (isFieldUnset(values.wifiMonthlyCharge, true)) return false;

    // Only check bed types if other fields are filled
    const bedTypes = values.bedTypes;
    const requiredFloors = ["2nd", "3rd"];
    const requiredBedTypes = {
      "2nd": ["Bed", "Room", "Special Room"],
      "3rd": ["Bed", "Room"],
    };

    // Check if all required floors and bed types have values
    for (const floor of requiredFloors) {
      const floorData = bedTypes[floor];
      if (!floorData) return false;

      const requiredTypes =
        requiredBedTypes[floor as keyof typeof requiredBedTypes];
      for (const bedType of requiredTypes) {
        if (isFieldUnset(floorData[bedType])) return false;
      }
    }
    return true;
  }, [configForm.values, isFieldUnset]);

  // Lazy memoized validation error parser
  const parseValidationError = useCallback(
    (errorMessage: string): Record<string, string> => {
      const errors: Record<string, string> = {};

      // Early return for empty messages
      if (!errorMessage || typeof errorMessage !== "string") return errors;

      // Use lazy evaluation - only check patterns that might match
      const errorChecks = [
        {
          pattern: "2nd floor Bed rate must be at least",
          field: "bedTypes.2nd.Bed",
          message: "Must be at least 1000",
        },
        {
          pattern: "2nd floor Room rate must be at least",
          field: "bedTypes.2nd.Room",
          message: "Must be at least 1000",
        },
        {
          pattern: "2nd floor Special Room rate must be at least",
          field: "bedTypes.2nd.Special Room",
          message: "Must be at least 1000",
        },
        {
          pattern: "3rd floor Bed rate must be at least",
          field: "bedTypes.3rd.Bed",
          message: "Must be at least 1000",
        },
        {
          pattern: "3rd floor Room rate must be at least",
          field: "bedTypes.3rd.Room",
          message: "Must be at least 1000",
        },
        {
          pattern: "Default security deposit must be at least",
          field: "defaultSecurityDeposit",
          message: "Must be at least 1000",
        },
        {
          pattern: "WiFi monthly charge must be a valid number",
          field: "wifiMonthlyCharge",
          message: "Must be a valid number",
        },
      ];

      // Use some() for early termination when pattern found
      errorChecks.forEach(({ pattern, field, message }) => {
        if (errorMessage.includes(pattern)) {
          errors[field] = message;
        }
      });

      return errors;
    },
    [],
  );

  // Helper function to get field-specific error message
  const getFieldError = (fieldPath: string): string | undefined => {
    return fieldErrors[fieldPath];
  };

  // Optimized field error clearing - avoids dependency on fieldErrors object
  const clearFieldError = useCallback(
    (fieldPath: string): void => {
      setFieldErrors((prev) => {
        if (prev[fieldPath]) {
          const newErrors = { ...prev };
          delete newErrors[fieldPath];
          return newErrors;
        }
        return prev; // No change if error doesn't exist
      });
    },
    [], // No dependencies needed with functional update
  );

  // Optimized function to clear both field and validation errors
  const clearErrorsOnChange = useCallback(
    (fieldPath: string) => {
      clearFieldError(fieldPath);
      setShowValidationErrors(false);
    },
    [clearFieldError],
  );

  // Helper function to show configuration form without creating base config
  const showConfigurationForm = useCallback((): void => {
    setEditMode(true);
    setShowForm(true);
    // Initialize with empty values
    configForm.setValues(emptyFormValues);
  }, [configForm, emptyFormValues]);

  // Helper function to auto-fill room values when bed value changes
  const handleBedValueChange = useCallback(
    (floor: string, value: string | number) => {
      configForm.setFieldValue(`bedTypes.${floor}.Bed`, value);
      clearErrorsOnChange(`bedTypes.${floor}.Bed`);

      // Auto-fill room value on focus loss (double the bed value)
      if (value && value !== "") {
        const numValue =
          typeof value === "number" ? value : parseFloat(value.toString());
        if (!isNaN(numValue) && numValue > 0) {
          configForm.setFieldValue(`bedTypes.${floor}.Room`, numValue * 2);
          clearErrorsOnChange(`bedTypes.${floor}.Room`);
        }
      }
    },
    [configForm, clearErrorsOnChange],
  );

  // Reset form to original config values
  const handleReset = useCallback(() => {
    if (!config) return;

    setConfirmationModal({
      isOpen: true,
      title: "Reset Configuration",
      message:
        "Are you sure you want to reset all configuration to the original values? This will discard any unsaved changes.",
      onConfirm: () => {
        // Reset to original config values
        configForm.setValues({
          bedTypes: config.bedTypes || {},
          defaultSecurityDeposit: config.defaultSecurityDeposit || 0,
          wifiMonthlyCharge: config.wifiMonthlyCharge || 0,
        });
        // Clear validation errors and field errors
        setShowValidationErrors(false);
        setFieldErrors({});
        handleSuccess(
          "All values have been reset to original configuration",
          "Configuration Reset",
        );
      },
    });
  }, [config, configForm]);

  const handleUpdate = async () => {
    // Check if all required fields are filled, if not show validation errors
    if (!areAllFieldsFilled) {
      setShowValidationErrors(true);
      handleError(
        "Please fill in all required fields before updating",
        "Validation Error",
      );
      return;
    }

    // Create summary of all field values for confirmation
    const values = configForm.values;
    const valuesList = [
      `2nd Floor - Bed: ${values.bedTypes["2nd"]?.["Bed"] || "Not set"}`,
      `2nd Floor - Room: ${values.bedTypes["2nd"]?.["Room"] || "Not set"}`,
      `2nd Floor - Special Room: ${values.bedTypes["2nd"]?.["Special Room"] || "Not set"}`,
      `3rd Floor - Bed: ${values.bedTypes["3rd"]?.["Bed"] || "Not set"}`,
      `3rd Floor - Room: ${values.bedTypes["3rd"]?.["Room"] || "Not set"}`,
      `Security Deposit: ${values.defaultSecurityDeposit || "Not set"}`,
      `Wi-Fi: ${values.wifiMonthlyCharge || "Not set"}`,
    ];

    setConfirmationModal({
      isOpen: true,
      title: "Confirm Configuration Update",
      message: `Please review the following values:\n\n${valuesList.join("\n")}`,
      onConfirm: () => performUpdate(configForm.values),
    });
  };

  const performUpdate = async (formData: ConfigFormData) => {
    try {
      setSubmitting(true);

      // Convert form data to numbers with basic validation
      const processedData = {
        bedTypes: {} as Record<string, Record<string, number>>,
        defaultSecurityDeposit: 0,
        wifiMonthlyCharge: 0,
      };

      // Process bed types - basic conversion only
      for (const floor of Object.keys(formData.bedTypes)) {
        processedData.bedTypes[floor] = {};
        const floorData = formData.bedTypes[floor];
        if (floorData) {
          for (const bedType of Object.keys(floorData)) {
            const value = floorData[bedType];
            if (value === undefined || value === "") continue;

            const numValue =
              typeof value === "number" ? value : parseFloat(value.toString());
            if (isNaN(numValue)) {
              handleError(
                `${floor} Floor - ${bedType} must be a valid number`,
                "Validation Error",
              );
              return;
            }
            processedData.bedTypes[floor][bedType] = numValue;
          }
        }
      }

      // Process security deposit - basic conversion only
      const securityDeposit =
        typeof formData.defaultSecurityDeposit === "number"
          ? formData.defaultSecurityDeposit
          : parseFloat(formData.defaultSecurityDeposit.toString());

      if (isNaN(securityDeposit)) {
        handleError(
          "Security Deposit must be a valid number",
          "Validation Error",
        );
        return;
      }
      processedData.defaultSecurityDeposit = securityDeposit;

      // Process Wi-Fi charge - basic conversion only
      const wifiCharge =
        typeof formData.wifiMonthlyCharge === "number"
          ? formData.wifiMonthlyCharge
          : parseFloat(formData.wifiMonthlyCharge.toString());

      if (isNaN(wifiCharge)) {
        handleError("Wi-Fi charge must be a valid number", "Validation Error");
        return;
      }
      processedData.wifiMonthlyCharge = wifiCharge;

      // Call cloud function to save configuration - let backend handle complex validation
      const saveConfigFunction = httpsCallable(functions, "saveConfiguration");
      const result = await saveConfigFunction(processedData);

      // Check if the operation was successful
      if (
        result.data &&
        typeof result.data === "object" &&
        "success" in result.data
      ) {
        const response = result.data as { success: boolean; message: string };
        if (response.success) {
          handleSuccess(
            "Configuration updated successfully",
            "Configuration Update",
          );
          setFieldErrors({}); // Clear any previous field errors
          setShowValidationErrors(false); // Clear validation error state
        } else {
          // Parse validation errors and set field-specific errors
          const validationErrors = parseValidationError(response.message || "");
          if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
          } else {
            // If we can't parse specific fields, show generic error
            handleError(
              response.message || "Failed to update configuration",
              "Configuration Update",
            );
          }
        }
      } else {
        handleError("Unexpected response from server", "Configuration Update");
      }
    } catch (error) {
      // Handle network or other errors
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as { message: string }).message;
        const validationErrors = parseValidationError(errorMessage);
        if (Object.keys(validationErrors).length > 0) {
          setFieldErrors(validationErrors);
        } else {
          handleError(error, "Configuration Update");
        }
      } else {
        handleError(error, "Configuration Update");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    // Config data
    config,
    loading,
    error,

    // Form state
    configForm,
    editMode,
    setEditMode,
    submitting,
    showForm,
    setShowForm,

    // Error states
    fieldErrors,
    showValidationErrors,

    // Confirmation modal
    confirmationModal,
    setConfirmationModal,

    // Computed values
    shouldShowForm,
    hasChanges,
    areAllFieldsFilled,

    // Helper functions
    handleNumericValue,
    isFieldUnset,
    getFieldError,
    clearErrorsOnChange,

    // Action handlers
    handleBedValueChange,
    showConfigurationForm,
    handleReset,
    handleUpdate,
  };
};
