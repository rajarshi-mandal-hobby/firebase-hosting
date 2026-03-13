import dayjs from 'dayjs';
import {
    pipe,
    minValue,
    string,
    check,
    regex,
    object,
    nullish,
    optional,
    custom,
    transform,
    boolean,
    is,
    union
} from 'valibot';
import { type Floor, type BedType, Floors, BedTypes, type Member } from '../../../../../data/types';
import {
    formatPhoneNumber,
    getSafeDate,
    hasTwoLetterTwoWord,
    toNumber
} from '../../../../../shared/utils';
import type { MemberDetailsFormProps } from '../components/MemberForm';
import type { MemberDetailsFormData } from '../hooks/useMemberDetailsForm';
import { FourDigitSchema, IntegerSchema, SentenceSchema } from '../../../../../data/types/valibotShemas';
import type { MemberAction } from '../../../../../shared/hooks';

const NameSchema = pipe(
    string(),
    transform((value) => value.trim().replaceAll(/\s+/g, ' ')),
    regex(/^[a-zA-Z\s]+$/, 'Must contain only letters and spaces'),
    check(hasTwoLetterTwoWord, 'Must contain at two or more letters and words.')
);

const PhoneShema = pipe(
    string(),
    check((value) => {
        const val = value.trim().replaceAll(/\s+/g, '');
        return /^\d{10}$/g.test(val);
    }, 'Phone must be 10 digits')
);

const FloorSchema = nullish(
    pipe(
        string(),
        check((value) => Object.values(Floors).includes(value as Floor), 'Invalid floor'),
        transform((value) => value as Floor)
    ),
    null
);

const BedTypeSchema = nullish(
    pipe(
        string(),
        check((value) => Object.values(BedTypes).includes(value as BedType), 'Invalid bed type'),
        transform((value) => value as BedType)
    ),
    null
);

const MemberActionSchema = pipe(
    string(),
    transform((value) => value as MemberAction)
);

const NoteSchema = pipe(
    string(),
    check((value) => {
        if (value === '') return true;
        return is(SentenceSchema, value);
    }, 'Note must be a sentence')
);

export const MemberFormSchema = (member: Member | null) =>
    pipe(
        object({
            id: optional(
                pipe(
                    string(),
                    check((value) => {
                        if (!member) return true;
                        return value === member.id;
                    }, 'Invalid member id')
                )
            ),
            name: NameSchema,
            phone: PhoneShema,
            floor: pipe(
                FloorSchema,
                custom((value) => value !== null && value !== undefined, 'Floor is required')
            ),
            bedType: pipe(
                BedTypeSchema,
                custom((value) => value !== null && value !== undefined, 'Bed type is required')
            ),
            rentAmount: pipe(IntegerSchema, minValue(1000, 'Must be at least 4 digits')),
            rentAtJoining: optional(
                pipe(
                    union([string(), FourDigitSchema]),
                    check((value) => {
                        if (!member && !value) return true;
                        return is(FourDigitSchema, value);
                    }, 'Rent at joining must be a four digit number')
                )
            ),
            securityDeposit: FourDigitSchema,
            advanceDeposit: IntegerSchema,
            isOptedForWifi: boolean(),
            moveInDate: string(),
            note: NoteSchema,
            amountPaid: FourDigitSchema,
            shouldForwardOutstanding: boolean(),
            outstandingAmount: IntegerSchema,
            memberAction: MemberActionSchema
        })
    );

export const getInitialValues = ({
    defaultRents,
    member,
    memberAction,
    currentDefaultRent
}: MemberDetailsFormProps & { currentDefaultRent: number }): MemberDetailsFormData => {
    return member ?
            {
                id: member.id,
                name: member.name,
                phone: formatPhoneNumber(member.phone),
                floor: member.floor as Floor,
                bedType: member.bedType as BedType,
                rentAmount: currentDefaultRent,
                rentAtJoining: member.rentAtJoining,
                securityDeposit: member.securityDeposit,
                advanceDeposit: member.advanceDeposit,
                isOptedForWifi: member.optedForWifi,
                moveInDate: getSafeDate(member.moveInDate),
                note: member.note || '',
                amountPaid: memberAction === 'edit-member' ? member.totalAgreedDeposit : '',
                shouldForwardOutstanding: false,
                outstandingAmount: 0,
                memberAction
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
                outstandingAmount: 0,
                memberAction
            };
};

export const calculateTotalDeposit = (
    rentAmount: number | string,
    securityDeposit: number | string,
    advanceDeposit: number | string
): number => toNumber(rentAmount) + toNumber(securityDeposit) + toNumber(advanceDeposit);

export const normalizeNameInput = (value: string) => {
    return value
        .trim()
        .replaceAll(/\s+/g, ' ')
        .replaceAll(/[^a-zA-Z\s]/g, '')
        .split(' ')
        .filter((word) => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
