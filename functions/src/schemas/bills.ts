import { Timestamp } from 'firebase-admin/firestore';
import { Floor } from '../types/shared';
import z from 'zod';
import { zThreeToFourDigitsNumber, zPositiveNumber, zString } from './primitives';

export interface ElectricBill {
  id: string; // YYYY-MM
  generatedAt: Timestamp;
  floorCosts: {
    [K in Floor]: {
      bill: number;
      totalMembers: number;
    };
  };
  expenses: {
    members: string[];
    amount: number;
    description: string;
  };
  wifiCharges: {
    members: string[];
    amount: number;
  };
}

export interface RentHistory {
  id: string; // YYYY-MM
  generatedAt: Timestamp;
  rent: number;
  electricity: number;
  wifi: number;
  previousOutstanding: number;
  expenses: Expense[];
  totalCharges: number;
  amountPaid: number;
  currentOutstanding: number;
  outstandingNote?: string;
  status: PaymentStatus;
}

export interface Expense {
  amount: number;
  description: string;
}

export type PaymentStatus = 'Due' | 'Paid' | 'Partial' | 'Overpaid';

export type BillsSchemaType = {
  currentBillingMonth?: string;
  nextBillingMonth?: string;
  secondFloorElectricityBill: number;
  thirdFloorElectricityBill: number;
  memberCountByFloor: {
    [F in Floor]: number;
  };
  wifiCharges?: {
    wifiMonthlyCharge: number;
    wifiMemberIds: string[];
  };
  additionalExpenses?: {
    addExpenseMemberIds: string[];
    addExpenseAmount: number;
    addExpenseDescription: string;
  };
};

const billingMonthPattern = /^\d{4}-\d{2}$/;

const BillsSchemas = z.strictObject({
  currentBillingMonth: zString
    .refine((s) => billingMonthPattern.test(s), { message: 'currentBillingMonth must be in YYYY-MM format' })
    .optional(),
  nextBillingMonth: zString
    .refine((s) => billingMonthPattern.test(s), { message: 'nextBillingMonth must be in YYYY-MM format' })
    .optional(),
  secondFloorElectricityBill: zThreeToFourDigitsNumber,
  thirdFloorElectricityBill: zThreeToFourDigitsNumber,
  memberCountByFloor: z.object({
    '2nd': zPositiveNumber,
    '3rd': zPositiveNumber,
  }),
  wifiCharges: z
    .object({
      wifiMonthlyCharge: zThreeToFourDigitsNumber,
      wifiMemberIds: z.array(zString).length(1, 'Must have at least one member'),
    })
    .optional(),
  additionalExpenses: z
    .object({
      addExpenseMemberIds: z.array(zString).length(1, 'Must have at least one member'),
      addExpenseAmount: zPositiveNumber,
      addExpenseDescription: zString,
    })
    .optional(),
});

export const validateBillsInput = (data: any) => BillsSchemas.safeParse(data);
