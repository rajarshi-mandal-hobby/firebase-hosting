import { type Floor } from "../../../../data/types";
import { computePerHeadBill } from "../utils";
import type { BillFormData } from "./useBillsForm";

export type BillsConfirmModalFormData = BillFormData & {
   submittedMembers: {
      floorIdNameMap: Record<Floor, Record<string, string>>;
   };
};

export const useBillsConfirmModal = (formData: BillsConfirmModalFormData | null, opened: boolean) => {
   // ✅ Early return if no formData or no members submitted
   if (!formData || !opened) {
      return {
         expenseMembers: { "2nd": [], "3rd": [] },
         additionalExpensesPerHead: 0,
         wifiMembers: [],
         wifiChargesPerHead: 0
      };
   }

   const memberLookup = formData.submittedMembers.floorIdNameMap;

   const expenseMemberIds = formData.additionalExpenses.addExpenseMemberIds;
   const expenseMembers = expenseMemberIds.reduce<Record<Floor, string[]>>(
      (acc, memberId) => {
         const memberSecond = memberLookup["2nd"][memberId];
         const memberThird = memberLookup["3rd"][memberId];
         if (memberSecond) {
            acc["2nd"].push(memberSecond);
         }
         if (memberThird) {
            acc["3rd"].push(memberThird);
         }
         return acc;
      },
      { "2nd": [], "3rd": [] }
   );

   const wifiChargesPerHead = computePerHeadBill(
      formData.wifiCharges.wifiMonthlyCharge,
      formData.wifiCharges.wifiMemberIds.length
   );

   const wifiMembers = formData.wifiCharges.wifiMemberIds
      .flatMap((memberId) => memberLookup["2nd"][memberId] ?? memberLookup["3rd"][memberId])
      .filter(Boolean);

   const additionalExpensesPerHead = computePerHeadBill(
      formData.additionalExpenses.addExpenseAmount,
      formData.additionalExpenses.addExpenseMemberIds.length
   );

   return { expenseMembers, additionalExpensesPerHead, wifiMembers, wifiChargesPerHead };
};
