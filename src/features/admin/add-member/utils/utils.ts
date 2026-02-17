import dayjs from 'dayjs';
import type { Floor, BedType, Member, MemberAction } from '../../../../data/types';
import { formatPhoneNumber, getSafeDate, normalizePhoneInput, toNumber } from '../../../../shared/utils';
import type { MemberDetailsFormProps } from '../components/MemberDetailsForm';
import * as v from 'valibot';
import type { MemberDetailsFormData } from '../hooks/useMemberDetailsForm';

export const validatePositiveInteger = (value: number | string, baseMinAmount: number) => {
    const num = v.pipe(
        v.number('Must be number'),
        v.integer('Must be integer'),
        v.minValue(baseMinAmount, `Must be ${baseMinAmount} or greater`)
    );

    const result = v.safeParse(num, Number(value));
    return result.success ? null : result.issues[0].message;
};

const hasAtLeastTwoWords = (sentence: string): boolean => {
    const words = sentence.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
    return words.some((word) => word.length >= 2); // Check if any word has a length >= 2
};

const hasTwoLetterTwoWord = (sentence: string): boolean => {
    const words = sentence.split(/\s+/).filter(Boolean);
    return words.length >= 2 && words.every((word) => word.length >= 2);
};

export const validateSentence = (value: string) => {
    if (!value) return null;
    const schema = v.pipe(
        v.string('Must be a string'),
        v.trim(),
        v.check(hasAtLeastTwoWords, 'Must contain at least one word with two or more letters.')
    );
    const parsedResult = v.safeParse(schema, value);
    return parsedResult.success ? null : parsedResult.issues[0].message;
};

export const validateName = (value: string) => {
    const schema = v.pipe(
        v.string(),
        v.trim(),
        v.regex(/^[a-zA-Z\s]+$/, 'Must contain only letters and spaces'),
        v.check(hasTwoLetterTwoWord, 'Must contain at two or more letters and words.')
    );
    const parsedResult = v.safeParse(schema, value);
    return parsedResult.success ? null : parsedResult.issues[0].message;
};

export const calculateTotalDeposit = (
    rentAmount: number | string,
    securityDeposit: number | string,
    advanceDeposit: number | string
): number => toNumber(rentAmount) + toNumber(securityDeposit) + toNumber(advanceDeposit);

export const getInitialValues = ({
    defaultRents,
    member,
    memberAction: action
}: MemberDetailsFormProps): MemberDetailsFormData => {
    const currentSettingsRent = member ? defaultRents.bedRents[member.floor as Floor][member.bedType as BedType] : 0;
    if (currentSettingsRent === undefined) {
        throw new Error(`Invalid bed type ${member?.bedType} for floor ${member?.floor}`);
    }
    return member ?
            {
                name: member.name,
                phone: formatPhoneNumber(member.phone),
                floor: member.floor as Floor,
                bedType: member.bedType as BedType,
                rentAmount: currentSettingsRent,
                rentAtJoining: member.rentAtJoining,
                securityDeposit: member.securityDeposit,
                advanceDeposit: member.advanceDeposit,
                isOptedForWifi: member.optedForWifi,
                moveInDate: getSafeDate(member.moveInDate),
                note: member.note!,
                amountPaid: action === 'edit' ? member.totalAgreedDeposit : '',
                shouldForwardOutstanding: false,
                outstandingAmount: 0
            }
        :   {
                name: '',
                phone: '',
                floor: null,
                bedType: null,
                rentAmount: '',
                rentAtJoining: '',
                securityDeposit: defaultRents.securityDeposit,
                advanceDeposit: '',
                isOptedForWifi: false,
                moveInDate: dayjs().format('YYYY-MM'),
                note: '',
                amountPaid: '',
                shouldForwardOutstanding: false,
                outstandingAmount: 0
            };
};

export const validatePhoneNumber = (value: number | string) => {
    if (!value) return 'Phone number is required';
    const formattedPhone = normalizePhoneInput(value);
    if (!/^[0-9]{10}$/.test(formattedPhone.toString())) {
        return 'Phone must be 10 digits';
    }
    return null;
};

// Helper to calculate summary state
export const calculateSummary = (
    values: MemberDetailsFormData,
    member: Member | null,
    memberAction: MemberAction | null
) => {
    const rent = toNumber(values.rentAmount);
    const security = toNumber(values.securityDeposit);
    const advance = toNumber(values.advanceDeposit);
    const paid = toNumber(values.amountPaid);

    const total = calculateTotalDeposit(rent, security, advance);

    // Logic: If editing existing member, outstanding is based on agreed deposit.
    // If new member, it's based on current form totals.
    const outstanding =
        values.amountPaid ?
            member && memberAction === 'edit' ?
                paid - member.totalAgreedDeposit
            :   total - paid
        :   0;

    return {
        rentAmount: rent,
        securityDeposit: security,
        advanceDeposit: advance,
        total,
        outstanding
    };
};
