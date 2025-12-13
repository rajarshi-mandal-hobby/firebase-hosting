import { Stack, Text, Alert, Modal, Group, Button, Input, Divider, Title, TextInput, Paper } from '@mantine/core';
import { formatNumberIndianLocale, StatusBadge } from '../../../../shared/utils';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { GroupSpaceApart, GroupIcon, MyLoadingOverlay } from '../../../../shared/components';
import { useRecordPaymentModal } from './hooks/useRecordPaymentModal';
import { IconMoneyBag, IconPayments, IconRupee, IconUniversalCurrency } from '../../../../shared/icons';
import { ICON_SIZE } from '../../../../shared/types/constants';

interface RecordPaymentModalProps {
  opened: boolean;
  memberName: string;
  outstandingAmount: number;
  totalCharges: number;
  amountPaid: number;
  paymentNote: string;
  onClose: () => void;
  onExitTransitionEnd: () => void;
}

export const RecordPaymentModal = (props: RecordPaymentModalProps) => {
  const { memberName, outstandingAmount, totalCharges, amountPaid, paymentNote, opened, onClose } = props;

  const {
    form,
    status,
    statusColor,
    statusTitle,
    isSaving,
    convertedAmount,
    newOutstanding,
    isPaymentBelowOutstanding,
    actions: { handleExitTransitionEnd, handleRecordPayment }
  } = useRecordPaymentModal(props);

  console.log('🎨 Rendering RecordPaymentModal');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      onExitTransitionEnd={handleExitTransitionEnd}
      title="Record Payment for:"
      pos="relative">
      <MyLoadingOverlay visible={isSaving} />
      <form onSubmit={form.onSubmit(handleRecordPayment)}>
        <Stack gap="lg">
          <Title order={4}>{memberName}</Title>

          <Stack gap="xs">
            <NumberInputWithCurrency
              label="Amount"
              list={'amount-suggestions'}
              rightSection={
                form.values.amount !== '' && <Input.ClearButton onClick={() => form.setFieldValue('amount', '')} />
              }
              required
              hideControls
              w={150}
              key={form.key('amount')}
              {...form.getInputProps('amount')}
            />
            <datalist id="amount-suggestions">
              <option value={formatNumberIndianLocale(totalCharges)}>Outstanding Amount</option>
              {amountPaid > 0 && (
                <>
                  <option value={formatNumberIndianLocale(amountPaid)}>Paid Amount</option>
                  <option value={formatNumberIndianLocale(0)}>Remove Payment</option>
                </>
              )}
            </datalist>

            <TextInput
              label="Note"
              placeholder="Optional note..."
              required={isPaymentBelowOutstanding}
              list="payment-note-suggestions"
              rightSection={
                form.values.paymentNote ? (
                  <Input.ClearButton onClick={() => form.setFieldValue('paymentNote', '')} />
                ) : null
              }
              key={form.key('paymentNote')}
              {...form.getInputProps('paymentNote')}
            />
            <datalist id="payment-note-suggestions">
              {!!paymentNote && <option value={paymentNote}>Previous Note</option>}
              {isPaymentBelowOutstanding && <option value="Partial payment received.">Partial Note</option>}
            </datalist>
          </Stack>

          <Alert color={statusColor} title={`${statusTitle}`}>
            <Stack gap={'xs'}>
              <GroupSpaceApart>
                <GroupIcon>
                  <IconPayments size={ICON_SIZE} />
                  <Text>Total charges</Text>
                </GroupIcon>
                <Text fw={500}>{formatNumberIndianLocale(totalCharges)}</Text>
              </GroupSpaceApart>

              <GroupSpaceApart>
                <GroupIcon>
                  <IconMoneyBag size={ICON_SIZE} />
                  <Text>Previously paid</Text>
                </GroupIcon>
                <Text fw={500}>{formatNumberIndianLocale(amountPaid)}</Text>
              </GroupSpaceApart>

              <GroupSpaceApart>
                <GroupIcon>
                  <IconRupee size={ICON_SIZE} />
                  <Text>Current outstanding</Text>
                </GroupIcon>
                <Text fw={500}>{formatNumberIndianLocale(outstandingAmount)}</Text>
              </GroupSpaceApart>

              <Divider color={statusColor} />

              {/* New Payment Being Added */}
              <GroupSpaceApart>
                <GroupIcon>
                  <IconUniversalCurrency size={ICON_SIZE} />
                  <Text>This payment</Text>
                </GroupIcon>
                <Text fw={700}>{formatNumberIndianLocale(convertedAmount)}</Text>
              </GroupSpaceApart>

              <GroupSpaceApart>
                <GroupIcon>
                  <IconRupee size={ICON_SIZE} />
                  <Text>New outstanding</Text>
                </GroupIcon>
                <Text fw={700} c={statusColor}>
                  {formatNumberIndianLocale(newOutstanding)}
                </Text>
              </GroupSpaceApart>

              <Paper p="xs">
                <Text size="xs">
                  <strong>Note:</strong>
                  <br />
                  - If payment is less than total charges, a note is required.
                  <br />- Set amount to <strong>0</strong> to remove a payment. Any previous note will be removed.
                </Text>
              </Paper>
            </Stack>
          </Alert>

          <Group justify="flex-end" mt="lg">
            <Button variant="transparent" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              disabled={isSaving || !form.isValid() || !form.isDirty()}
              type="submit"
              leftSection={<StatusBadge size={16} status={status} />}>
              Record {formatNumberIndianLocale(convertedAmount)}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};
