import { useForm } from '@mantine/form';
import { useState, useEffectEvent, useEffect } from 'react';
import type { PaymentStatus } from '../../../../../../data/types';
import { getStatusColor, getStatusTitle, toNumber } from '../../../../../../shared/utils';
import { simulateNetworkDelay, simulateRandomError } from '../../../../../../data/utils/serviceUtils';
import { useGlobalModalManager } from '../../../../stores/modal-store';

interface RecordPaymentFormData {
    amountPaid: string | number;
    note: string;
}

export const useRecordPaymentModal = ({ opened, onClose }: { opened: boolean; onClose: () => void }) => {
    const modalManager = useGlobalModalManager('recordPayment', opened, onClose);
    const { selectedMember, handleModalWork, hasErrorForModal, getCachedFormValues, setModalError, clearModalError } =
        modalManager;
    const [status, setStatus] = useState<PaymentStatus>('Due');
    const { totalCharges, amountPaid, note } =
        selectedMember ?
            selectedMember.currentMonthRent
        :   {
                totalCharges: 0,
                amountPaid: 0,
                note: ''
            };

    const form = useForm<RecordPaymentFormData>({
        initialValues: {
            amountPaid: '',
            note: ''
        },
        onValuesChange(values) {
            const amount = toNumber(values.amountPaid);

            setStatus(() => {
                if (amount === 0) {
                    return 'Due';
                } else if (amount === totalCharges) {
                    return 'Paid';
                } else if (amount > 0 && amount < totalCharges) {
                    return 'Partial';
                } else if (amountPaid > totalCharges || amount > totalCharges) {
                    return 'Overpaid';
                }
                return 'Paid';
            });
        },
        validate: {
            amountPaid: (value) => {
                if (value === '' || toNumber(value) < 0) {
                    return 'Please enter a valid amount';
                }
                return null;
            },
            note: (value, values) => {
                const amount = toNumber(values.amountPaid);
                if (amount > 0 && amount < totalCharges && !value) {
                    return 'Note is required for partial payments';
                }
                return null;
            }
        }
    });

    const setFormValuesEvent = useEffectEvent(() => {
        if (!selectedMember || !opened) return;
        if (hasErrorForModal) {
            form.setValues(getCachedFormValues());
            form.resetDirty({
                amountPaid: selectedMember.currentMonthRent.amountPaid || '',
                note: selectedMember.currentMonthRent.note ?? ''
            });
            return;
        }
        // If there's no error, we'll use the current values
        form.setValues({
            amountPaid: amountPaid || '',
            note: note ?? ''
        });
        form.resetDirty();
    });

    useEffect(() => {
        setFormValuesEvent();
    }, [opened]);

    const convertedAmount = toNumber(form.values.amountPaid);
    const newOutstanding = totalCharges - convertedAmount;
    const isPaymentBelowOutstanding = convertedAmount > 0 && convertedAmount < totalCharges;

    const statusColor = getStatusColor(status);
    const statusTitle = getStatusTitle(status);

    const handleRecordPayment = (values: RecordPaymentFormData) => {
        if (!selectedMember) return;

        handleModalWork(async () => {
            try {
                await simulateNetworkDelay(3000);
                simulateRandomError();
                clearModalError();
            } catch (error) {
                setModalError(values, (error as Error).message);
            }
        });
    };

    const resetForm = () => {
        if (!selectedMember) return;
        form.reset();
        clearModalError();
    };

    return {
        form,
        status,
        statusColor,
        statusTitle,
        convertedAmount,
        newOutstanding,
        isPaymentBelowOutstanding,
        actions: {
            handleRecordPayment,
            resetForm
        },
        ...modalManager
    };
};
