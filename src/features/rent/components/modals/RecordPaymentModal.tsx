import { useEffect, useEffectEvent, useState } from 'react';
import {
  Stack,
  Text,
  Switch,
  Alert,
  Modal,
  Group,
  Button,
  Input,
  Textarea,
  LoadingOverlay,
  Divider,
  Title,
  SimpleGrid,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useForm } from '@mantine/form';
import { formatNumberIndianLocale, getStatusColor, getStatusTitle, StatusBadge } from '../../../../shared/utils';
import type { PaymentStatus } from '../../../../shared/types/firestore-types';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { notifySuccess } from '../../../../utils/notifications';

interface RecordPaymentModalProps {
  opened: boolean;
  onClose: () => void;
  memberName: string;
  outstandingAmount: number;
  totalCharges: number;
  amountPaid: number;
  paymentNote: string;
}

type RecordFormData = {
  amount: string | number;
  paymentNote: string;
  fullPayment: boolean;
};

export const RecordPaymentModal = ({
  opened,
  onClose,
  memberName,
  outstandingAmount,
  totalCharges,
  amountPaid,
  paymentNote,
}: RecordPaymentModalProps) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('Due');
  const [isPaymentModified, setPaymentModified] = useState(false);

  const form = useForm<RecordFormData>({
    initialValues: {
      amount: '',
      paymentNote: '',
      fullPayment: false,
    },
    onValuesChange(values, previous) {
      const toggledOn = values.fullPayment && !previous.fullPayment;
      const toggledOff = !values.fullPayment && previous.fullPayment;

      let nextAmount: string | number = values.amount;

      if (toggledOn) {
        nextAmount = Math.max(totalCharges, amountPaid);
        form.setFieldValue('amount', nextAmount);
      } else if (toggledOff) {
        form.setFieldValue('amount', values.amount);
      }

      const convertedAmount = Number(nextAmount);

      setStatus(() => {
        if (convertedAmount === 0) {
          return 'Due';
        } else if (convertedAmount === totalCharges) {
          return 'Paid';
        } else if (convertedAmount > 0 && convertedAmount < totalCharges) {
          return 'Partial';
        } else if (amountPaid > totalCharges || convertedAmount > totalCharges) {
          return 'Overpaid';
        }
        return 'Paid';
      });

      setPaymentModified(convertedAmount !== amountPaid || values.paymentNote !== paymentNote);
    },
    validate: {
      amount: (value) => {
        const amount = value;
        if (amount === '' || isNaN(Number(amount)) || Number(amount) < 0) {
          return 'Please enter a valid amount';
        }
        return null;
      },
      paymentNote: (value, values) => {
        const amount = Number(values.amount);
        if (isNaN(amount) || (amount > 0 && amount < totalCharges && !value.trim())) {
          return 'Payment note is required for partial payments';
        }
        return null;
      },
    },
  });

  const effectEvent = useEffectEvent(() => {
    const isPaid = outstandingAmount === 0;
    const isAnyAmountPaid = amountPaid > 0;
    const amount = isAnyAmountPaid ? amountPaid : '';

    form.setValues({
      amount,
      paymentNote: paymentNote,
      fullPayment: isPaid,
    });
  });

  useEffect(() => {
    if (opened) {
      effectEvent();
    }
  }, [opened]);

  const convertedAmount = form.values.amount ? Number(form.values.amount) : 0;
  const newOutstanding = totalCharges - convertedAmount;
  const isPaymentBelowOutstanding = convertedAmount > 0 && convertedAmount < totalCharges;

  const statusColor = getStatusColor(status);
  const statusTitle = getStatusTitle(status);

  const handleFormReset = () => {
    form.reset();
    setStatus('Due');
  };

  const handleRecordPayment = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const message = convertedAmount === 0 ? 'removed' : 'recorded';
      notifySuccess(
        `Payment of ${formatNumberIndianLocale(convertedAmount)} ${message} successfully for ${memberName}`
      );
      onClose(); // reset will happen via onExitTransitionEnd
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

  console.log('🎨 Rendering RecordPaymentModal');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      onExitTransitionEnd={handleFormReset}
      title='Record Payment for:'
      pos='relative'
      centered>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Title order={4} mb='md'>
        {memberName}
      </Title>
      <form onSubmit={form.onSubmit(handleRecordPayment)}>
        <Stack gap='lg'>
          <Switch
            label='Full Payment'
            description='Member is paying the complete outstanding amount'
            checked={form.getValues().fullPayment}
            key={form.key('fullPayment')}
            {...form.getInputProps('fullPayment')}
          />

          <NumberInputWithCurrency
            label='Amount'
            list={'amount-suggestions'}
            placeholder='Enter paid amount'
            rightSection={
              form.values.amount && !form.values.fullPayment ? (
                <Input.ClearButton onClick={() => form.setFieldValue('amount', '')} />
              ) : undefined
            }
            required
            hideControls
            disabled={form.values.fullPayment}
            key={form.key('amount')}
            {...form.getInputProps('amount')}
          />

          <datalist id='amount-suggestions'>
            <option value={`Amount Paid - ${formatNumberIndianLocale(amountPaid)}`}></option>
          </datalist>

          <Textarea
            label='Note'
            placeholder='Optional note...'
            required={isPaymentBelowOutstanding}
            minRows={1}
            autosize
            rightSection={
              form.values.paymentNote ? (
                <Input.ClearButton onClick={() => form.setFieldValue('paymentNote', '')} />
              ) : null
            }
            key={form.key('paymentNote')}
            {...form.getInputProps('paymentNote')}
          />

          <Alert
            color={statusColor}
            title={`${statusTitle}`}
            styles={{
              title: {
                fontSize: '16px',
              },
            }}>
            <Stack gap='xs'>
              <SimpleGrid cols={2} spacing='xs'>
                <Text size='sm'>Total charges:</Text>
                <Text size='sm' fw={500}>
                  {formatNumberIndianLocale(totalCharges)}
                </Text>

                <Text size='sm'>Previously paid:</Text>
                <Text size='sm' fw={500}>
                  {formatNumberIndianLocale(amountPaid)}
                </Text>

                <Text size='sm'>Current outstanding:</Text>
                <Text size='sm' fw={500}>
                  {formatNumberIndianLocale(outstandingAmount)}
                </Text>
              </SimpleGrid>

              <Divider color={statusColor} />

              {/* New Payment Being Added */}
              <SimpleGrid cols={2} spacing='xs'>
                <Text size='sm' fw={700}>
                  This payment:
                </Text>
                <Text size='sm' fw={700}>
                  {formatNumberIndianLocale(isPaymentModified ? convertedAmount : 0)}
                </Text>

                <Text size='sm' fw={700}>
                  New outstanding:
                </Text>
                <Text size='sm' fw={700} c={statusColor}>
                  {formatNumberIndianLocale(isPaymentModified ? newOutstanding : 0)}
                </Text>
              </SimpleGrid>

              <Text size='xs' mt='sm'>
                <strong>Note:</strong>
                <br />
                - If payment is less than total charges, a note is required.
                <br />- Please set amount to zero to remove a payment.
              </Text>
            </Stack>
          </Alert>

          <Group justify='flex-end' mt='md'>
            <Button variant='default' onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              disabled={loading || !isPaymentModified || !form.isValid()}
              type='submit'
              rightSection={<StatusBadge size={16} status={status} />}>
              Record {formatNumberIndianLocale(convertedAmount)}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
