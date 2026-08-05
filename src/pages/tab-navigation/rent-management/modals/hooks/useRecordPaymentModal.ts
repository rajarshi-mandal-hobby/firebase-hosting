import { useForm } from '@mantine/form';
import { closeAllModals } from '@mantine/modals';
import { doc } from 'firebase/firestore';
import { useEffectEvent, useEffect, startTransition } from 'react';
import { type PaymentStatus, type Member, type RentHistory, DB } from '../../../../../data/types';
import { db, runTransactionWrapper } from '../../../../../firebase';
import {
    getPaymentStatus,
    notifySuccess,
    notifyError,
    toNumber,
    isInteger,
    getMemberFirstname,
    notifyLoading
} from '../../../../../shared/utils';
import { useFormStore } from '../../../../admin-dashboard/hooks/useFormStore';
import { simulateNetworkDelay } from '../../../../../data/utils/serviceUtils';

interface InputFormValues {
    amountPaid: string | number;
    note: string;
}

interface OutputFormValues {
    amountPaid: number;
    note: string;
}

type CurrentTitle = 'No payment' | 'Paying in full' | 'Paying partially' | 'Paying over';

interface PaymentDetails {
    currentStatus: PaymentStatus;
    currentTitle: CurrentTitle;
}

const getPaymentDetails = (amountPaid: number, totalCharges: number): PaymentDetails => {
    const status = getPaymentStatus(amountPaid, totalCharges);
    return {
        currentStatus: status,
        currentTitle:
            status === 'Paid' ? 'Paying in full'
            : status === 'Partial' ? 'Paying partially'
            : status === 'Overpaid' ? 'Paying over'
            : 'No payment'
    };
};

export const useRecordPaymentModal = (member: Member) => {
    const { isGlobalPending, clearFormState, retrieveFormState, onFormSubmit, onFormError, getFormName } =
        useFormStore<InputFormValues>();

    const memberId = member.id;
    const { totalCharges, amountPaid: prevAmountPaid, note: prevNote } = member.currentMonthRent;

    const formState = retrieveFormState('record_payment', memberId);
    const hasError = !!formState?.hasError;
    const isPending = !!formState?.isPending || isGlobalPending;

    const form = useForm<InputFormValues, OutputFormValues>({
        initialValues: { amountPaid: prevAmountPaid || '', note: prevNote },
        validate: {
            amountPaid(val) {
                return !isInteger(val) || val < 0 || (prevAmountPaid === 0 && val === 0) ?
                        'Please enter a valid amount'
                    :   null;
            },
            note(val, { amountPaid }) {
                return isInteger(amountPaid) && amountPaid > 0 && amountPaid < totalCharges && !val.trim() ?
                        'Note is required for partial payments'
                    :   null;
            }
        },
        transformValues({ amountPaid, note }) {
            return {
                amountPaid: toNumber(amountPaid),
                note: note.trim()
            };
        }
    });

    const evnt = useEffectEvent(() => {
        const draft = formState?.draft;
        if (draft) {
            form.setValues(draft);
        }
    });

    useEffect(() => {
        evnt();
    }, []);

    const save = async (payload: OutputFormValues) => {
        const memberName = member.name;
        onFormSubmit(payload, 'record_payment', { memberId, memberName });

        const memberFirstname = getMemberFirstname(memberName);

        const currentMonthRent = member.currentMonthRent;
        const newAmountPaid = payload.amountPaid;
        const isAmountRemoved = newAmountPaid === 0;
        const newPaymentStatus = getPaymentStatus(newAmountPaid, currentMonthRent.totalCharges);
        const newOutstanding = currentMonthRent.totalCharges - newAmountPaid;

        const transactionData = {
            currentMonthRent: {
                ...currentMonthRent,
                amountPaid: newAmountPaid,
                paymentStatus: newPaymentStatus,
                outstanding: newOutstanding,
                note: isAmountRemoved ? '' : payload.note
            } satisfies RentHistory
        };
        await runTransactionWrapper(
            getFormName('record_payment'),
            `Recording ${memberFirstname}'s payment...`,
            isAmountRemoved ? 'Removed previous payment!' : 'Payment recorded!'
        )(
            async (t) => {
                t.update(doc(db, DB.memberCol, memberId), transactionData);

                clearFormState('record_payment', memberId);

                closeAllModals();
            },
            (error) => {
                onFormError('record_payment', memberId);
            }
        );
    };

    const formValues = form.getValues();
    const formAmountPaid = toNumber(formValues.amountPaid);
    const isPaymentBelowOutstanding = getPaymentStatus(formAmountPaid, totalCharges) === 'Partial';

    return {
        // Form
        form,
        formValues,

        // State
        isPending: isPending,
        hasError,

        // Payment related computed values
        isPaymentBelowOutstanding,
        paymentDisplayData: getPaymentDetails(formAmountPaid, totalCharges),
        newOutstanding: totalCharges - formAmountPaid,

        // Actions
        actions: {
            handleRecordPayment(values: OutputFormValues) {
                startTransition(() => save(values));
            },
            resetForm() {
                form.reset();
                clearFormState('record_payment', memberId);
            }
        }
    };
};
