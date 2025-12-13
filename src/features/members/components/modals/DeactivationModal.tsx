// Deactivation Modal Component - Handles member deactivation with settlement calculation
import { useMemo, useState, useTransition } from 'react';
import { Stack, Group, Text, Badge, Button, Modal, Title, Alert } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
// import { useAppContext } from "../../../../contexts/AppContext";
import type { Member } from '../../../../shared/types/firestore-types';
import { formatNumberIndianLocale } from '../../../../shared/utils';
import { IconCalendarMonth, IconInfo } from '../../../../shared/icons';
import { notifyError, notifySuccess } from '../../../../utils/notifications';
import type { MemberActionModalProps } from '..';
import { GroupSpaceApart } from '../../../../shared/components';

type SettlementStatus = 'Refund Due' | 'Payment Due' | 'Settled';

type SettlementPreview = {
  leaveMonth: string | null;
  totalAgreedDeposit: number;
  currentRent: number;
  remainingAdvance: number;
  outstandingBalance: number;
  refundAmount: number;
  status: SettlementStatus;
  text: string;
  color: string;
};

const getSettlementStatus = (refundAmount: number): { status: SettlementStatus; color: string; text: string } => {
  switch (true) {
    case refundAmount > 0:
      return {
        status: 'Refund Due',
        color: 'red',
        text: 'I Give'
      };
    case refundAmount < 0:
      return {
        status: 'Payment Due',
        color: 'green.8',
        text: 'I Get'
      };
    default:
      return {
        status: 'Settled',
        color: 'gray.7',
        text: 'Settled'
      };
  }
};

export const DeactivationModal = ({ opened, member, onClose, onExitTransitionEnd }: MemberActionModalProps) => {
  const [leaveDate, setLeaveDate] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const settlementPreview = useMemo<SettlementPreview | null>(() => {
    if (!member) return null;

    const remainingAdvance = member.totalAgreedDeposit - member.currentRent;
    const outstanding = member.currentMonthRent.currentOutstanding;
    const refund = remainingAdvance - outstanding;

    return {
      leaveMonth: leaveDate,
      totalAgreedDeposit: member.totalAgreedDeposit,
      currentRent: member.currentRent,
      remainingAdvance,
      outstandingBalance: outstanding,
      refundAmount: refund,
      text: getSettlementStatus(refund).text,
      status: getSettlementStatus(refund).status,
      color: getSettlementStatus(refund).color
    };
  }, [member, leaveDate]);

  const handleReset = () => {
    setLeaveDate(null);
    setDateError(null);
  };

  const handleConfirmDeactivation = () => {
    if (!member) {
      notifyError('Member not found');
      handleReset();
      onClose();
      return;
    }

    if (!leaveDate) {
      setDateError('Please select a leave date');
      return;
    }

    try {
      startSaving(async () => {
        await new Promise((resolve, _reject) => setTimeout(() => resolve(true), 1500));
        handleReset();
        onClose();
        notifySuccess('Member deactivated successfully');
      });
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  const handleLeaveDateChange = (date: string | null) => {
    setLeaveDate(date);
    setDateError(null);
  };

  const handleTransitionEnd = () => {
    onExitTransitionEnd?.();
    handleReset();
  };

  console.log('🎨 Rendering DeactivationModal');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      onExitTransitionEnd={handleTransitionEnd}
      title="Deactivate Member"
      centered
      size="sm">
      {member && settlementPreview && (
        <Stack gap="xl">
          {/* Member Info */}
          <Stack gap={0}>
            <Text fw={500} size="lg">
              {member.name}
            </Text>
            <Group gap="xs">
              <Text>
                {member.floor} Floor - {member.bedType}
              </Text>
            </Group>
            {/* Leave Date */}
            <MonthPickerInput
              label="Leave Month"
              placeholder="Select Vacate Month"
              value={leaveDate}
              onChange={handleLeaveDateChange}
              error={dateError}
              leftSection={<IconCalendarMonth />}
              required
              disabled={isSaving}
              mt="md"
            />
          </Stack>

          <Stack gap={'xs'}>
            <Title order={5}>Settlement Preview</Title>

            <GroupSpaceApart>
              <Text>Total Agreed Deposit:</Text>
              <Text fw={500}>{formatNumberIndianLocale(settlementPreview.totalAgreedDeposit)}</Text>
            </GroupSpaceApart>
            <GroupSpaceApart>
              <Text>Current Rent:</Text>
              <Text fw={500}>{formatNumberIndianLocale(settlementPreview.currentRent)}</Text>
            </GroupSpaceApart>
            <GroupSpaceApart>
              <Text>Remaining Advance:</Text>
              <Text fw={500}>{formatNumberIndianLocale(settlementPreview.remainingAdvance)}</Text>
            </GroupSpaceApart>
            <GroupSpaceApart>
              <Text>Outstanding Balance:</Text>
              <Text fw={500} c={settlementPreview.outstandingBalance > 0 ? 'red.6' : 'green.8'}>
                {formatNumberIndianLocale(settlementPreview.outstandingBalance)}
              </Text>
            </GroupSpaceApart>
            <GroupSpaceApart>
              <Text fw={500}>Settlement Status:</Text>
              <Badge color={settlementPreview.color}>{settlementPreview.status}</Badge>
            </GroupSpaceApart>
          </Stack>

          <Alert color={settlementPreview.color} icon={<IconInfo />}>
            <Text fw={500} mb="xs">
              {settlementPreview.text} &mdash;{' '}
              <Text component="span" c={settlementPreview.color} fw={700}>
                {formatNumberIndianLocale(Math.abs(settlementPreview.refundAmount))}
              </Text>
            </Text>
            <Text size="xs" fw={700}>
              Previous month&apos;s electricity bill was not calculated. If needed, subtract ₹50-250 rupees.
              <br />
              <br />
              Avg. ₹175 electric bill, {settlementPreview.text}{' '}
              {formatNumberIndianLocale(settlementPreview.refundAmount - 175)}
            </Text>
          </Alert>

          {/* Action Buttons */}
          <Group justify="flex-end" gap="sm" mt="xl">
            <Button variant="white" onClick={onClose}>
              {isSaving ? 'Close' : 'Cancel'}
            </Button>
            <Button
              color="red.7"
              onClick={handleConfirmDeactivation}
              disabled={isSaving || !leaveDate}
              loading={isSaving}>
              Deactivate
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
};
