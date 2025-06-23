// Delete Member Modal Component - Handles member deactivation with refund calculation
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Modal, Stack, Group, Text, Badge, Avatar, Button, Divider, NumberFormatter, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMemberOperations } from '../hooks/useMemberOperations';
import { calculateSettlementPreview } from '../../../../lib/firestore';
import type { Member, SettlementPreview } from '../types/member';
import type { DeleteMemberModalProps } from '../types';

const DeleteMemberModal: FC<DeleteMemberModalProps> = ({ opened, onClose, member }) => {
  const { deactivateMember } = useMemberOperations();
  const [leaveDate, setLeaveDate] = useState<Date>(new Date());
  const [deleting, setDeleting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreview | null>(null);

  // Calculate display data - using useMemo for performance
  const displayData = useMemo(() => {
    if (settlementPreview) {
      return settlementPreview;
    }

    if (!member) {
      return {
        totalAgreedDeposit: 0,
        outstandingBalance: 0,
        refundAmount: 0,
        status: 'Loading...',
      };
    }

    // Fallback calculation with proper number conversion
    const totalDeposit = Number(member.totalAgreedDeposit) || 0;
    const outstanding = Number(member.outstandingBalance) || 0;
    const refund = totalDeposit - outstanding;

    return {
      totalAgreedDeposit: totalDeposit,
      outstandingBalance: outstanding,
      refundAmount: refund,
      status: refund > 0 ? 'Refund Due' : refund < 0 ? 'Payment Due' : 'Settled',
    };
  }, [settlementPreview, member]);

  // Memoized function to fetch settlement preview - stable reference
  const fetchSettlementPreview = useCallback(
    async (currentMember: Member, currentLeaveDate: Date) => {
      if (!currentMember) return;

      if (!currentMember.id) {
        console.error('Member ID is missing for settlement preview');
        // Use fallback calculation when ID is missing
        const refundAmount =
          (Number(currentMember.totalAgreedDeposit) || 0) - (Number(currentMember.outstandingBalance) || 0);

        setSettlementPreview({
          memberName: currentMember.name,
          totalAgreedDeposit: Number(currentMember.totalAgreedDeposit) || 0,
          outstandingBalance: Number(currentMember.outstandingBalance) || 0,
          refundAmount,
          status: refundAmount > 0 ? 'Refund Due' : refundAmount < 0 ? 'Payment Due' : 'Settled',
          leaveDate: currentLeaveDate.toISOString().split('T')[0] || '',
        });
        return;
      }
      try {
        setLoadingPreview(true);

        // Use the cloud function for accurate settlement calculation
        const preview = (await calculateSettlementPreview(currentMember.id, currentLeaveDate)) as SettlementPreview;
        setSettlementPreview(preview);
      } catch (error) {
        console.error('Error fetching settlement preview:', error);
        // Check if it's an authentication error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('UNAUTHENTICATED') || errorMessage.includes('Authentication required')) {
          notifications.show({
            title: 'Authentication Error',
            message: 'Please sign in to calculate settlement. Using basic calculation.',
            color: 'yellow',
          });
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to calculate settlement preview. Using basic calculation.',
            color: 'orange',
          });
        }

        // Fallback to basic calculation if cloud function fails
        const refundAmount =
          (Number(currentMember.totalAgreedDeposit) || 0) - (Number(currentMember.outstandingBalance) || 0);

        setSettlementPreview({
          memberName: currentMember.name,
          totalAgreedDeposit: Number(currentMember.totalAgreedDeposit) || 0,
          outstandingBalance: Number(currentMember.outstandingBalance) || 0,
          refundAmount,
          status: refundAmount > 0 ? 'Refund Due' : refundAmount < 0 ? 'Payment Due' : 'Settled',
          leaveDate: currentLeaveDate.toISOString().split('T')[0] || '',
        });
      } finally {
        setLoadingPreview(false);
      }
    },
    [setSettlementPreview, setLoadingPreview]
  );

  // Single effect for handling settlement preview - includes debouncing for leave date changes
  useEffect(() => {
    if (!opened || !member) return;

    // Debounce the settlement preview fetch to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      fetchSettlementPreview(member, leaveDate);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [opened, member, leaveDate, fetchSettlementPreview]);

  // Effect for resetting state when modal closes
  useEffect(() => {
    if (!opened) {
      setSettlementPreview(null);
      setLeaveDate(new Date());
    }
  }, [opened]);

  const handleConfirmDelete = async () => {
    if (!member) return;

    if (!member.id) {
      notifications.show({
        title: 'Error',
        message: 'Member ID is missing. Cannot proceed with deletion.',
        color: 'red',
      });
      return;
    }
    try {
      setDeleting(true);
      await deactivateMember(member.id);

      notifications.show({
        title: 'Success',
        message: `${member.name} has been deactivated successfully`,
        color: 'green',
      });

      onClose();
    } catch (error) {
      console.error('Error deleting member:', error);

      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('UNAUTHENTICATED') || errorMessage.includes('Authentication required')) {
        notifications.show({
          title: 'Authentication Error',
          message: 'Please sign in to delete member. Please try again after signing in.',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to deactivate member. Please try again.',
          color: 'red',
        });
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    setLeaveDate(new Date());
    setSettlementPreview(null);
    onClose();
  };

  if (!member) return null;

  return (
    <Modal opened={opened} onClose={handleCancel} title='Delete Member' size='md' centered>
      <Stack gap='md'>
        {/* Member Info */}
        <Group>
          <Avatar size='lg' radius='xl' color='blue'>
            {(member.name?.[0] || 'M').toUpperCase()}
          </Avatar>
          <Stack gap={2}>
            <Text fw={500} size='lg'>
              {member.name}
            </Text>
            <Text size='sm' c='dimmed'>
              {member.phone}
            </Text>
            <Badge size='sm' color='gray'>
              {member.floor} Floor - {member.bedType}
            </Badge>
          </Stack>
        </Group>
        <Divider />

        {/* Financial Summary */}
        <Stack gap='xs'>
          <Group justify='space-between'>
            <Text fw={500} size='sm'>
              Financial Summary
            </Text>
            {loadingPreview && <Loader size='xs' />}
          </Group>
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Total Agreed Deposit:
            </Text>
            <Text size='sm' fw={500}>
              <NumberFormatter value={displayData.totalAgreedDeposit} prefix='₹' thousandSeparator />
            </Text>
          </Group>
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Outstanding Balance:
            </Text>
            <Text size='sm' fw={500} c={displayData.outstandingBalance > 0 ? 'red' : 'green'}>
              <NumberFormatter value={displayData.outstandingBalance} prefix='₹' thousandSeparator />
            </Text>
          </Group>
          <Divider />
          <Group justify='space-between'>
            <Text fw={500} size='sm'>
              Settlement Status:
            </Text>
            <Badge
              color={displayData.refundAmount > 0 ? 'green' : displayData.refundAmount < 0 ? 'red' : 'gray'}
              variant='light'>
              {displayData.status}
            </Badge>
          </Group>
          <Group justify='space-between'>
            <Text fw={500} size='sm'>
              {displayData.refundAmount > 0
                ? 'Refund Amount:'
                : displayData.refundAmount < 0
                ? 'Amount Due:'
                : 'Settlement:'}
            </Text>
            <Text
              fw={600}
              size='sm'
              c={displayData.refundAmount > 0 ? 'green' : displayData.refundAmount < 0 ? 'red' : 'gray'}>
              <NumberFormatter value={Math.abs(displayData.refundAmount)} prefix='₹' thousandSeparator />
            </Text>
          </Group>
        </Stack>
        <Divider />

        {/* Leave Date */}
        <DatePickerInput
          label='Leave Date'
          placeholder='Select leave date'
          value={leaveDate}
          onChange={(date) => {
            if (date) {
              const dateObject = typeof date === 'string' ? new Date(date) : date;
              setLeaveDate(dateObject);
            }
          }}
          leftSection={<IconCalendar size={16} />}
          required
        />

        {/* Action Buttons */}
        <Group justify='flex-end' gap='sm'>
          <Button variant='subtle' onClick={handleCancel}>
            Cancel
          </Button>
          <Button color='red' onClick={handleConfirmDelete} loading={deleting}>
            Delete Member
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeleteMemberModal;
