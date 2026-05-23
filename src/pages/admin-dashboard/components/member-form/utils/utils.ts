import dayjs from 'dayjs';
import * as v from 'valibot';
import { type Floor, type BedType, Floors, BedTypes, type Member } from '../../../../../data/types';
import {
    formatPhoneNumber,
    getSafeDate,
    hasAtLeastTwoWords,
    hasTwoLetterTwoWord,
    normalizePhoneInput,
    toNumber
} from '../../../../../shared/utils';
import type { MemberDetailsFormProps } from '../components/MemberForm';
import type { MemberDetailsFormData } from '../hooks/useMemberDetailsForm';
import { FourDigitSchema, IntegerSchema, SentenceSchema } from '../../../../../data/types/valibotShemas';
import type { MemberAction } from '../../../../../shared/hooks';

const NameSchema = (member: Member | null, members: Member[], memberAction: MemberAction) =>
    v.pipe(
        v.string(),
        v.transform((value) => value.trim().replaceAll(/\s+/g, ' ')),
        v.regex(
            /^[a-zA-Z ]+(?:\s\d+)?$/,
            'Must contain only letters and spaces, followed by a number if needed to differentiate names'
        ),
        v.check(hasAtLeastTwoWords, 'Must contain at least two letters and words'),
        v.check((value) => {
            const normalizedValue = normalizeNameInput(value);

            return !members.some((m) => {
                const isSameName = normalizeNameInput(m.name) === normalizedValue;
                const isOtherMember = m.id !== member?.id;

                return memberAction === 'add-member' ? isSameName : isSameName && isOtherMember;
            });
        }, 'Name already exists. Use a number at the end to differentiate, e.g. John Doe 1')
    );

const PhoneShema = (member: Member | null, members: Member[], memberAction: MemberAction) =>
    v.pipe(
        v.string(),
        v.check((value) => {
            const val = value.trim().replaceAll(/\s+/g, '');
            return /^\d{10}$/g.test(val);
        }, 'Phone must be 10 digits'),
        v.check((value) => {
            const normalizedValue = normalizePhoneInput(value);

            return !members.some((m) => {
                const isSamePhone = normalizePhoneInput(m.phone) === normalizedValue;
                const isOtherMember = m.id !== member?.id;

                return memberAction === 'add-member' ? isSamePhone : isSamePhone && isOtherMember;
            });
        }, 'Phone already exists')
    );

const FloorSchema = v.nullish(
    v.pipe(
        v.string(),
        v.check((value) => Object.values(Floors).includes(value as Floor), 'Invalid floor'),
        v.transform((value) => value as Floor)
    ),
    null
);

const BedTypeSchema = v.nullish(
    v.pipe(
        v.string(),
        v.check((value) => Object.values(BedTypes).includes(value as BedType), 'Invalid bed type'),
        v.transform((value) => value as BedType)
    ),
    null
);

const MemberActionSchema = v.pipe(
    v.string(),
    v.transform((value) => value as MemberAction)
);

const NoteSchema = v.pipe(
    v.string(),
    v.check((value) => {
        if (value === '') return true;
        return v.is(SentenceSchema, value);
    }, 'Note must be a sentence')
);

export const MemberFormSchema = (member: Member | null, members: Member[], memberAction: MemberAction) =>
    v.pipe(
        v.object({
            id: v.optional(
                v.pipe(
                    v.string(),
                    v.check((value) => {
                        if (!member) return true;
                        return value === member.id;
                    }, 'Invalid member id')
                )
            ),
            name: NameSchema(member, members, memberAction),
            phone: PhoneShema(member, members, memberAction),
            floor: v.pipe(
                FloorSchema,
                v.custom((value) => value !== null && value !== undefined, 'Floor is required')
            ),
            bedType: v.pipe(
                BedTypeSchema,
                v.custom((value) => value !== null && value !== undefined, 'Bed type is required')
            ),
            rentAmount: v.pipe(IntegerSchema, v.minValue(1000, 'Must be at least 4 digits')),
            rentAtJoining: IntegerSchema,
            hasDateChanged: v.boolean(),
            securityDeposit: FourDigitSchema,
            advanceDeposit: IntegerSchema,
            isOptedForWifi: v.boolean(),
            moveInDate: v.string(),
            note: NoteSchema,
            amountPaid: FourDigitSchema,
            shouldForwardOutstanding: v.boolean(),
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
    const currentDate = dayjs(getSafeDate(defaultRents.currentBillingMonth)).format('YYYY-MM-DD');
    return member ?
            {
                id: member.id,
                moveInDate:
                    memberAction === 'edit-member' ?
                        dayjs(getSafeDate(member.moveInDate)).format('YYYY-MM-DD')
                    :   currentDate,
                isPreviousMonth: dayjs(getSafeDate(member.moveInDate)).isSame(currentDate, 'month'),
                name: member.name,
                phone: formatPhoneNumber(member.phone),
                floor: member.floor as Floor,
                bedType: member.bedType as BedType,
                rentAmount: currentDefaultRent,
                rentAtJoining: member.rentAtJoining,
                securityDeposit: member.securityDeposit,
                advanceDeposit: member.advanceDeposit,
                isOptedForWifi: member.optedForWifi,
                note: member.note || '',
                amountPaid: memberAction === 'edit-member' ? member.totalAgreedDeposit : '',
                shouldForwardOutstanding: false,
                outstandingAmount: 0,
                memberAction
            }
        :   {
                moveInDate: currentDate,
                isPreviousMonth: false,
                name: '',
                phone: '',
                floor: null,
                bedType: null,
                rentAmount: '',
                rentAtJoining: 0,
                securityDeposit: defaultRents.securityDeposit,
                advanceDeposit: '',
                isOptedForWifi: false,
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
        .replaceAll(/[^a-zA-Z0-9\s]/g, '')
        .split(' ')
        .filter((word) => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
