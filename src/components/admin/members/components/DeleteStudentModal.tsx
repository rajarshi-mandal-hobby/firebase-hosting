// Delete Student Modal Component - Handles student deactivation with refund calculation
import React, { useState } from 'react';
import { Modal, Stack, Group, Text, Badge, Avatar, Button, Divider, NumberFormatter, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { deleteStudentWithSettlement, calculateSettlementPreview } from '../../../../lib/firestore';
import type { Student } from '../../../../types/student';

interface SettlementPreview {
  studentName: string;
  totalDepositAgreed: number;
  currentOutstandingBalance: number;
  refundAmount: number;
  status: string;
  leaveDate: string;
}

interface DeleteStudentModalProps {
  opened: boolean;
  onClose: () => void;
  student: Student | null;
}

const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({ opened, onClose, student }) => {
  const [leaveDate, setLeaveDate] = useState<Date>(new Date());
  const [deleting, setDeleting] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [settlementPreview, setSettlementPreview] = useState<SettlementPreview | null>(null);

  // Calculate display data - using useMemo for performance
  const displayData = React.useMemo(() => {
    if (settlementPreview) {
      return settlementPreview;
    }

    if (!student) {
      return {
        totalDepositAgreed: 0,
        currentOutstandingBalance: 0,
        refundAmount: 0,
        status: 'Loading...',
      };
    }

    // Fallback calculation with proper number conversion
    const totalDeposit = Number(student.totalDepositAgreed) || 0;
    const outstanding = Number(student.currentOutstandingBalance) || 0;
    const refund = totalDeposit - outstanding;

    return {
      totalDepositAgreed: totalDeposit,
      currentOutstandingBalance: outstanding,
      refundAmount: refund,
      status: refund > 0 ? 'Refund Due' : refund < 0 ? 'Payment Due' : 'Settled',
    };
  }, [settlementPreview, student]);
  // Memoized function to fetch settlement preview - stable reference
  const fetchSettlementPreview = React.useCallback(
    async (currentStudent: Student, currentLeaveDate: Date) => {
      if (!currentStudent) return;

      if (!currentStudent.id) {
        console.error('Student ID is missing for settlement preview');
        // Use fallback calculation when ID is missing
        const refundAmount =
          (Number(currentStudent.totalDepositAgreed) || 0) - (Number(currentStudent.currentOutstandingBalance) || 0);

        setSettlementPreview({
          studentName: currentStudent.name,
          totalDepositAgreed: Number(currentStudent.totalDepositAgreed) || 0,
          currentOutstandingBalance: Number(currentStudent.currentOutstandingBalance) || 0,
          refundAmount,
          status: refundAmount > 0 ? 'Refund Due' : refundAmount < 0 ? 'Payment Due' : 'Settled',
          leaveDate: currentLeaveDate.toISOString().split('T')[0] || '',
        });
        return;
      }
      try {
        setLoadingPreview(true);

        // Use the cloud function for accurate settlement calculation
        const preview = (await calculateSettlementPreview(currentStudent.id, currentLeaveDate)) as SettlementPreview;
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
          (Number(currentStudent.totalDepositAgreed) || 0) - (Number(currentStudent.currentOutstandingBalance) || 0);

        setSettlementPreview({
          studentName: currentStudent.name,
          totalDepositAgreed: Number(currentStudent.totalDepositAgreed) || 0,
          currentOutstandingBalance: Number(currentStudent.currentOutstandingBalance) || 0,
          refundAmount,
          status: refundAmount > 0 ? 'Refund Due' : refundAmount < 0 ? 'Payment Due' : 'Settled',
          leaveDate: currentLeaveDate.toISOString().split('T')[0] || '',
        });
      } finally {
        setLoadingPreview(false);
      }
    },
    [setSettlementPreview, setLoadingPreview]
  ); // Effect for initial load when modal opens - only when modal opens or student changes  // Single effect for handling settlement preview - includes debouncing for leave date changes
  React.useEffect(() => {
    if (!opened || !student) return;

    // Debounce the settlement preview fetch to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      fetchSettlementPreview(student, leaveDate);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [opened, student, leaveDate, fetchSettlementPreview]);

  // Effect for resetting state when modal closes
  React.useEffect(() => {
    if (!opened) {
      setSettlementPreview(null);
      setLeaveDate(new Date());
    }
  }, [opened]);
  const handleConfirmDelete = async () => {
    if (!student) return;

    if (!student.id) {
      notifications.show({
        title: 'Error',
        message: 'Student ID is missing. Cannot proceed with deletion.',
        color: 'red',
      });
      return;
    }
    try {
      setDeleting(true);
      await deleteStudentWithSettlement(student.id, leaveDate);

      notifications.show({
        title: 'Success',
        message: `${student.name} has been deactivated successfully`,
        color: 'green',
      });

      onClose();
    } catch (error) {
      console.error('Error deleting student:', error);

      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('UNAUTHENTICATED') || errorMessage.includes('Authentication required')) {
        notifications.show({
          title: 'Authentication Error',
          message: 'Please sign in to delete student. Please try again after signing in.',
          color: 'red',
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to deactivate student. Please try again.',
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
  if (!student) return null;

  return (
    <Modal opened={opened} onClose={handleCancel} title='Delete Student' size='md' centered>
      <Stack gap='md'>
        {/* Student Info */}
        <Group>
          <Avatar size='lg' radius='xl' color='blue'>
            {(student.name?.[0] || 'S').toUpperCase()}
          </Avatar>
          <Stack gap={2}>
            <Text fw={500} size='lg'>
              {student.name}
            </Text>
            <Text size='sm' c='dimmed'>
              {student.phone}
            </Text>
            <Badge size='sm' color='gray'>
              {student.floor} Floor - {student.bedType}
            </Badge>
          </Stack>
        </Group>
        <Divider /> {/* Financial Summary */}
        <Stack gap='xs'>
          <Group justify='space-between'>
            <Text fw={500} size='sm'>
              Financial Summary
            </Text>
            {loadingPreview && <Loader size='xs' />}
          </Group>
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Total Deposit Agreed:
            </Text>
            <Text size='sm' fw={500}>
              <NumberFormatter value={displayData.totalDepositAgreed} prefix='₹' thousandSeparator />
            </Text>
          </Group>
          <Group justify='space-between'>
            <Text size='sm' c='dimmed'>
              Current Outstanding Balance:
            </Text>
            <Text size='sm' fw={500} c={displayData.currentOutstandingBalance > 0 ? 'red' : 'green'}>
              <NumberFormatter value={displayData.currentOutstandingBalance} prefix='₹' thousandSeparator />
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
            Delete Student
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeleteStudentModal;
