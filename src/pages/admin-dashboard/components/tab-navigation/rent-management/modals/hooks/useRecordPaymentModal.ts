import { useForm } from '@mantine/form';
import { useState, startTransition } from 'react';
import { useGlobalFormStore } from '../../../../../../../contexts';
import type { Member, PaymentStatus } from '../../../../../../../data/types';
import type { GlobalModalProps } from '../../../../../../../shared/components/GlobalModal';
import { getStatusColor, getStatusTitle, toNumber, useGlobalFormResult } from '../../../../../../../shared/utils';

interface RecordPaymentFormData {
    amountPaid: string | number;
    note: string;
}

type CurrentTitle = 'No payment' | 'Paying in full' | 'Paying partially' | 'Paying over';

interface PaymentDetails {
    currentStatus: PaymentStatus;
    currentTitle: CurrentTitle;
    currentColor: ReturnType<typeof getStatusColor>;
}

const DefaultPaymentDetails: PaymentDetails = {
    currentStatus: 'Due',
    currentTitle: 'No payment',
    currentColor: getStatusColor('Due')
} as const;

const getPaymentDetails = (amountPaid: number, rent: Member['currentMonthRent']): PaymentDetails => {
    if (amountPaid === 0)
        return {
            currentStatus: 'Due',
            currentTitle: 'No payment',
            currentColor: getStatusColor('Due')
        };
    if (amountPaid === rent.totalCharges)
        return {
            currentStatus: 'Paid',
            currentTitle: 'Paying in full',
            currentColor: getStatusColor('Paid')
        };
    if (amountPaid > 0 && amountPaid < rent.totalCharges)
        return {
            currentStatus: 'Partial',
            currentTitle: 'Paying partially',
            currentColor: getStatusColor('Partial')
        };
    if (amountPaid > rent.totalCharges)
        return {
            currentStatus: 'Overpaid',
            currentTitle: 'Paying over',
            currentColor: getStatusColor('Overpaid')
        };
    return DefaultPaymentDetails;
};


export const useRecordPaymentModal = ({ opened, onClose }: GlobalModalProps) => {
    const {
        state: { values, error, saveResult, isPending },
        selectedMember,
        dispatcher,
        onResetState
    } = useGlobalFormStore<RecordPaymentFormData>('record-payment');

    const rent = selectedMember?.currentMonthRent || { totalCharges: 0, amountPaid: 0, note: '' };
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(DefaultPaymentDetails);

    const form = useForm<RecordPaymentFormData>({
        initialValues: { amountPaid: '', note: '' },
        onValuesChange: ({ amountPaid }) => {
            startTransition(() =>
                setPaymentDetails(getPaymentDetails(toNumber(amountPaid), rent as Member['currentMonthRent']))
            );
        },
        validate: {
            amountPaid: (val) =>
                typeof val !== 'number' || val < 0 || (rent.amountPaid === 0 && val <= 0) ?
                    'Please enter a valid amount'
                :   null,
            note: (val, { amountPaid }) =>
                toNumber(amountPaid) > 0 && toNumber(amountPaid) < rent.totalCharges && !val?.trim() ?
                    'Note is required for partial payments'
                :   null
        },
        transformValues: ({ amountPaid, note }) => ({
            amountPaid: toNumber(amountPaid),
            note: note?.trim()
        })
    });

    const otherErrors = useGlobalFormResult<RecordPaymentFormData>({
        form,
        selectedMember,
        opened,
        onClose,
        onResetState,
        initial: {
            amountPaid: rent.amountPaid || '',
            note: rent.note ?? ''
        },
        values,
        error,
        saveResult,
        isPending
    });

    const formAmountPaid = toNumber(form.values.amountPaid);
    const isPaymentBelowOutstanding = formAmountPaid > 0 && formAmountPaid < rent.totalCharges;
    const prevStatusColor = getStatusColor(selectedMember?.currentMonthRent.status || 'Due');
    const prevStatusTitle = getStatusTitle(selectedMember?.currentMonthRent.status || 'Due');

    return {
        form,
        isPending,
        error,
        selectedMember,
        paymentDetails,
        prevStatusColor,
        prevStatusTitle,
        prevStatus: selectedMember?.currentMonthRent.status || 'Due',
        formAmountPaid,
        newOutstanding: rent.totalCharges - formAmountPaid,
        isPaymentBelowOutstanding,
        actions: {
            handleRecordPayment: (values: RecordPaymentFormData) =>
                startTransition(async () => await dispatcher(values)),
            resetForm: () => {
                form.reset();
                onResetState();
            }
        },
        hasError: !!error || saveResult?.success === false || !!otherErrors,
        otherErrors
    };
};
