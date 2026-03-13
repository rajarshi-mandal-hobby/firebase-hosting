import dayjs from 'dayjs';
import { startTransition } from 'react';
import { getSafeDate, useGlobalFormResult } from '../../../../../../../../shared/utils';
import { type GlobalModalProps } from '../../../../../../../../shared/components/GlobalModal';
import { useGlobalFormStore } from '../../../../../../../../contexts';
import { useForm } from '@mantine/form';
import type { PaymentStatus } from '../../../../../../../../data/types';

type SettlementStatus = 'Refund Due' | 'Payment Due' | 'Settled';

interface SettlementPreview {
    memberStatus: PaymentStatus;
    totalAgreedDeposit: number;
    rentAtJoining: number;
    currentMonthOutstanding: number;
    refundAmount: number;
    status: SettlementStatus;
    text: string;
    color: string;
}

interface DeactivationFormValues {
    leaveMonth: string | null;
    selectedMemberId: string;
    notes: string;
}

export const useDeactivationModal = ({ opened, onClose }: GlobalModalProps) => {
    const {
        selectedMember,
        state: { isPending, values, error, saveResult },
        onResetState,
        dispatcher
    } = useGlobalFormStore<DeactivationFormValues>('deactivate-member');

    const getDate = (date: unknown) => dayjs(getSafeDate(date)).endOf('month').format('YYYY-MM-DD');

    const form = useForm<DeactivationFormValues>({
        initialValues: {
            leaveMonth: null,
            selectedMemberId: '',
            notes: ''
        },
        validate: {
            leaveMonth: (value) => {
                if (!value) return 'Please select a leave date';
                const regex = /^\d{4}-\d{2}-\d{2}$/;
                if (!regex.test(value)) return 'Please select a valid date';
                return null;
            },
            selectedMemberId: (value) => {
                if (typeof value === 'string' && value !== selectedMember?.id) return 'Please select a member';
                return null;
            },
            notes: (value) => {
                if (typeof value === 'string' && value.length > 255) return 'Notes cannot exceed 255 characters';
                return null;
            }
        },
        transformValues: (values) => ({
            ...values,
            leaveMonth: getDate(values.leaveMonth)
        })
    });

    const otherErrors = useGlobalFormResult<DeactivationFormValues>({
        form,
        selectedMember,
        opened,
        onClose,
        onResetState,
        initial: {
            leaveMonth: null,
            selectedMemberId: selectedMember?.id ?? '',
            notes: ''
        },
        values,
        error,
        saveResult,
        isPending
    });

    const hasError = !!error || !!saveResult?.success;

    const dayjsLastBillingMonth = dayjs(getSafeDate(selectedMember?.currentMonthRent.generatedAt)).endOf('month');
    const memberLastBillingMonth = dayjsLastBillingMonth.format('MMMM YYYY');
    const minDate = dayjsLastBillingMonth.subtract(1, 'month').toDate();
    const maxDate = dayjsLastBillingMonth.toDate();

    const selectedLeaveMonth = dayjs(form.values.leaveMonth).endOf('month');
    const isLeavingPreviousMonth = selectedLeaveMonth.isBefore(dayjsLastBillingMonth);

    const getBaseData: () => SettlementPreview = () => {
        const getSettlementStatus = (
            refundAmount: number
        ): { status: SettlementStatus; color: string; text: string } => {
            switch (true) {
                case refundAmount > 0:
                    return {
                        status: 'Refund Due',
                        color: 'green.9',
                        text: 'I Give'
                    };
                case refundAmount < 0:
                    return {
                        status: 'Payment Due',
                        color: 'red',
                        text: 'I Get'
                    };
                default:
                    return {
                        status: 'Settled',
                        color: 'gray',
                        text: 'Settled'
                    };
            }
        };

        if (!selectedMember) {
            const { status, color, text } = getSettlementStatus(0);
            return {
                memberStatus: 'Due',
                leaveMonth: form.values.leaveMonth,
                totalAgreedDeposit: 0,
                rentAtJoining: 0,
                currentMonthOutstanding: 0,
                refundAmount: 0,
                text,
                status,
                color
            };
        }

        const currentMonthExpenses =
            selectedMember.currentMonthRent.previousOutstanding +
            selectedMember.currentMonthRent.electricity +
            selectedMember.currentMonthRent.wifi;
        const currentMonthOutstanding =
            isLeavingPreviousMonth ?
                currentMonthExpenses - selectedMember.currentMonthRent.amountPaid
            :   selectedMember.currentMonthRent.currentOutstanding;
        const rentAtJoining = selectedMember.rentAtJoining;
        const totalAgreedDeposit = selectedMember.totalAgreedDeposit;

        const refundAmount = totalAgreedDeposit - rentAtJoining - currentMonthOutstanding;
        const { status, color, text } = getSettlementStatus(refundAmount);

        return {
            memberStatus: selectedMember.currentMonthRent.status,
            totalAgreedDeposit,
            rentAtJoining,
            currentMonthOutstanding,
            refundAmount,
            text,
            status,
            color
        };
    };

    // With React Compiler, this is automatically memoized!
    const settlementPreview = getBaseData();

    const actions = {
        handleErrorReset: () => {
            if (!selectedMember || !opened) return;
            form.reset();
            onResetState();
        },
        handleSubmit: (values: DeactivationFormValues) =>
            startTransition(async () => {
                await dispatcher(values);
            })
    };

    return {
        // Member Info
        form,
        selectedMember,
        // Date Info
        memberLastBillingMonth,
        selectedLeaveMonthFormatted: selectedLeaveMonth.format('DD MMM YY'),
        currentMonthName: selectedLeaveMonth.format('MMMM'),
        nextMonthName: selectedLeaveMonth.add(1, 'month').format('MMMM'),
        previousMonthName: selectedLeaveMonth.subtract(1, 'month').format('MMMM'),
        minDate,
        maxDate,
        // Settlement Preview
        settlementPreview,
        isLeavingPreviousMonth,
        // Modal Actions
        actions,
        // Modal State
        isPending,
        hasError,
        otherErrors
    };
};
