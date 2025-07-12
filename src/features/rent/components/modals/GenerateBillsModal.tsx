import { useState } from 'react';
import { Button, Group, NumberInput, Stack, Text, Alert } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { SharedModal } from '../../../../components/shared/SharedModal';
import { notifications } from '@mantine/notifications';

interface GenerateBillsModalProps {
  opened: boolean;
  onClose: () => void;
}

export function GenerateBillsModal({ opened, onClose }: GenerateBillsModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    billingMonth: new Date(),
    secondFloorElectricity: 0,
    thirdFloorElectricity: 0,
    memberCountEditable: false,
    secondFloorCount: 0,
    thirdFloorCount: 0,
  });

  const handleGenerateBills = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual Firebase function call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      notifications.show({
        title: 'Success',
        message: 'Bills generated successfully for all active members',
        color: 'green',
      });

      onClose();
      setFormData({
        billingMonth: new Date(),
        secondFloorElectricity: 0,
        thirdFloorElectricity: 0,
        memberCountEditable: false,
        secondFloorCount: 0,
        thirdFloorCount: 0,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to generate bills. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title='Generate Bills'
      loading={loading}
      primaryActionText='Generate Bills'
      onPrimaryAction={handleGenerateBills}
      size='md'>
      <Stack gap='md'>
        <Text size='sm' c='dimmed'>
          Generate monthly bills for all active members with electricity charges distributed by floor.
        </Text>

        <MonthPickerInput
          label='Billing Month'
          placeholder='Select billing month'
          value={
            formData.billingMonth && formData.billingMonth instanceof Date
              ? formData.billingMonth.toISOString().slice(0, 7)
              : null
          }
          onChange={(value: string | null) => {
            if (value) {
              // Convert string (YYYY-MM) to Date object
              const [year, month] = value.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              setFormData((prev) => ({ ...prev, billingMonth: date }));
            } else {
              setFormData((prev) => ({ ...prev, billingMonth: new Date() }));
            }
          }}
          required
        />

        <Group grow>
          <NumberInput
            label='2nd Floor Electricity'
            placeholder='Enter electricity bill amount'
            value={formData.secondFloorElectricity}
            onChange={(value) => setFormData((prev) => ({ ...prev, secondFloorElectricity: Number(value) || 0 }))}
            prefix='₹'
            min={0}
            required
          />
          <NumberInput
            label='3rd Floor Electricity'
            placeholder='Enter electricity bill amount'
            value={formData.thirdFloorElectricity}
            onChange={(value) => setFormData((prev) => ({ ...prev, thirdFloorElectricity: Number(value) || 0 }))}
            prefix='₹'
            min={0}
            required
          />
        </Group>

        <Alert title='Member Count' color='blue'>
          <Text size='sm'>
            Member counts will be automatically calculated based on active members. If you need to override counts,
            enable the option below.
          </Text>
        </Alert>

        {formData.memberCountEditable && (
          <Group grow>
            <NumberInput
              label='2nd Floor Member Count'
              placeholder='Number of members'
              value={formData.secondFloorCount}
              onChange={(value) => setFormData((prev) => ({ ...prev, secondFloorCount: Number(value) || 0 }))}
              min={0}
            />
            <NumberInput
              label='3rd Floor Member Count'
              placeholder='Number of members'
              value={formData.thirdFloorCount}
              onChange={(value) => setFormData((prev) => ({ ...prev, thirdFloorCount: Number(value) || 0 }))}
              min={0}
            />
          </Group>
        )}

        <Button
          variant='light'
          size='xs'
          onClick={() => setFormData((prev) => ({ ...prev, memberCountEditable: !prev.memberCountEditable }))}>
          {formData.memberCountEditable ? 'Use Auto Count' : 'Edit Member Count'}
        </Button>
      </Stack>
    </SharedModal>
  );
}
