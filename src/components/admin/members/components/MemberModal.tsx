// Member Modal Component - Handles add/edit member form
import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Switch,
  Button,
  Group,
  LoadingOverlay,
  Dialog,
  Text,
  Alert,
  Divider,
} from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { useConfig } from "../../../../hooks/useConfig";
import { useMemberOperations } from "../hooks/useMemberOperations";
import { useAuth } from "../../../../hooks/useAuth";
import type { AddMemberFormData } from "../types/member";
import type {
  MemberModalProps,
  MemberFormData,
  MemberFormErrors,
} from "../types";

const MemberModal: React.FC<MemberModalProps> = ({
  opened,
  onClose,
  editingMember,
  hasOnlyOneRentHistory = false,
}) => {
  const { config, loading: configLoading, error: configError } = useConfig();
  const { addMember, updateMember } = useMemberOperations();
  const { user, userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showConfigError, setShowConfigError] = useState(false);
  const [fullPayment, setFullPayment] = useState(true);
  // Add validation state and errors
  const [errors, setErrors] = useState<MemberFormErrors>({});

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return "Member name is required";
    const words = name.trim().split(/\s+/);
    if (words.length < 2)
      return "Name should contain at least 2 words (first name and last name)";
    return "";
  };

  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return "Phone number is required";
    const phoneDigits = phone.replace(/\D/g, ""); // Remove non-digits
    if (phoneDigits.length !== 10)
      return "Phone number must be exactly 10 digits";
    if (!/^[6-9]/.test(phoneDigits))
      return "Phone number must start with 6, 7, 8, or 9";
    return "";
  };
  const validateForm = (): boolean => {
    const newErrors: MemberFormErrors = {};

    // Name validation
    const nameError = validateName(formData.name);
    if (nameError) newErrors["name"] = nameError;

    // Phone validation
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors["phone"] = phoneError;

    // Floor validation
    if (!formData.floor) newErrors["floor"] = "Floor is required";

    // Bed type validation
    if (!formData.bedType) newErrors["bedType"] = "Bed type is required";

    // Amount paid validation for new members with partial payment
    if (isNewMember && !fullPayment && formData.actualAmountPaid <= 0) {
      newErrors["actualAmountPaid"] =
        "Amount paid is required and must be greater than 0";
    }

    // Additional validation: Amount paid should not exceed total deposit
    if (
      isNewMember &&
      !fullPayment &&
      formData.actualAmountPaid > totalDepositAgreed
    ) {
      newErrors["actualAmountPaid"] =
        `Amount paid cannot exceed total deposit agreed (₹${totalDepositAgreed.toLocaleString()})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    phone: "",
    floor: "",
    bedType: "",
    moveInDate: new Date(),
    rentAtJoining: 0,
    currentRent: 0,
    securityDeposit: 0,
    advanceDeposit: 0,
    actualAmountPaid: 0,
  });

  const isNewMember = !editingMember;
  const canEditAll = isNewMember || hasOnlyOneRentHistory;

  // Reset form when modal opens/closes or editing member changes
  useEffect(() => {
    if (editingMember) {
      setFormData({
        name: editingMember.name,
        phone: editingMember.phone,
        floor: editingMember.floor,
        bedType: editingMember.bedType,
        moveInDate: editingMember.moveInDate,
        rentAtJoining: editingMember.rentAtJoining,
        currentRent: editingMember.currentRent,
        securityDeposit: editingMember.securityDeposit,
        advanceDeposit: editingMember.advanceDeposit,
        actualAmountPaid: 0,
      });
    } else {
      // New member - set defaults
      const currentDate = new Date();
      setFormData({
        name: "",
        phone: "",
        floor: "",
        bedType: "",
        moveInDate: currentDate,
        rentAtJoining: 0,
        currentRent: 0,
        securityDeposit: config?.defaultSecurityDeposit || 1000,
        advanceDeposit: 0,
        actualAmountPaid: 0,
      });
    }
  }, [editingMember, opened, config]);

  // Handle config errors
  useEffect(() => {
    if (configError && opened) {
      setShowConfigError(true);
      onClose();
    }
  }, [configError, opened, onClose]);

  // Available floors from config
  const availableFloors = useMemo(() => {
    if (!config?.floors || !Array.isArray(config.floors)) {
      return [];
    }
    return config.floors.map((floor) => ({
      value: floor,
      label: `${floor} Floor`,
    }));
  }, [config?.floors]);

  // Available bed types for selected floor
  const availableBedTypes = useMemo(() => {
    if (!config?.bedTypes || !formData.floor) {
      return [];
    }
    
    const floorBedTypes = config.bedTypes[formData.floor];
    if (!floorBedTypes || typeof floorBedTypes !== 'object') {
      return [];
    }
    
    return Object.keys(floorBedTypes).map((bedType) => ({
      value: bedType,
      label: bedType,
    }));
  }, [config?.bedTypes, formData.floor]);

  // Auto-populate rent and calculate deposits when both floor and bedType are selected
  useEffect(() => {
    if (config && formData.floor && formData.bedType) {
      const rentAmount = config.bedTypes?.[formData.floor]?.[formData.bedType];
      if (rentAmount && rentAmount > 0) {
        setFormData((prev) => ({
          ...prev,
          currentRent: rentAmount,
          rentAtJoining: isNewMember ? rentAmount : prev.rentAtJoining,
          advanceDeposit: isNewMember ? rentAmount : prev.advanceDeposit, // Auto-calculate advance deposit = rent at joining
        }));
      }
    } else {
      // Reset rent fields when floor or bedType is not selected
      setFormData((prev) => ({
        ...prev,
        currentRent: 0,
        rentAtJoining: 0,
        advanceDeposit: 0,
      }));
    }
  }, [config, formData.floor, formData.bedType, isNewMember]);

  // Calculate total deposit agreed
  const totalDepositAgreed =
    formData.securityDeposit + formData.advanceDeposit + formData.rentAtJoining;

  // Handle full payment toggle - based on Firestore.txt workflow
  useEffect(() => {
    if (fullPayment && isNewMember) {
      setFormData((prev) => ({
        ...prev,
        actualAmountPaid: totalDepositAgreed,
      }));
    } else if (!fullPayment && isNewMember) {
      // Reset to blank for admin to fill manually
      setFormData((prev) => ({ ...prev, actualAmountPaid: 0 }));
    }
  }, [fullPayment, totalDepositAgreed, isNewMember]);

  // Rent validation warning
  const expectedRent = config?.bedTypes?.[formData.floor]?.[formData.bedType];
  const rentWarning =
    expectedRent && formData.currentRent !== expectedRent
      ? `Warning: Expected rent for ${formData.floor} ${formData.bedType} is ₹${expectedRent.toLocaleString()}`
      : "";

  const handleConfigRetry = async () => {
    setShowConfigError(false);
    // Configuration will be retried automatically by the useConfig hook
    notifications.show({
      title: "Retry",
      message: "Configuration will be retried automatically.",
      color: "blue",
    });
  };

  const handleSaveMember = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    // Skip authentication checks in development mode (backend handles auth)
    const isDev = import.meta.env.DEV;
    
    if (!isDev) {
      // Check authentication status only in production
      console.log("Auth check:", { user: !!user, userProfile: !!userProfile, isAdmin: userProfile?.isAdmin });
      if (!user) {
        notifications.show({
          title: "Authentication Error",
          message: "You must be signed in to add members. Please sign in and try again.",
          color: "red",
        });
        return;
      }

      if (!userProfile?.isAdmin) {
        notifications.show({
          title: "Permission Error", 
          message: "You must be an admin to add members.",
          color: "red",
        });
        return;
      }
    }

    try {
      setSaving(true);

      if (editingMember) {
        // Update existing member
        await updateMember(editingMember.id!, {
          floor: formData.floor,
          bedType: formData.bedType,
          currentRent: formData.currentRent,
        });

        notifications.show({
          title: "Success",
          message: `${formData.name} has been updated successfully`,
          color: "green",
        });
      } else {
        // Add new member
        const memberData: AddMemberFormData = {
          name: formData.name,
          phone: formData.phone,
          floor: formData.floor,
          bedType: formData.bedType,
          moveInDate: formData.moveInDate,
          securityDeposit: formData.securityDeposit,
          advanceDeposit: formData.advanceDeposit,
          rentAtJoining: formData.rentAtJoining,
          fullPayment: fullPayment,
          actualAmountPaid: formData.actualAmountPaid,
        };

        await addMember(memberData);

        notifications.show({
          title: "Success",
          message: `${formData.name} has been added successfully`,
          color: "green",
        });
      }

      onClose();
    } catch {
      notifications.show({
        title: "Error",
        message: `Failed to ${editingMember ? "update" : "add"} member. Please try again.`,
        color: "red",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Config Error Dialog */}
      <Dialog
        opened={showConfigError}
        withCloseButton
        onClose={() => setShowConfigError(false)}
        size="lg"
        radius="md"
      >
        <Text size="sm" mb="xs" fw={500}>
          Configuration Error
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          Unable to load system configuration. Please check your connection and
          try again.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={() => setShowConfigError(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfigRetry}>Retry</Button>
        </Group>
      </Dialog>

      {/* Member Modal */}
      <Modal
        opened={opened}
        onClose={onClose}
        title={editingMember ? "Edit Member" : "Add New Member"}
        size="lg"
      >
        <LoadingOverlay visible={configLoading} />

        <Stack gap="md">
          <TextInput
            label="Member Name"
            placeholder="Enter member name (First Last)"
            value={formData.name}
            onChange={(e) => {
              const capitalizedName = capitalizeWords(e.target.value);
              setFormData((prev) => ({ ...prev, name: capitalizedName }));
              // Clear error when user starts typing
              if (errors["name"]) {
                setErrors((prev) => ({ ...prev, name: "" }));
              }
            }}
            required
            withAsterisk
            error={errors["name"] || null}
            disabled={!canEditAll}
          />
          <NumberInput
            label="Phone Number"
            placeholder="Enter 10-digit phone number"
            value={formData.phone}
            onChange={(value) => {
              const phoneStr = String(value || "");
              setFormData((prev) => ({ ...prev, phone: phoneStr }));
              // Clear error when user starts typing
              if (errors["phone"]) {
                setErrors((prev) => ({ ...prev, phone: "" }));
              }
            }}
            required
            withAsterisk
            error={errors["phone"] || null}
            disabled={!canEditAll}
            hideControls
            maxLength={10}
            min={0}
          />
          <MonthPickerInput
            label="Move-in Date"
            placeholder="Select move-in month"
            value={formData.moveInDate}
            onChange={(date) => {
              if (date) {
                const dateObject =
                  typeof date === "string" ? new Date(date) : date;
                setFormData((prev) => ({ ...prev, moveInDate: dateObject }));
              }
            }}
            required
            disabled={!canEditAll}
          />

          <Group grow>
            <Select
              label="Floor"
              placeholder="Select floor"
              data={availableFloors}
              value={formData.floor || null}
              onChange={(value) => {
                setFormData((prev) => ({ 
                  ...prev, 
                  floor: value || "",
                  bedType: "" // Reset bed type when floor changes
                }));
                // Clear floor error when user selects
                if (errors["floor"]) {
                  setErrors((prev) => ({ ...prev, floor: "" }));
                }
                // Clear bed type error since we're resetting it
                if (errors["bedType"]) {
                  setErrors((prev) => ({ ...prev, bedType: "" }));
                }
              }}
              required
              withAsterisk
              error={errors["floor"] || null}
              disabled={availableFloors.length === 0}
              clearable
            />
            <Select
              label="Bed Type"
              placeholder={formData.floor ? "Select bed type" : "Select floor first"}
              data={availableBedTypes}
              value={formData.bedType || null}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, bedType: value || "" }));
                // Clear error when user selects
                if (errors["bedType"]) {
                  setErrors((prev) => ({ ...prev, bedType: "" }));
                }
              }}
              required
              withAsterisk
              error={errors["bedType"] || null}
              disabled={!formData.floor || availableBedTypes.length === 0}
              clearable
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Current Rent"
              placeholder="0"
              value={formData.currentRent}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  currentRent: Number(value) || 0,
                }))
              }
              min={0}
              prefix="₹"
              error={rentWarning}
            />

            {(isNewMember || canEditAll) && (
              <NumberInput
                label="Security Deposit"
                placeholder="0"
                value={formData.securityDeposit}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    securityDeposit: Number(value) || 0,
                  }))
                }
                min={0}
                prefix="₹"
                disabled={!canEditAll}
              />
            )}
          </Group>

          {(isNewMember || canEditAll) && (
            <>
              <Group grow>
                <NumberInput
                  label="Rent at Joining"
                  placeholder="0"
                  value={formData.rentAtJoining}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      rentAtJoining: Number(value) || 0,
                    }))
                  }
                  min={0}
                  prefix="₹"
                  disabled={!canEditAll}
                />
                <NumberInput
                  label="Advance Deposit"
                  placeholder="0"
                  value={formData.advanceDeposit}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      advanceDeposit: Number(value) || 0,
                    }))
                  }
                  min={0}
                  prefix="₹"
                  disabled={true} // Always disabled since it auto-calculates from rent at joining
                  description="Auto-calculated from Rent at Joining"
                />
              </Group>

              {isNewMember && (
                <>
                  <Divider />
                  <Alert>
                    <Text size="sm" fw={500}>
                      Total Deposit Agreed: ₹
                      {totalDepositAgreed.toLocaleString()}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Security Deposit + Advance Deposit + Rent at Joining
                    </Text>
                  </Alert>
                  <Switch
                    label="Full Payment"
                    description="Member has paid the full deposit amount"
                    checked={fullPayment}
                    onChange={(e) => setFullPayment(e.currentTarget.checked)}
                  />

                  {!fullPayment && (
                    <NumberInput
                      label="Actual Amount Paid"
                      placeholder="Enter amount paid by member"
                      value={formData.actualAmountPaid}
                      onChange={(value) => {
                        setFormData((prev) => ({
                          ...prev,
                          actualAmountPaid: Number(value) || 0,
                        }));
                        // Clear error when user starts typing
                        if (errors["actualAmountPaid"]) {
                          setErrors((prev) => ({
                            ...prev,
                            actualAmountPaid: "",
                          }));
                        }
                      }}
                      min={0}
                      max={totalDepositAgreed}
                      prefix="₹"
                      required
                      withAsterisk
                      error={errors["actualAmountPaid"] || null}
                    />
                  )}
                </>
              )}
            </>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember} loading={saving}>
              {editingMember ? "Update Member" : "Add Member"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default MemberModal;
