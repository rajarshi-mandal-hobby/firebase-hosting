import dayjs from 'dayjs';
import {
    type Member,
    type Floor,
    type Bed,
    FORM_DATE_FORMAT,
    type MemberFormAction,
    FLOOR_LABEL
} from '../../../data/types';
import { formatPhoneNumber, toIndianLocale, toNumber } from '../../../shared/utils';
import type { MemberFormData, MemberFormSummary } from '../types';
import type { UseFormReturnType } from '@mantine/form';

export const getInitialValues = (
    member: Member | null,
    formAction: MemberFormAction,
    currentBillingDate: string
): MemberFormData => {
    return member ?
            {
                id: member.id,
                moveInDate: dayjs(member.moveInDate.toDate()).startOf('month').format(FORM_DATE_FORMAT),
                name: member.name,
                phone: formatPhoneNumber(member.phone),
                floor: member.floor as Floor,
                bed: member.bed as Bed,
                optedForWifi: member.optedForWifi,
                note: '',
                amountPaid: '',
                forwardOutstanding: false,
                recalculate: false
            }
        :   {
                moveInDate: currentBillingDate,
                name: '',
                phone: '',
                floor: null,
                bed: null,
                optedForWifi: false,
                note: '',
                amountPaid: '',
                forwardOutstanding: false,
                recalculate: false
            };
};

export const calcTotalDeposit = (rentAmount: unknown, securityDeposit: unknown): number =>
    toNumber(rentAmount) * 2 + toNumber(securityDeposit);

export const normalizeNameInput = (value: string) => {
    return value
        .toLowerCase()
        .replaceAll(/[^a-z\s]+/g, '')
        .replaceAll(/\s+/g, ' ')
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
        .trim();
};

export const generateMemberActionNote = (
    values: MemberFormData,
    memberAction: MemberFormAction,
    form: UseFormReturnType<MemberFormData>,
    member: Member | null,
    summary: MemberFormSummary
) => {
    const notes: string[] = [];
    const dateText = `#${dayjs().format('DD-MM-YYYY')} — ${
        memberAction === 'edit' ? 'Updated'
        : memberAction === 'reactivate' ? 'Reactivated'
        : 'Added'
    }`;

    notes.push(dateText);

    if (memberAction === 'add') {
        notes.push(`Rent and Advance Deposit - ${toIndianLocale(summary.rent)} each.`);
        notes.push(`Security Deposit - ${toIndianLocale(summary.securityDeposit)}.`);
        notes.push(`Total Deposit Amount - ${toIndianLocale(summary.totalDeposit)}.`);
        if (summary.outstanding > 0) {
            notes.push(
                `Paid: ${toIndianLocale(values.amountPaid)}. Outstanding: ${toIndianLocale(summary.outstanding)}. Balance will ${values.forwardOutstanding ? "forward to next month's bill." : 'NOT be added to current bill.'}`
            );
        }
    }

    if (memberAction !== 'add') {
        Object.entries(form.getDirty()).forEach(([f, changed]) => {
            const field = f as keyof MemberFormData;
            if (!changed) return;
            if (field === 'amountPaid' || field === 'forwardOutstanding' || field === 'recalculate') return;

            let previousValue = member?.[field];
            let changedValue = values[field];

            if (!previousValue || !changedValue) return;

            if (field === 'moveInDate' && typeof previousValue === 'object') {
                previousValue = dayjs(previousValue.toDate()).format(FORM_DATE_FORMAT);
            }

            if (field === 'floor') {
                previousValue = FLOOR_LABEL[previousValue as Floor];
                changedValue = FLOOR_LABEL[changedValue as Floor];
            }

            if (field === 'optedForWifi') {
                previousValue = previousValue ? 'Yes' : 'No';
                changedValue = changedValue ? 'Yes' : 'No';
            }

            if (typeof previousValue === 'string' && typeof changedValue === 'string') {
                previousValue = previousValue.toUpperCase();
                changedValue = changedValue.toUpperCase();
            }

            const normalizeKey = field.replace(/([A-Z])/g, ' $1').replace(/^[a-z]/, (match) => match.toUpperCase());

            notes.push(`${normalizeKey} changed from ${previousValue} to ${changedValue}`);
        });

        const hasAmountPaidChanged = form.isDirty('amountPaid');

        if (hasAmountPaidChanged) {
            notes.push(
                `Deposit Amount changed from ${toIndianLocale(member?.totalAgreedDeposit)} to ${toIndianLocale(values.amountPaid)}. Outstanding Amount of ${toIndianLocale(summary.outstanding)} will be ${values.forwardOutstanding ? 'forwarded' : 'not forwarded'}.`
            );
        }
    }

    if (values.note) {
        let adminNote = values.note;
        if (adminNote.startsWith('-')) {
            adminNote = adminNote.replace('-', '').trim();
        }

        notes.push(adminNote);
    }

    let finalNote = notes.length ? notes.join('\n- ') : '';
    if (member?.remarks) {
        finalNote += `\n${member.remarks}`;
    }

    return finalNote;
};
