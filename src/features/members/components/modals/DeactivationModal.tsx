// Deactivation Modal Component - Handles member deactivation with settlement calculation
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { Stack, Group, Text, Badge, Avatar, Button, Divider, NumberFormatter, Loader } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { SharedModal } from '../../../../shared/components/SharedModal';

// Mock data and types for Phase 1
interface Member {
  id: string;
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  isActive: boolean;
  totalAgreedDeposit?: number;
  outstandingBalance?: number;
}

interface SettlementPreview {
  memberName: string;
  totalAgreedDeposit: number;
  outstandingBalance: number;
  refundAmount: number;
  status: string;
  leaveDate: string;
}

interface DeactivationModalProps {
  opened: boolean;
  onClose: () => void;
  member: Member | null;
}

export const DeactivationModal: FC<DeactivationModalProps> = ({ opened, onClose, member }) => {
  const [leaveDate, setLeaveDate] = useState<Date>(new Date());
  const [deactivating, setDeactivating] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreview | null>(null);

  // Mock settlement calculation function
  const calculateMockSettlement = useCallback((currentMember: Member, currentLeaveDate: Date) => {
    if (!currentMember) return null;

    const totalDeposit = Number(currentMember.totalAgreedDeposit) || 5500;
    const outstanding = Number(currentMember.outstandingBalance) || 1200;
    const refund = totalDeposit - outstanding;

    return {
      memberName: currentMember.name,
      totalAgreedDeposit: totalDeposit,
      outstandingBalance: outstanding,
      refundAmount: refund,
      status: refund > 0 ? 'Refund Due' : refund < 0 ? 'Payment Due' : 'Settled',
      leaveDate: currentLeaveDate.toISOString().split('T')[0] || '',
    };
  }, []);

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
    const totalDeposit = Number(member.totalAgreedDeposit) || 5500;
    const outstanding = Number(member.outstandingBalance) || 1200;
    const refund = totalDeposit - outstanding;

    return {
      totalAgreedDeposit: totalDeposit,
      outstandingBalance: outstanding,
      refundAmount: refund,
      status: refund > 0 ? 'Refund Due' : refund < 0 ? 'Payment Due' : 'Settled',
    };
  }, [settlementPreview, member]);

  // Fetch settlement preview when member or leave date changes
  const fetchSettlementPreview = useCallback(
    async (currentMember: Member, currentLeaveDate: Date) => {
      if (!currentMember) return;

      try {
        setLoadingPreview(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const preview = calculateMockSettlement(currentMember, currentLeaveDate);
        setSettlementPreview(preview);
      } catch (error) {
        console.error('Error calculating settlement preview:', error);
        notifications.show({
          title: 'Error',
          message: 'Failed to calculate settlement preview. Using basic calculation.',
          color: 'orange',
        });

        // Fallback to basic calculation
        const preview = calculateMockSettlement(currentMember, currentLeaveDate);
        setSettlementPreview(preview);
      } finally {
        setLoadingPreview(false);
      }
    },
    [calculateMockSettlement]
  );

  // Effect for handling settlement preview - includes debouncing for leave date changes
  useEffect(() => {
    if (!opened || !member) return;

    // Debounce the settlement preview fetch to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      void fetchSettlementPreview(member, leaveDate);
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

  const handleConfirmDeactivation = async () => {
    if (!member) return;

    try {
      setDeactivating(true);
      
      // Mock deactivation API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      notifications.show({
        title: 'Success',
        message: `${member.name} has been deactivated successfully`,
        color: 'green',
      });

      console.log('Member deactivated:', {
        memberId: member.id,
        memberName: member.name,
        leaveDate: leaveDate.toISOString(),
        settlement: displayData,
      });

      onClose();
    } catch (error) {
      console.error('Error deactivating member:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to deactivate member. Please try again.',
        color: 'red',
      });
    } finally {
      setDeactivating(false);
    }
  };

  const handleCancel = () => {
    setLeaveDate(new Date());
    setSettlementPreview(null);
    onClose();
  };

  const handleDeactivationClick = () => {
    void handleConfirmDeactivation();
  };

  if (!member) return null;

  return (
    <SharedModal
      opened={opened}
      onClose={handleCancel}
      title="Deactivate Member"
      size="md"
    >
      <Stack gap="md">
        {/* Member Info */}
        <Group>
          <Avatar size="lg" radius="xl" color="blue">
            {(member.name?.[0] || 'M').toUpperCase()}
          </Avatar>
          <Stack gap={2}>
            <Text fw={500} size="lg">
              {member.name}
            </Text>
            <Text size="sm" c="dimmed">
              {member.phone}
            </Text>
            <Badge size="sm" color="gray">
              {member.floor} Floor - {member.bedType}
            </Badge>
          </Stack>
        </Group>
        <Divider />

        {/* Financial Summary */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fw={500} size="sm">
              Settlement Summary
            </Text>
            {loadingPreview && <Loader size="xs" />}
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Total Agreed Deposit:
            </Text>
            <Text size="sm" fw={500}>
              <NumberFormatter value={displayData.totalAgreedDeposit} prefix="₹" thousandSeparator />
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Outstanding Balance:
            </Text>
            <Text size="sm" fw={500} c={displayData.outstandingBalance > 0 ? 'red' : 'green'}>
              <NumberFormatter value={displayData.outstandingBalance} prefix="₹" thousandSeparator />
            </Text>
          </Group>
          <Divider />
          <Group justify="space-between">
            <Text fw={500} size="sm">
              Settlement Status:
            </Text>
            <Badge
              color={displayData.refundAmount > 0 ? 'green' : displayData.refundAmount < 0 ? 'red' : 'gray'}
              variant="light"
            >
              {displayData.status}
            </Badge>
          </Group>
          <Group justify="space-between">
            <Text fw={500} size="sm">
              {displayData.refundAmount > 0
                ? 'Refund Amount:'
                : displayData.refundAmount < 0
                ? 'Amount Due:'
                : 'Settlement:'}
            </Text>
            <Text
              fw={600}
              size="sm"
              c={displayData.refundAmount > 0 ? 'green' : displayData.refundAmount < 0 ? 'red' : 'gray'}
            >
              <NumberFormatter value={Math.abs(displayData.refundAmount)} prefix="₹" thousandSeparator />
            </Text>
          </Group>
        </Stack>
        <Divider />

        {/* Leave Date */}
        <MonthPickerInput
          label="Leave Month"
          placeholder="Select leave month and year"
          value={leaveDate && leaveDate instanceof Date ? leaveDate.toISOString().slice(0, 7) : null}
          onChange={(value: string | null) => {
            if (value) {
              // Convert string (YYYY-MM) to Date object
              const [year, month] = value.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, 1);
              setLeaveDate(date);
            } else {
              setLeaveDate(new Date());
            }
          }}
          required
          description="Month when the member will vacate"
        />

        {/* Action Buttons */}
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
          <Button color="orange" onClick={handleDeactivationClick} loading={deactivating}>
            Deactivate Member
          </Button>
        </Group>
      </Stack>
    </SharedModal>
  );
};
