import { useForm } from '@mantine/form';
import { useState, useEffectEvent, useEffect, startTransition } from 'react';
import type { PaymentStatus } from '../../../../../data/types';
import { getStatusColor, getStatusTitle, toNumber } from '../../../../../shared/utils';
import { simulateNetworkDelay } from '../../../../../data/utils/serviceUtils';
import { useGlobalModalManager } from '../../../stores/modal-store';
import type { GlobalModalProps } from '../../../stores/GlobalModal';
import { useFormStore } from '../../../default-rents/components/DefaultRentsPage';

interface RecordPaymentFormData {
    amountPaid: string | number;
    note: string;
}

export const useRecordPaymentModal = ({ opened, onClose }: GlobalModalProps) => {
    const modalManager = useGlobalModalManager('recordPayment', opened, onClose);
    const { selectedMember, handleModalWork, hasErrorForModal, getCachedFormValues, setModalError, clearModalError } =
        modalManager;

    const {
        state: { values, error, saveResult, isPending, memberContext },
        dispatcher,
        resetState
    } = useFormStore<RecordPaymentFormData>('record-payment', {
        name: selectedMember?.name || '',
        id: selectedMember?.id || ''
    });

    const rent = selectedMember?.currentMonthRent || { totalCharges: 0, amountPaid: 0, note: '' };
    const [status, setStatus] = useState<PaymentStatus>('Due');

    const form = useForm<RecordPaymentFormData>({
        initialValues: { amountPaid: '', note: '' },
        onValuesChange: ({ amountPaid }) => {
            startTransition(() => {
                const amt = toNumber(amountPaid);
                if (amt === 0) return setStatus('Due');
                if (amt === rent.totalCharges) return setStatus('Paid');
                if (amt > 0 && amt < rent.totalCharges) return setStatus('Partial');
                if (amt > rent.totalCharges) return setStatus('Overpaid');
            });
        },
        validate: {
            amountPaid: (val) => (!val || toNumber(val) < 0 ? 'Please enter a valid amount' : null),
            note: (val, { amountPaid }) =>
                toNumber(amountPaid) > 0 && toNumber(amountPaid) < rent.totalCharges && !val ?
                    'Note is required for partial payments'
                :   null
        }
    });

    const setupForm = useEffectEvent(() => {
        if (!selectedMember || !opened) return;
        const initial = { amountPaid: rent.amountPaid || '', note: rent.note ?? '' };

        form.setValues(hasErrorForModal ? getCachedFormValues() : initial);
        form.resetDirty(initial);
    });

    useEffect(() => setupForm(), [opened]);

    const convertedAmount = toNumber(form.values.amountPaid);
    const isPaymentBelowOutstanding = convertedAmount > 0 && convertedAmount < rent.totalCharges;

    // const handleRecordPayment = (values: RecordPaymentFormData) => {
    //     if (!selectedMember) return;
    //     handleModalWork(async () => {
    //         try {
    //             await simulateNetworkDelay(3000);
    //             throw new Error('Failed to record payment');
    //             clearModalError();
    //         } catch (error) {
    //             setModalError(values, (error as Error).message);
    //         }
    //     });
    // };

    return {
        form,
        status,
        statusColor: getStatusColor(status),
        statusTitle: getStatusTitle(status),
        convertedAmount,
        newOutstanding: rent.totalCharges - convertedAmount,
        isPaymentBelowOutstanding,
        actions: {
            handleRecordPayment:  dispatcher,
            resetForm: () => {
                form.reset();
                clearModalError();
            }
        },
        isPending,
        error,
        saveResult,
        memberContext,
        ...modalManager
    };
};
