import * as v from 'valibot';
import { Floors, BedTypes, Actions } from '../types/index.js';
import { NumberSchema } from './index.js';

const IdSchema = v.nullable(v.string('ID must be a string'));

const NameSchema = v.pipe(
  v.string('Name must be a string'),
  v.transform((val) => {
    return val
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }),
  v.check((name) => {
    const regex = /^[a-zA-Z]{2,}(?: [a-zA-Z]{2,}){0,2}$/u;
    return regex.test(name);
  }, 'Name must contain at least 2 words, no more than 3 words, and each word must be at least 2 letters long.')
);

const PhoneSchema = v.pipe(
  v.string(),
  v.transform((val) => '+91' + val.replace(/\s+/g, '')),
  v.check((phone) => {
    const regex = /^\+91\d{10}$/u;
    return regex.test(phone);
  }, 'Phone must be a valid 10-digit number.')
);

const floorsValues = Object.values(Floors);
const FloorSchema = v.picklist(floorsValues, 'Floor must be either ' + floorsValues.join(', '));

const bedTypesValues = Object.values(BedTypes);
const BedTypeSchema = v.picklist(bedTypesValues, 'Bed type must be either ' + bedTypesValues.join(', '));

const MoveInDateSchema = v.pipe(
  v.string(),
  v.transform((val) => new Date(val)),
  v.date('Move-in date must be a valid date'),
);

const actionsValues = Object.values(Actions);
const ActionSchema = v.picklist(actionsValues, 'Action must be either ' + actionsValues.join(', '));

export const MemberSchema = v.object({
  id: IdSchema,
  name: NameSchema,
  phone: PhoneSchema,
  floor: FloorSchema,
  bedType: BedTypeSchema,
  moveInDate: MoveInDateSchema,
  securityDeposit: NumberSchema,
  outstandingAmount: NumberSchema,
  rentAmount: NumberSchema,
  advanceDeposit: NumberSchema,
  rentAtJoining: v.nullable(NumberSchema),
  amountPaid: NumberSchema,
  isOptedForWifi: v.boolean('Opted for wifi is required'),
  shouldForwardOutstanding: v.boolean('Should forward outstanding is required'),
  note: v.string('Note is required'),
  action: ActionSchema
});

export const validateMemberData = (data: unknown) => v.safeParse(MemberSchema, data);
