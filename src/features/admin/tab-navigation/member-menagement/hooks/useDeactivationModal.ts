import dayjs from 'dayjs';
import { useState, useEffectEvent, useEffect } from 'react';
import { simulateNetworkDelay } from '../../../../../data/utils/serviceUtils';
import { notifyError, getSafeDate } from '../../../../../shared/utils';
import { useGlobalModalManager } from '../../../stores/modal-store';

type SettlementStatus = 'Refund Due' | 'Payment Due' | 'Settled';

type SettlementPreview = {
    leaveMonth: string | null;
    totalAgreedDeposit: number;
    rentAtJoining: number;
    currentMonthOutstanding: number;
    refundAmount: number;
    status: SettlementStatus;
    text: string;
    color: string;
};

export const useDeactivationModal = (opened: boolean, onClose: () => void) => {
    const [leaveMonth, setLeaveMonth] = useState<string | null>(null);
    const [monthInputError, setMonthInputError] = useState<string | null>(null);

    const {
        selectedMember,
        handleModalWork,
        isModalWorking,
        workingMemberName,
        hasErrorForModal,
        setModalError,
        clearModalError,
        getCachedFormValues,
        errorMemberName,
        hasErrors,
        isSuccess
    } = useGlobalModalManager('deactivateMember', opened, onClose);

    const { memberName, bedType, floor } = {
        memberName: selectedMember?.name ?? '',
        bedType: selectedMember?.bedType ?? '',
        floor: selectedMember?.floor ?? ''
    };

    const handleReset = () => {
        setLeaveMonth(null);
        setMonthInputError(null);
    };

    const effectEvent = useEffectEvent(() => {
        if (!opened || !selectedMember) return;
        if (hasErrorForModal) {
            setLeaveMonth(getCachedFormValues());
            setMonthInputError(null);
        } else {
            handleReset();
        }
    });

    useEffect(() => {
        effectEvent();
    }, [opened]);

    const getSettlementStatus = (refundAmount: number): { status: SettlementStatus; color: string; text: string } => {
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

    const settlementPreview = ((): SettlementPreview => {
        if (!selectedMember) {
            const { status, color, text } = getSettlementStatus(0);
            return {
                leaveMonth: leaveMonth,
                totalAgreedDeposit: 0,
                rentAtJoining: 0,
                currentMonthOutstanding: 0,
                refundAmount: 0,
                text,
                status,
                color
            };
        }

        const currentMonthOutstanding = selectedMember.currentMonthRent.currentOutstanding;
        const rentAtJoining = selectedMember.rentAtJoining;

        const remainingBalance = selectedMember.totalAgreedDeposit - (currentMonthOutstanding + rentAtJoining);
        const { status, color, text } = getSettlementStatus(remainingBalance);

        return {
            leaveMonth: leaveMonth,
            totalAgreedDeposit: selectedMember.totalAgreedDeposit,
            rentAtJoining,
            currentMonthOutstanding,
            refundAmount: remainingBalance,
            text,
            status,
            color
        };
    })();

    const handleErrorReset = () => {
        if (!selectedMember) return;
        handleReset();
        clearModalError();
    };

    const handleConfirmDeactivation = async () => {
        if (!selectedMember) {
            notifyError('Member not found');
            return;
        }

        if (!leaveMonth) {
            setMonthInputError('Please select a leave date');
            return;
        }

        const regex = /^\d{4}-\d{2}-\d{2}$/g;
        if (!regex.test(leaveMonth)) {
            setMonthInputError('Please select a valid date');
            return;
        }

        if (isModalWorking) return;

        await handleModalWork(async () => {
            try {
                await simulateNetworkDelay(3000);
                clearModalError();
            } catch (error) {
                setModalError(leaveMonth, (error as Error).message);
            }
        });
    };

    const handleDateChange = (date: string | null) => {
        setLeaveMonth(date);
        setMonthInputError(null);
    };

    const dayjsLastBillingMonth = dayjs(getSafeDate(selectedMember?.currentMonthRent.generatedAt));
    const memberLastBillingMonth = dayjsLastBillingMonth.format('MMMM YYYY');
    const minDate = dayjsLastBillingMonth.subtract(1, 'month').toDate();
    const maxDate = dayjsLastBillingMonth.add(1, 'month').toDate();

    const isLeavingNextMonth = selectedMember && leaveMonth ? dayjsLastBillingMonth.isBefore(leaveMonth) : false;
    const isLeavingPreviousMonth = selectedMember && leaveMonth ? dayjsLastBillingMonth.isAfter(leaveMonth) : false;

    return {
        // Member Info
        memberName,
        memberLastBillingMonth,
        floor,
        bedType,
        leaveMonth,
        // Input Errors
        monthInputError,
        // Input Date Range
        minDate,
        maxDate,
        handleDateChange,
        // Settlement Preview
        settlementPreview,
        isLeavingNextMonth,
        isLeavingPreviousMonth,
        // Modal Actions
        handleConfirmDeactivation,
        // Modal State
        isModalWorking,
        workingMemberName,
        isSuccess,
        errorMemberName,
        hasErrors,
        hasErrorForModal,
        handleErrorReset
    };
};
