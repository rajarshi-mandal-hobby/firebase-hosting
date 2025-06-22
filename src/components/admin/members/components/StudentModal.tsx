// Student Modal Component - Handles add/edit student form
import React, { useState, useEffect, useMemo } from 'react';
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
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useConfig } from '../../../../hooks/useConfig';
import { addStudent, updateStudent } from '../../../../lib/firestore';
import type { Student, AddStudentFormData } from '../../../../types/student';

interface StudentModalProps {
  opened: boolean;
  onClose: () => void;
  editingStudent: Student | null;
  hasOnlyOneRentHistory?: boolean;
}

const StudentModal: React.FC<StudentModalProps> = ({
  opened,
  onClose,
  editingStudent,
  hasOnlyOneRentHistory = false,
}) => {
  const { config, loading: configLoading, error: configError } = useConfig();
  const [saving, setSaving] = useState(false);
  const [showConfigError, setShowConfigError] = useState(false);
  const [fullPayment, setFullPayment] = useState(true);

  // Add validation state and errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) return 'Student name is required';
    const words = name.trim().split(/\s+/);
    if (words.length < 2) return 'Name should contain at least 2 words (first name and last name)';
    return '';
  };
  const validatePhone = (phone: string): string => {
    if (!phone.trim()) return 'Phone number is required';
    const phoneDigits = phone.replace(/\D/g, ''); // Remove non-digits
    if (phoneDigits.length !== 10) return 'Phone number must be exactly 10 digits';
    if (!/^[6-9]/.test(phoneDigits)) return 'Phone number must start with 6, 7, 8, or 9';
    return '';
  };
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    const nameError = validateName(formData.name);
    if (nameError) newErrors['name'] = nameError;

    // Phone validation
    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors['phone'] = phoneError;

    // Floor validation
    if (!formData.floor) newErrors['floor'] = 'Floor is required';

    // Bed type validation
    if (!formData.bedType) newErrors['bedType'] = 'Bed type is required';

    // Amount paid validation for new students with partial payment
    if (isNewStudent && !fullPayment && formData.actualAmountPaid <= 0) {
      newErrors['actualAmountPaid'] = 'Amount paid is required and must be greater than 0';
    }

    // Additional validation: Amount paid should not exceed total deposit
    if (isNewStudent && !fullPayment && formData.actualAmountPaid > totalDepositAgreed) {
      newErrors[
        'actualAmountPaid'
      ] = `Amount paid cannot exceed total deposit agreed (₹${totalDepositAgreed.toLocaleString()})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Helper function to capitalize first letter of each word
  const capitalizeWords = (str: string): string => {
    return str.replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  interface FormData {
    name: string;
    phone: string;
    floor: string;
    bedType: string;
    moveInDate: Date;
    rentAtJoining: number;
    currentRent: number;
    securityDeposit: number;
    advanceDeposit: number;
    actualAmountPaid: number;
  }
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    floor: '',
    bedType: '',
    moveInDate: new Date(),
    rentAtJoining: 0,
    currentRent: 0,
    securityDeposit: 0,
    advanceDeposit: 0,
    actualAmountPaid: 0,
  });

  const isNewStudent = !editingStudent;
  const canEditAll = isNewStudent || hasOnlyOneRentHistory;
  // Reset form when modal opens/closes or editing student changes
  useEffect(() => {
    if (editingStudent) {
      setFormData({
        name: editingStudent.name,
        phone: editingStudent.phone,
        floor: editingStudent.floor,
        bedType: editingStudent.bedType,
        moveInDate: editingStudent.moveInDate,
        rentAtJoining: editingStudent.rentAtJoining,
        currentRent: editingStudent.currentRent,
        securityDeposit: editingStudent.securityDeposit,
        advanceDeposit: editingStudent.advanceDeposit,
        actualAmountPaid: 0,
      });
    } else {
      // New student - set defaults
      const currentDate = new Date();
      setFormData({
        name: '',
        phone: '',
        floor: '',
        bedType: '',
        moveInDate: currentDate,
        rentAtJoining: 0,
        currentRent: 0,
        securityDeposit: config?.defaultSecurityDeposit || 1000,
        advanceDeposit: 0,
        actualAmountPaid: 0,
      });
    }
  }, [editingStudent, opened, config]);

  // Handle config errors
  useEffect(() => {
    if (configError && opened) {
      setShowConfigError(true);
      onClose();
    }
  }, [configError, opened, onClose]);
  // Auto-populate rent when floor/bedType changes (only when both are selected)
  useEffect(() => {
    if (config && formData.floor && formData.bedType) {
      const rentAmount = config.bedTypes?.[formData.floor]?.[formData.bedType];
      if (rentAmount && rentAmount > 0) {
        setFormData((prev) => ({
          ...prev,
          currentRent: rentAmount,
          rentAtJoining: isNewStudent ? rentAmount : prev.rentAtJoining,
        }));
      }
    }
  }, [config, formData.floor, formData.bedType, isNewStudent]);

  // Auto-calculate advance deposit = rent at joining
  useEffect(() => {
    if (formData.rentAtJoining > 0) {
      setFormData((prev) => ({
        ...prev,
        advanceDeposit: prev.rentAtJoining,
      }));
    }
  }, [formData.rentAtJoining]);

  // Available floors from config
  const availableFloors = useMemo(() => {
    return config?.floors?.map((floor) => ({ value: floor, label: `${floor} Floor` })) || [];
  }, [config]);

  // Available bed types for selected floor
  const availableBedTypes = useMemo(() => {
    if (!config || !formData.floor) return [];
    const floorBedTypes = config.bedTypes?.[formData.floor];
    return floorBedTypes ? Object.keys(floorBedTypes).map((bedType) => ({ value: bedType, label: bedType })) : [];
  }, [config, formData.floor]);
  // Auto-reset bed type if not available in new floor
  useEffect(() => {
    if (availableBedTypes.length > 0) {
      const currentBedTypeExists = availableBedTypes.some((bt) => bt.value === formData.bedType);
      if (!currentBedTypeExists) {
        setFormData((prev) => ({ ...prev, bedType: availableBedTypes[0]?.value || 'Bed' }));
      }
    }
  }, [availableBedTypes, formData.bedType]);

  // Calculate total deposit agreed
  const totalDepositAgreed = formData.securityDeposit + formData.advanceDeposit + formData.rentAtJoining;
  // Handle full payment toggle - based on Firestore.txt workflow
  useEffect(() => {
    if (fullPayment && isNewStudent) {
      setFormData((prev) => ({ ...prev, actualAmountPaid: totalDepositAgreed }));
    } else if (!fullPayment && isNewStudent) {
      // Reset to blank for admin to fill manually
      setFormData((prev) => ({ ...prev, actualAmountPaid: 0 }));
    }
  }, [fullPayment, totalDepositAgreed, isNewStudent]);

  // Rent validation warning
  const expectedRent = config?.bedTypes?.[formData.floor]?.[formData.bedType];
  const rentWarning =
    expectedRent && formData.currentRent !== expectedRent
      ? `Warning: Expected rent for ${formData.floor} ${formData.bedType} is ₹${expectedRent.toLocaleString()}`
      : '';
  const handleConfigRetry = async () => {
    setShowConfigError(false);
    // Configuration will be retried automatically by the useConfig hook
    notifications.show({
      title: 'Retry',
      message: 'Configuration will be retried automatically.',
      color: 'blue',
    });
  };
  const handleSaveStudent = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    try {
      setSaving(true);

      if (editingStudent) {
        // Update existing student
        await updateStudent(editingStudent.id!, {
          floor: formData.floor,
          bedType: formData.bedType,
          currentRent: formData.currentRent,
        });

        notifications.show({
          title: 'Success',
          message: `${formData.name} has been updated successfully`,
          color: 'green',
        });
      } else {
        // Add new student
        const studentData: AddStudentFormData = {
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

        await addStudent(studentData);

        notifications.show({
          title: 'Success',
          message: `${formData.name} has been added successfully`,
          color: 'green',
        });
      }

      onClose();
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to ${editingStudent ? 'update' : 'add'} student. Please try again.`,
        color: 'red',
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      {/* Config Error Dialog */}
      <Dialog opened={showConfigError} withCloseButton onClose={() => setShowConfigError(false)} size='lg' radius='md'>
        <Text size='sm' mb='xs' fw={500}>
          Configuration Error
        </Text>
        <Text size='sm' c='dimmed' mb='md'>
          Unable to load system configuration. Please check your connection and try again.
        </Text>
        <Group justify='flex-end'>
          <Button variant='subtle' onClick={() => setShowConfigError(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfigRetry}>Retry</Button>
        </Group>
      </Dialog>

      {/* Student Modal */}
      <Modal opened={opened} onClose={onClose} title={editingStudent ? 'Edit Student' : 'Add New Student'} size='lg'>
        <LoadingOverlay visible={configLoading} />

        <Stack gap='md'>
          {' '}
          <TextInput
            label='Student Name'
            placeholder='Enter student name (First Last)'
            value={formData.name}
            onChange={(e) => {
              const capitalizedName = capitalizeWords(e.target.value);
              setFormData((prev) => ({ ...prev, name: capitalizedName }));
              // Clear error when user starts typing
              if (errors['name']) {
                setErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            required
            withAsterisk
            error={errors['name'] || null}
            disabled={!canEditAll}
          />
          <NumberInput
            label='Phone Number'
            placeholder='Enter 10-digit phone number'
            value={formData.phone}
            onChange={(value) => {
              const phoneStr = String(value || '');
              setFormData((prev) => ({ ...prev, phone: phoneStr }));
              // Clear error when user starts typing
              if (errors['phone']) {
                setErrors((prev) => ({ ...prev, phone: '' }));
              }
            }}
            required
            withAsterisk
            error={errors['phone'] || null}
            disabled={!canEditAll}
            hideControls
            maxLength={10}
            min={0}
          />
          <MonthPickerInput
            label='Move-in Date'
            placeholder='Select move-in month'
            value={formData.moveInDate}
            onChange={(date) => {
              if (date) {
                const dateObject = typeof date === 'string' ? new Date(date) : date;
                setFormData((prev) => ({ ...prev, moveInDate: dateObject }));
              }
            }}
            required
            disabled={!canEditAll}
          />{' '}
          <Group grow>
            {' '}
            <Select
              label='Floor'
              placeholder='Select floor'
              data={availableFloors}
              value={formData.floor}
              onChange={(value) => {
                if (value) {
                  setFormData((prev) => ({ ...prev, floor: value }));
                  // Clear error when user selects
                  if (errors['floor']) {
                    setErrors((prev) => ({ ...prev, floor: '' }));
                  }
                }
              }}
              required
              withAsterisk
              error={errors['floor'] || null}
              disabled={availableFloors.length === 0}
            />
            <Select
              label='Bed Type'
              placeholder='Select bed type'
              data={availableBedTypes}
              value={formData.bedType}
              onChange={(value) => {
                if (value) {
                  setFormData((prev) => ({ ...prev, bedType: value }));
                  // Clear error when user selects
                  if (errors['bedType']) {
                    setErrors((prev) => ({ ...prev, bedType: '' }));
                  }
                }
              }}
              required
              withAsterisk
              error={errors['bedType'] || null}
              disabled={availableBedTypes.length === 0}
            />
          </Group>
          <Group grow>
            <NumberInput
              label='Current Rent'
              placeholder='0'
              value={formData.currentRent}
              onChange={(value) => setFormData((prev) => ({ ...prev, currentRent: Number(value) || 0 }))}
              min={0}
              prefix='₹'
              error={rentWarning}
            />

            {(isNewStudent || canEditAll) && (
              <NumberInput
                label='Security Deposit'
                placeholder='0'
                value={formData.securityDeposit}
                onChange={(value) => setFormData((prev) => ({ ...prev, securityDeposit: Number(value) || 0 }))}
                min={0}
                prefix='₹'
                disabled={!canEditAll}
              />
            )}
          </Group>
          {(isNewStudent || canEditAll) && (
            <>
              <Group grow>
                <NumberInput
                  label='Rent at Joining'
                  placeholder='0'
                  value={formData.rentAtJoining}
                  onChange={(value) => setFormData((prev) => ({ ...prev, rentAtJoining: Number(value) || 0 }))}
                  min={0}
                  prefix='₹'
                  disabled={!canEditAll}
                />
                <NumberInput
                  label='Advance Deposit'
                  placeholder='0'
                  value={formData.advanceDeposit}
                  onChange={(value) => setFormData((prev) => ({ ...prev, advanceDeposit: Number(value) || 0 }))}
                  min={0}
                  prefix='₹'
                  disabled={true} // Always disabled since it auto-calculates from rent at joining
                  description='Auto-calculated from Rent at Joining'
                />
              </Group>

              {isNewStudent && (
                <>
                  <Divider />
                  <Alert>
                    <Text size='sm' fw={500}>
                      Total Deposit Agreed: ₹{totalDepositAgreed.toLocaleString()}
                    </Text>
                    <Text size='xs' c='dimmed'>
                      Security Deposit + Advance Deposit + Rent at Joining
                    </Text>
                  </Alert>
                  <Switch
                    label='Full Payment'
                    description='Student has paid the full deposit amount'
                    checked={fullPayment}
                    onChange={(e) => setFullPayment(e.currentTarget.checked)}
                  />{' '}
                  {!fullPayment && (
                    <NumberInput
                      label='Actual Amount Paid'
                      placeholder='Enter amount paid by student'
                      value={formData.actualAmountPaid}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, actualAmountPaid: Number(value) || 0 }));
                        // Clear error when user starts typing
                        if (errors['actualAmountPaid']) {
                          setErrors((prev) => ({ ...prev, actualAmountPaid: '' }));
                        }
                      }}
                      min={0}
                      max={totalDepositAgreed}
                      prefix='₹'
                      required
                      withAsterisk
                      error={errors['actualAmountPaid'] || null}
                    />
                  )}
                </>
              )}
            </>
          )}
          <Group justify='flex-end' gap='sm'>
            <Button variant='subtle' onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSaveStudent} loading={saving}>
              {editingStudent ? 'Update Student' : 'Add Student'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default StudentModal;
