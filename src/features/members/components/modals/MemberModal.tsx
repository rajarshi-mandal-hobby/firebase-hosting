import { useState, useEffect } from 'react';
import { NumberInput, Stack, Text, TextInput, Select, Switch, Alert, Group, Divider } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { SharedModal } from '../../../../components/shared/SharedModal';
import { notifications } from '@mantine/notifications';
import type { Member, Floor, BedType } from '../../../../firestore-types';
import { mockGlobalSettings } from '../../../../data/mockData';

interface MemberModalProps {
  opened: boolean;
  onClose: () => void;
  member?: Member | null;
  mode: 'add' | 'edit';
}

export function MemberModal({ opened, onClose, member, mode }: MemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    floor: null as Floor | null,
    bedType: null as BedType | null,
    moveInDate: new Date(), // Keep as Date for internal logic
    currentRent: 0,
    securityDeposit: mockGlobalSettings.securityDeposit,
    advanceDeposit: 0,
    rentAtJoining: 0,
    fullPayment: true,
    actualAmountPaid: 0,
  });

  // Initialize form data when modal opens or member changes
  useEffect(() => {
    if (opened) {
      if (mode === 'edit' && member) {
        // Handle member.moveInDate which could be Timestamp or Date
        let moveInDate = new Date();
        if (member.moveInDate) {
          const timestamp = member.moveInDate as unknown as { toDate?: () => Date };
          if (timestamp.toDate) {
            // It's a Firestore Timestamp
            moveInDate = timestamp.toDate();
          } else if (member.moveInDate instanceof Date) {
            // It's a regular Date
            moveInDate = member.moveInDate;
          }
        }

        setFormData({
          name: member.name,
          phone: member.phone.replace('+91', ''), // Remove +91 prefix for display
          floor: member.floor,
          bedType: member.bedType,
          moveInDate: moveInDate,
          currentRent: member.currentRent,
          securityDeposit: member.securityDeposit,
          advanceDeposit: member.advanceDeposit,
          rentAtJoining: member.rentAtJoining,
          fullPayment: true,
          actualAmountPaid: member.totalAgreedDeposit,
        });
      } else {
        // Reset for new member
        setFormData({
          name: '',
          phone: '',
          floor: null,
          bedType: null,
          moveInDate: new Date(),
          currentRent: 0,
          securityDeposit: mockGlobalSettings.securityDeposit,
          advanceDeposit: 0,
          rentAtJoining: 0,
          fullPayment: true,
          actualAmountPaid: 0,
        });
      }
    }
  }, [opened, mode, member]);

  // Auto-calculate advance deposit from rent at joining
  useEffect(() => {
    if (mode === 'add') {
      setFormData((prev) => ({
        ...prev,
        advanceDeposit: prev.rentAtJoining,
      }));
    }
  }, [formData.rentAtJoining, mode]);

  // Auto-calculate total deposit and full payment amount
  const totalDeposit = formData.securityDeposit + formData.advanceDeposit + formData.rentAtJoining;

  useEffect(() => {
    if (formData.fullPayment && mode === 'add') {
      setFormData((prev) => ({ ...prev, actualAmountPaid: totalDeposit }));
    }
  }, [formData.fullPayment, totalDeposit, mode]);

  // Get available bed types for selected floor
  const getAvailableBedTypes = (floor: Floor) => {
    if (!floor || !mockGlobalSettings.bedTypes[floor]) return [];
    return Object.keys(mockGlobalSettings.bedTypes[floor]).map((bedType) => ({
      value: bedType,
      label: bedType === 'Special' ? 'Special Room' : bedType, // Display "Special Room" instead of "Special"
    }));
  };

  // Handle floor change and update rent values
  const handleFloorChange = (floor: string | null) => {
    if (!floor) {
      // If floor is cleared, reset everything
      setFormData((prev) => ({
        ...prev,
        floor: null,
        bedType: null,
        currentRent: 0,
        rentAtJoining: mode === 'add' ? 0 : prev.rentAtJoining,
      }));
      return;
    }

    // Floor selected - reset bed type and keep rent fields at 0 until bed type is selected
    setFormData((prev) => ({
      ...prev,
      floor: floor as Floor,
      bedType: null, // Always reset bed type when floor changes
      currentRent: 0, // Keep at 0 until bed type is selected
      rentAtJoining: mode === 'add' ? 0 : prev.rentAtJoining, // Keep at 0 until bed type is selected
    }));
  };

  // Handle bed type change and update rent values
  const handleBedTypeChange = (bedType: string | null) => {
    if (!bedType) {
      // If bed type is cleared, reset dependent fields to 0
      setFormData((prev) => ({
        ...prev,
        bedType: null,
        currentRent: 0,
        rentAtJoining: mode === 'add' ? 0 : prev.rentAtJoining,
      }));
      return;
    }

    if (!formData.floor) return; // Should not happen as bed type is disabled when floor is empty

    const floorData = mockGlobalSettings.bedTypes[formData.floor];
    if (!floorData) return;

    // Map "Special Room" back to "Special" for mockData lookup
    const bedTypeKey = bedType === 'Special Room' ? 'Special' : bedType;
    const rent = (floorData as Record<string, number>)[bedTypeKey] || 0;

    // NOW populate rent fields when bed type is selected (both floor and bed type are selected)
    setFormData((prev) => ({
      ...prev,
      bedType: bedType as BedType,
      currentRent: rent, // Populate rent when bed type is selected
      rentAtJoining: mode === 'add' ? rent : prev.rentAtJoining, // Populate rent at joining for new members
    }));
  };

  const handleSaveMember = async () => {
    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim() || !formData.floor || !formData.bedType) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please fill in all required fields',
        color: 'red',
      });
      return;
    }

    // Phone validation
    if (formData.phone.length !== 10 || !/^[6-9]/.test(formData.phone)) {
      notifications.show({
        title: 'Validation Error',
        message: 'Phone number must be 10 digits starting with 6-9',
        color: 'red',
      });
      return;
    }

    if (mode === 'add' && !formData.fullPayment && formData.actualAmountPaid <= 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please enter the actual amount paid',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual Firebase function call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      notifications.show({
        title: 'Success',
        message: `Member ${mode === 'add' ? 'added' : 'updated'} successfully`,
        color: 'green',
      });

      onClose();
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to ${mode} member. Please try again.`,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const isNewMember = mode === 'add';

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title={mode === 'add' ? 'Add New Member' : 'Edit Member'}
      loading={loading}
      primaryActionText={mode === 'add' ? 'Add Member' : 'Update Member'}
      onPrimaryAction={handleSaveMember}
      size='lg'>
      <Stack gap='md'>
        <TextInput
          label='Member Name'
          placeholder='Enter full name'
          value={formData.name}
          onChange={(event) => setFormData((prev) => ({ ...prev, name: event.currentTarget?.value ?? '' }))}
          required
        />

        <NumberInput
          label='Phone Number'
          placeholder='Enter 10-digit phone number'
          value={formData.phone}
          onChange={(value) => setFormData((prev) => ({ ...prev, phone: String(value || '') }))}
          maxLength={10}
          hideControls
          required
        />

        <Group grow>
          <Select
            label='Floor'
            placeholder='Select floor'
            value={formData.floor}
            onChange={handleFloorChange}
            data={mockGlobalSettings.floors.map((floor) => ({
              value: floor,
              label: `${floor} Floor`,
            }))}
            required
            clearable
            searchable={false}
          />
          <Select
            label='Bed Type'
            placeholder={formData.floor ? 'Select bed type' : 'Select floor first'}
            value={formData.bedType}
            onChange={handleBedTypeChange}
            data={formData.floor ? getAvailableBedTypes(formData.floor) : []}
            required
            disabled={!formData.floor}
            clearable={!!formData.floor}
            searchable={false}
          />
        </Group>

        <MonthPickerInput
          label='Move-in Month'
          placeholder='Select month and year'
          value={
            formData.moveInDate && formData.moveInDate instanceof Date
              ? formData.moveInDate.toISOString().slice(0, 7)
              : null
          }
          onChange={(value: string | null) => {
            if (value) {
              // Convert string (YYYY-MM) to Date object
              const [year, month] = value.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              setFormData((prev) => ({ ...prev, moveInDate: date }));
            } else {
              setFormData((prev) => ({ ...prev, moveInDate: new Date() }));
            }
          }}
          required
        />

        <NumberInput
          label='Current Rent'
          placeholder='0'
          value={formData.currentRent}
          onChange={(value) => setFormData((prev) => ({ ...prev, currentRent: Number(value) || 0 }))}
          prefix='₹'
          min={0}
        />

        <Divider />
        <Text size='sm' fw={500}>
          Deposit Information
        </Text>

        <Group grow>
          <NumberInput
            label='Security Deposit'
            placeholder='0'
            value={formData.securityDeposit}
            onChange={(value) => setFormData((prev) => ({ ...prev, securityDeposit: Number(value) || 0 }))}
            prefix='₹'
            min={0}
          />
          <NumberInput
            label='Rent at Joining'
            placeholder='0'
            value={formData.rentAtJoining}
            onChange={(value) => setFormData((prev) => ({ ...prev, rentAtJoining: Number(value) || 0 }))}
            prefix='₹'
            min={0}
          />
        </Group>

        <NumberInput
          label='Advance Deposit'
          placeholder='0'
          value={formData.advanceDeposit}
          onChange={(value) => setFormData((prev) => ({ ...prev, advanceDeposit: Number(value) || 0 }))}
          prefix='₹'
          min={0}
          disabled={mode === 'add'}
          description={mode === 'add' ? 'Auto-calculated from Rent at Joining' : 'Editable for existing members'}
        />

        <Alert color='blue' title='Total Deposit Agreed'>
          <Stack gap='xs'>
            <Text size='sm' fw={600}>
              ₹{totalDeposit.toLocaleString()}
            </Text>
            <Text size='xs' c='dimmed'>
              Security Deposit + Advance Deposit + Rent at Joining
            </Text>
          </Stack>
        </Alert>

        {isNewMember && (
          <>
            <Switch
              label='Full Payment'
              description='Member has paid the complete deposit amount'
              checked={formData.fullPayment}
              onChange={(event) => {
                const checked = event.currentTarget?.checked ?? false;
                setFormData((prev) => ({ ...prev, fullPayment: checked }));
              }}
            />

            {!formData.fullPayment && (
              <NumberInput
                label='Actual Amount Paid'
                placeholder='Enter amount paid by member'
                value={formData.actualAmountPaid}
                onChange={(value) => setFormData((prev) => ({ ...prev, actualAmountPaid: Number(value) || 0 }))}
                prefix='₹'
                min={0}
                max={totalDeposit}
                required
              />
            )}
          </>
        )}
      </Stack>
    </SharedModal>
  );
}
