import dayjs from "dayjs";
import { MemberDetailsFormRequestData } from "../member-ops.js";
import { MemberWithCurrentMonthRent } from "../types/index.js";
import { Timestamp } from "firebase-admin/firestore";

export const createMemberObject = (
   data: MemberDetailsFormRequestData,
   id: string,
   moveInDate: Timestamp
): MemberWithCurrentMonthRent => ({
   id,
   name: data.name,
   phone: data.phone,
   floor: data.floor,
   bedType: data.bedType,
   currentRent: data.rentAmount,
   rentAtJoining: data.rentAmount,
   securityDeposit: data.securityDeposit,
   advanceDeposit: data.advanceDeposit,
   optedForWifi: data.isOptedForWifi,
   moveInDate,
   note: data.note,
   totalAgreedDeposit: data.securityDeposit + data.rentAmount + data.advanceDeposit,
   isActive: true,
   currentMonthRent: {
      id: dayjs(moveInDate.toDate()).format("YYYY-MM"), // YYYY-MM
      generatedAt: moveInDate,
      rent: data.rentAmount,
      electricity: 0,
      wifi: 0,
      expenses: [],
      totalCharges: data.securityDeposit + data.rentAmount + data.advanceDeposit,
      amountPaid: data.amountPaid,
      currentOutstanding: data.shouldForwardOutstanding ? data.outstandingAmount : 0,
      status: data.shouldForwardOutstanding ? "Partial" : "Paid"
   }
});

