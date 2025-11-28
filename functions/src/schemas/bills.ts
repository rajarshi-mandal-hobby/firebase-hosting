import { Timestamp } from 'firebase-admin/firestore';
import { Floor } from '../types/shared';
import z from 'zod';

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

// ✅ Fixed type to match schema exactly
export type BillsSchemaType = {
  selectedBillingMonth: string;
  secondFloorElectricityBill: number;
  thirdFloorElectricityBill: number;
  activeMemberCounts: Record<Floor, number>;
  wifiCharges: {
    wifiMonthlyCharge?: number;
    wifiMemberIds?: string[];
  };
  additionalExpenses: {
    addExpenseMemberIds?: string[];
    addExpenseAmount?: number;
    addExpenseDescription?: string;
  };
};

// const billingMonthPattern = /^\d{4}-\d{2}-\d{2}$/;

// ✅ Fixed schema to match BillsSchemaType
const BillsSchema = z
  .object({
    // selectedBillingMonth: zString.refine((s) => billingMonthPattern.test(s), {
    //   message: 'Date must be in YYYY-MM-DD format',
    // }),
    // secondFloorElectricityBill: zThreeToFourDigitsNumber,
    // thirdFloorElectricityBill: zThreeToFourDigitsNumber,
    // activeMemberCounts: z.object({
    //   '2nd': zPositiveNumber,
    //   '3rd': zPositiveNumber,
    // }),
    wifiCharges: z.object({
      wifiMonthlyCharge: z.number().int().optional(),
      wifiMemberIds: z.array(z.string()).optional(),
    }),
    // additionalExpenses: z
    //   .object({
    //     addExpenseMemberIds: z.array(z.string()).optional(),
    //     addExpenseAmount: z.int().optional(),
    //     addExpenseDescription: z.string().optional(),
    //   })
    //   .superRefine((data, ctx) => {
    //     const hasAmount = data.addExpenseAmount !== undefined && data.addExpenseAmount !== 0;
    //     const hasMembers = Array.isArray(data.addExpenseMemberIds) && data.addExpenseMemberIds.length > 0;
    //     const hasDescription = data.addExpenseDescription !== undefined && data.addExpenseDescription.length > 0;
    //     // Check that if any field is provided, all must be provided
    //     const fieldsProvided = [hasAmount, hasMembers, hasDescription].filter(Boolean).length;
    //     if (fieldsProvided > 0 && fieldsProvided < 3) {
    //       if (!hasAmount) {
    //         ctx.addIssue({
    //           code: 'custom',
    //           message: 'Amount is required',
    //           path: ['addExpenseAmount'],
    //         });
    //       }
    //       if (!hasMembers) {
    //         ctx.addIssue({
    //           code: 'too_small',
    //           input: data.addExpenseMemberIds,
    //           minimum: 1,
    //           message: 'Members missing',
    //           inclusive: true,
    //           origin: 'array',
    //           path: ['addExpenseMemberIds'],
    //         });
    //       }
    //       if (!hasDescription) {
    //         ctx.addIssue({
    //           code: 'custom',
    //           message: 'Description is required',
    //           path: ['addExpenseDescription'],
    //         });
    //       }
    //     }
    //     // Check
    //     if (hasAmount) {
    //       const absCharge = Math.abs(data.addExpenseAmount!);

    //       if (absCharge < 10) {
    //         ctx.addIssue({
    //           origin: 'int',
    //           code: 'too_small',
    //           minimum: 10,
    //           type: 'number',
    //           inclusive: true,
    //           message: 'Must be at least 2 digits',
    //           path: ['addExpenseAmount'],
    //         });
    //       } else if (absCharge > 9999) {
    //         ctx.addIssue({
    //           origin: 'int',
    //           code: 'too_big',
    //           maximum: 9999,
    //           type: 'number',
    //           inclusive: true,
    //           message: 'Must be at most 4 digits',
    //           path: ['addExpenseAmount'],
    //         });
    //       }
    //     }

    //     // Check if has at least 2 words
    //     if (hasDescription) {
    //       const wordCount = data.addExpenseDescription!.trim().split(/\s+/).length;
    //       if (wordCount < 2) {
    //         ctx.addIssue({
    //           origin: 'string',
    //           code: 'too_small',
    //           minimum: 2,
    //           message: 'Must contain at least 2 words',
    //           path: ['addExpenseDescription'],
    //         });
    //       }
    //     }
    //   }),
  })
  .superRefine((data, ctx) => {
    const hasCharge = data.wifiCharges.wifiMonthlyCharge !== undefined && data.wifiCharges.wifiMonthlyCharge > 0;
    const hasMembers = Array.isArray(data.wifiCharges.wifiMemberIds) && data.wifiCharges.wifiMemberIds.length > 0;

    // Separate logic: Check conditional requirement (both or neither)
    if ((hasCharge && !hasMembers) || (!hasCharge && hasMembers)) {
      if (hasCharge && !hasMembers) {
        ctx.addIssue({
          code: 'too_small',
          input: data.wifiCharges.wifiMemberIds,
          minimum: 1,
          message: 'Members missing',
          inclusive: true,
          path: ['wifiMemberIds'],
          origin: 'array',
        });
      }

      if (!hasCharge && hasMembers) {
        ctx.addIssue({
          code: 'custom',
          message: 'Missing amount',
          path: ['wifiMonthlyCharge'],
        });
      }
    }

    // SEPARATE: Check bounds independently (moved outside conditional)
    if (hasCharge) {
      if (data.wifiCharges.wifiMonthlyCharge! < 100) {
        ctx.addIssue({
          code: 'too_small',
          minimum: 100,
          type: 'number',
          inclusive: true,
          message: 'Must be at least 100',
          path: ['wifiMonthlyCharge'],
          origin: 'int',
        });
      } else if (data.wifiCharges.wifiMonthlyCharge! > 9999) {
        ctx.addIssue({
          code: 'too_big',
          maximum: 9999,
          type: 'number',
          inclusive: true,
          message: 'Must be at most 9999',
          path: ['wifiMonthlyCharge'],
          origin: 'int',
        });
      }
    }
  });

export const validateBillsInput = (data: any) => BillsSchema.safeParse(data);

const test = validateBillsInput({
  selectedBillingMonth: '2023-09-01',
  secondFloorElectricityBill: 500,
  wifiMonthlyCharge: 100,
  additionalExpenses: {
    addExpenseMemberIds: ['user1', 'user2'],
    addExpenseAmount: 200,
    addExpenseDescription: 'Internet charges',
  },
});

console.log(test);
