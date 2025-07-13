import { useState } from 'react';
import { NumberInput, Stack, Text, TextInput, Switch, Alert } from '@mantine/core';
import { SharedModal } from '../../../../shared/components/SharedModal';
import { notifications } from '@mantine/notifications';

interface RecordPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  memberName?: string;
  outstandingAmount?: number;
}

export function RecordPaymentModal({ 
  opened, 
  onClose, 
  memberName = '',
  outstandingAmount = 0 
}: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: 0,
    paymentNote: '',
    fullPayment: false,
  });

  const handleRecordPayment = async () => {
    if (formData.amount <= 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Payment amount must be greater than 0',
        color: 'red',
      });
      return;
    }

    if (formData.amount > outstandingAmount && !formData.fullPayment) {
      notifications.show({
        title: 'Validation Error',
        message: 'Payment amount cannot exceed outstanding balance',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual Firebase function call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      notifications.show({
        title: 'Success',
        message: `Payment of ₹${formData.amount.toLocaleString()} recorded successfully for ${memberName}`,
        color: 'green',
      });
      
      onClose();
      setFormData({
        amount: 0,
        paymentNote: '',
        fullPayment: false,
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to record payment. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const maxAmount = formData.fullPayment ? undefined : outstandingAmount;

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title="Record Payment"
      loading={loading}
      primaryActionText="Record Payment"
      onPrimaryAction={handleRecordPayment}
      size="sm"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Recording payment for <strong>{memberName || 'Selected Member'}</strong>
        </Text>

        {outstandingAmount > 0 && (
          <Alert color="orange" title="Outstanding Balance">
            <Text size="sm">
              Current outstanding: <strong>₹{outstandingAmount.toLocaleString()}</strong>
            </Text>
          </Alert>
        )}

        <Switch
          label="Full Payment"
          description="Member is paying the complete outstanding amount"
          checked={formData.fullPayment}
          onChange={(event) => {
            const isFullPayment = event.currentTarget.checked;
            setFormData(prev => ({
              ...prev,
              fullPayment: isFullPayment,
              amount: isFullPayment ? outstandingAmount : 0,
            }));
          }}
        />

        <NumberInput
          label="Payment Amount"
          placeholder="Enter payment amount"
          value={formData.amount}
          onChange={(value) => setFormData(prev => ({ ...prev, amount: Number(value) || 0 }))}
          prefix="₹"
          min={0}
          max={maxAmount}
          required
          disabled={formData.fullPayment}
        />

        <TextInput
          label="Payment Note"
          placeholder="Optional note about this payment (e.g., payment method, reference)"
          value={formData.paymentNote}
          onChange={(event) => setFormData(prev => ({ ...prev, paymentNote: event.currentTarget?.value ?? '' }))}
        />

        {formData.amount > 0 && (
          <Alert color="green" title="Payment Summary">
            <Text size="sm">
              Recording payment of <strong>₹{formData.amount.toLocaleString()}</strong>
              {formData.paymentNote && (
                <>
                  <br />
                  Note: {formData.paymentNote}
                </>
              )}
            </Text>
          </Alert>
        )}
      </Stack>
    </SharedModal>
  );
}
