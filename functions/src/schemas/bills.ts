import { Floor, Floors } from "../types/index.js";
import * as v from "valibot";
import { NumberSchema } from "./index.js";

export type BillFormData = {
   selectedBillingMonth: string;
   activeMemberCounts: {
      [F in Floor]: number;
   };
   wifiCharges: {
      wifiMonthlyCharge: number;
      wifiMemberIds: string[];
   };
   additionalExpenses: {
      addExpenseMemberIds: string[];
      addExpenseAmount: number;
      addExpenseDescription: string;
   };
   secondFloorElectricityBill: number;
   thirdFloorElectricityBill: number;
   isUpdatingBills: boolean;
   submittedMembers: {
      memberOptions: { value: string; label: string }[];
      activeMembersIdsByFloor: Record<Floor, string[]>;
   };
};

// Wifi Charges Schema
const WifiChargesSchema = v.pipe(
   v.object({
      wifiMonthlyCharge: v.number("Must be a number"),
      wifiMemberIds: v.array(v.string(), "Must be an array of strings")
   }),
   v.forward(
      v.check((input) => {
         const { hasCharge, hasMembers } = checkWifiMembers(input);
         if (hasCharge && !hasMembers) return false;
         if (!hasCharge && hasMembers) return false;
         return true;
      }, "Both Wifi charge and members are required"),
      ["wifiMemberIds"]
   ),
   v.transform((input) => {
      return {
         wifiMonthlyCharge: input.wifiMonthlyCharge,
         wifiMemberIds: new Set(input.wifiMemberIds)
      };
   })
);

// Additional Expenses Schema
const AdditionalExpensesSchema = v.pipe(
   v.object({
      addExpenseMemberIds: v.array(v.string(), "Must be an array of strings"),
      addExpenseAmount: v.number("Must be a number"),
      addExpenseDescription: v.string("Must be a string")
   }),
   v.forward(
      v.check((input) => {
         const hasMembers = Array.isArray(input.addExpenseMemberIds) && input.addExpenseMemberIds.length > 0;
         const hasAmount = input.addExpenseAmount > 0;
         const hasDescription = input.addExpenseDescription.trim().length > 0;
         if (!hasMembers && hasAmount && hasDescription) return false;
         if (hasMembers && !hasAmount && hasDescription) return false;
         if (hasMembers && hasAmount && !hasDescription) return false;
         return true;
      }, "Members, amount and description for additional expenses are required"),
      ["addExpenseDescription"]
   ),
   v.transform((input) => {
      return {
         addExpenseMemberIds: new Set(input.addExpenseMemberIds),
         addExpenseAmount: input.addExpenseAmount,
         addExpenseDescription: input.addExpenseDescription
      };
   })
);

// Active Member Count Schema
const floorValues = Object.values(Floors);
const ActiveMemberCountSchema = v.record(
   v.picklist(floorValues, `Should be ${floorValues.join(" or ")}`),
   v.pipe(NumberSchema, v.minValue(1, "Min: 1"), v.maxValue(10, "Max: 10"))
);

// Second Floor Electricity Bill Schema
const MinMaxFloorBillsSchema = v.pipe(NumberSchema, v.minValue(100, "Min: 100"), v.maxValue(9999, "Max: 4 digits"));

const SubmitMembersSchema = v.object({
   memberOptions: v.array(v.object({ value: v.string(), label: v.string() })),
   activeMembersIdsByFloor: v.record(v.string(), v.array(v.string()))
});

const SelectedBillingMonthSchema = v.pipe(
   v.string("Must be a string"),
   v.check((s) => {
      // In format YYYY-MM-DD
      const regex = /\d{4}-\d{2}-\d{2}/g;
      return regex.test(s);
   }, "Must be in format YYYY-MM-DD"),
   v.transform((input) => new Date(input)),
   v.date("Must be a date")
);

const BillsSchema = v.object({
   selectedBillingMonth: SelectedBillingMonthSchema,
   wifiCharges: WifiChargesSchema,
   activeMemberCounts: ActiveMemberCountSchema,
   secondFloorElectricityBill: MinMaxFloorBillsSchema,
   thirdFloorElectricityBill: MinMaxFloorBillsSchema,
   additionalExpenses: AdditionalExpensesSchema,
   isUpdatingBills: v.boolean("Must be a boolean"),
   submittedMembers: SubmitMembersSchema
});

export const validateBillsInput = (data: any) => v.safeParse(BillsSchema, data);

function checkWifiMembers(input: { wifiMonthlyCharge: number; wifiMemberIds: string[] }) {
   const hasCharge = input.wifiMonthlyCharge > 0;
   const hasMembers = Array.isArray(input.wifiMemberIds) && input.wifiMemberIds.length > 0;
   return { hasCharge, hasMembers };
}
