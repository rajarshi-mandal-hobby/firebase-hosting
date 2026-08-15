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
import type { MemberFormData, MemberFormDataTransformed, MemberFormSummary } from '../types';
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
    toNumber(rentAmount) + toNumber(securityDeposit);

export const normalizeNameInput = (value: string) => {
    return value
        .toLowerCase()
        .replaceAll(/[^a-z\s]+/g, '')
        .replaceAll(/\s+/g, ' ')
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
        .trim();
};

const capitalizeWord = (word?: string | null) =>
    word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '';

export const generateMemberActionNote = (
    values: MemberFormDataTransformed,
    memberAction: MemberFormAction,
    form: UseFormReturnType<MemberFormData>,
    member: Member | null,
    summary: MemberFormSummary,
    isPreviousDateSelected: boolean
) => {
    const logs: string[] = [];
    const dateText = `#${dayjs().format('DD-MM-YYYY')} — ${
        memberAction === 'edit' ? 'Updated'
        : memberAction === 'reactivate' ? 'Reactivated'
        : 'Added'
    }`;

    logs.push(dateText);

    if (memberAction === 'add') {
        if (isPreviousDateSelected) {
            logs.push('Past date selected');
        }
        logs.push(`Floor & Bed: ${capitalizeWord(values.floor)} — ${capitalizeWord(values.bed)}`);
        logs.push(`Rent & Advance Deposit: ₹${summary.rent} each`);
        logs.push(`Security Deposit: ₹${summary.securityDeposit}`);
        logs.push(`Total Advance Deposit: ₹${summary.totalDeposit}`);

        if (values.optedForWifi) {
            let wifiMsg = `Opted for Wifi: ₹${summary.wifi}`;
            if (isPreviousDateSelected) {
                wifiMsg += `. Previous Month: ₹${summary.total - (summary.totalDeposit + summary.rent + summary.wifi)}`;
            }

            logs.push(wifiMsg);
        }

        let payableMsg = `Total Payable: ₹${summary.total} → Paid: ${toIndianLocale(values.amountPaid)}`;
        if (summary.outstanding > 0) {
            payableMsg += ` → Outstanding of ${toIndianLocale(summary.outstanding)} was ${values.forwardOutstanding ? '' : 'NOT'} added to current bill.`;
        }
        logs.push(payableMsg);
    } else {
        Object.entries(form.getDirty()).forEach(([f, hasChanged]) => {
            const field = f as keyof MemberFormDataTransformed;
            if (!hasChanged) return;
            if (field === 'amountPaid' || field === 'forwardOutstanding' || field === 'recalculate' || field === 'note')
                return;

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
                previousValue = capitalizeWord(previousValue);
                changedValue = capitalizeWord(changedValue);
            }

            const normalizeKey = field.replace(/([A-Z])/g, ' $1').replace(/^[a-z]/, (match) => match.toUpperCase());

            logs.push(`${normalizeKey} changed from ${previousValue} to ${changedValue}`);
        });

        const hasAmountPaidChanged = form.isDirty('amountPaid');

        if (hasAmountPaidChanged) {
            logs.push(
                `Deposit Amount changed from ${toIndianLocale(member?.totalAgreedDeposit)} to ${toIndianLocale(values.amountPaid)}. Outstanding Amount of ${toIndianLocale(summary.outstanding)} will be ${values.forwardOutstanding ? 'forwarded' : 'not forwarded'}.`
            );
        }
    }

    if (values.note) {
        let adminNote = values.note;
        if (adminNote.startsWith('-')) {
            adminNote = adminNote.replace('-', '').trim();
        }

        logs.push(adminNote);
    }

    // let finalNote = logs.length ? logs.join('\n- ') : '';
    // if (member?.logs) {
    //     finalNote += `\n${member.logs}`;
    // }

    return logs;
};
