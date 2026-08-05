import dayjs from 'dayjs';
import { startTransition, useEffect, useEffectEvent, useState } from 'react';
import { useForm } from '@mantine/form';
import { closeAllModals } from '@mantine/modals';
import { Timestamp, doc } from 'firebase/firestore';
import { type Member, FORM_DATE_FORMAT, DB } from '../../../../../../data/types';
import { db, runTransactionWrapper } from '../../../../../../firebase';
import {
    isSentence,
    notifyLoading,
    notifySuccess,
    notifyError,
    getMemberFirstname
} from '../../../../../../shared/utils';
import { useFormStore } from '../../../../../admin-dashboard/hooks/useFormStore';
import { getSettlementStatus } from '../utils/deactivationUtils';

interface DeactivationFormValues {
    leaveMonth: string | null;
    note: string;
}

export const useDeactivationModal = (member: Member) => {
    const { isGlobalPending, onFormSubmit, onFormError, clearFormState, retrieveFormState } =
        useFormStore<DeactivationFormValues>();
    const memberId = member.id;
    const currentMonthRent = member.currentMonthRent;
    const memberLeaveDate =
        !member.leaveDate ? null : dayjs(member.leaveDate?.toDate()).startOf('month').format(FORM_DATE_FORMAT);
    const [selectedDate, setSelectedDate] = useState(memberLeaveDate);
    const dayjsLastBillingMonth = dayjs(currentMonthRent.generatedAt.toDate()).startOf('month');
    const minDate = dayjsLastBillingMonth.subtract(1, 'month').format(FORM_DATE_FORMAT);
    const maxDate = dayjsLastBillingMonth.format(FORM_DATE_FORMAT);

    const formState = retrieveFormState('deactivate_member', memberId);
    const draft = formState?.draft;
    const hasError = !!formState?.hasError;
    const isPending = !!formState?.isPending;
    const handleClearFormState = () => clearFormState('deactivate_member', memberId);

    const form = useForm<DeactivationFormValues>({
        mode: 'uncontrolled',
        initialValues: {
            leaveMonth: memberLeaveDate,
            note: member.remarks
        },
        onValuesChange({ leaveMonth }) {
            setSelectedDate(leaveMonth);
        },
        transformValues: ({ leaveMonth, note }) => ({
            leaveMonth,
            note: note.trim()
        }),
        validate: {
            leaveMonth(value) {
                if (!value) return 'Please select a leave date';
                const regex = /^\d{4}-\d{2}-\d{2}$/;
                if (!regex.test(value)) return 'Please select a valid date';
                return null;
            },
            note(value) {
                if (value.trim() && !isSentence(value)) return 'Notes cannot exceed 255 characters';
                return null;
            }
        }
    });

    const errEvnt = useEffectEvent(() => {
        if (draft) form.setValues(draft);
    });

    useEffect(() => {
        errEvnt();
    }, []);

    const dayjsSelectedLeaveMonth = selectedDate && dayjs(selectedDate);
    const isLeavingPreviousMonth = dayjsSelectedLeaveMonth && dayjsSelectedLeaveMonth.isBefore(dayjsLastBillingMonth);
    const dayjsNextMonth = dayjsSelectedLeaveMonth && dayjsSelectedLeaveMonth.add(1, 'month');
    const dayjsMonthAfterNextMonth = dayjsNextMonth && dayjsNextMonth.add(1, 'month');

    const currentMonthOutstanding = member.currentMonthRent.outstanding;
    const paidInAdvance = member.rent;
    const totalAgreedDeposit = member.totalAgreedDeposit;

    const actualDeposit = member.totalAgreedDeposit - paidInAdvance;
    const extraCharges = currentMonthOutstanding - paidInAdvance;

    const amountRefundable =
        isLeavingPreviousMonth ? actualDeposit - extraCharges : actualDeposit - currentMonthOutstanding;

    const saveDb = async ({ note, leaveMonth }: DeactivationFormValues) => {
        if (!leaveMonth) return;

        const memberName = member.name;
        const firstname = getMemberFirstname(memberName);
        const notifyId = notifyLoading(`Deactivating ${firstname}...`);

        onFormSubmit({ note, leaveMonth }, 'deactivate_member', { memberId, memberName });

        const month = dayjs(leaveMonth).endOf('month');
        const isActive = !month.isSame(dayjsMonthAfterNextMonth);

        const data: Partial<Member> = {
            leaveDate: Timestamp.fromDate(dayjs(leaveMonth).endOf('month').toDate()),
            remarks: note,
            isActive
        };

        await runTransactionWrapper(
            async (t) => {
                t.update(doc(db, DB.memberCol, memberId), data);

                notifySuccess(`Deactivated ${firstname}!`, { id: notifyId, update: true });
                closeAllModals();
                handleClearFormState();
            },
            (error) => {
                onFormError('deactivate_member', memberId);
                notifyError(error.message, {
                    title: formState?.formName + ': ' + firstname,
                    id: notifyId,
                    update: true
                });
            }
        );
    };

    return {
        // Member Info
        form,
        // Date Info
        memberLastBillingMonth: dayjsLastBillingMonth.format('MMMM'),
        selectedMonth: dayjsSelectedLeaveMonth && dayjsSelectedLeaveMonth.format('DD MMM YY'),
        selectedMonthName: dayjsSelectedLeaveMonth && dayjsSelectedLeaveMonth.format('MMMM'),
        nextMonthName: dayjsNextMonth && dayjsNextMonth.format('MMMM'),
        monthAfterNextMonthName: dayjsMonthAfterNextMonth && dayjsMonthAfterNextMonth.format('MMMM'),
        minDate,
        maxDate,
        // Settlement Preview
        totalAgreedDeposit,
        rentNow: member.rent,
        currentMonthOutstanding,
        settlementStatusConfig: getSettlementStatus(amountRefundable),
        amountRefundable,
        isLeavingPreviousMonth,
        // Modal Actions
        actions: {
            handleErrorReset() {
                form.reset();
                handleClearFormState();
            },
            handleSubmit(values: DeactivationFormValues) {
                startTransition(async () => saveDb(values));
            }
        },
        // Modal State
        isPending: isPending || isGlobalPending,
        hasError
    };
};
