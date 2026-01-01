import { HttpsError, onCall } from "firebase-functions/https";
import {
   Action,
   BedType,
   Floor,
   Member,
   MEMBERS_COL,
   MemberWithCurrentMonthRent,
   RentHistory,
   SaveResponse
} from "./types/index.js";
import { validateAuth, validateMemberId, validateRequiredFields } from "./utils/validation.js";
import { db } from "./index.js";
import { validateMemberData } from "./schemas/member.js";
import * as v from "valibot";
import { createMemberObject } from "./utils/member-utils.js";
import { Timestamp } from "firebase-admin/firestore";
import { isWithinOneMonthDiff } from "./utils/date-utils.js";
import { logger } from "firebase-functions";

export type MemberDetailsFormRequestData = {
   id: string | null;
   name: string;
   phone: string;
   floor: Floor;
   bedType: BedType;
   rentAmount: number;
   rentAtJoining: number | null;
   securityDeposit: number;
   advanceDeposit: number;
   isOptedForWifi: boolean;
   moveInDate: Date;
   note: string;
   amountPaid: number;
   shouldForwardOutstanding: boolean;
   outstandingAmount: number;
   action: Action;
};

export const memberOperations = onCall({ cors: true }, async (request): Promise<SaveResponse> => {
   try {
      validateAuth(request);

      const action = request.data.action;
      logger.info("Received data", request.data);
      const validationResult = validateMemberData({ ...request.data });

      if (!validationResult.success) {
         return {
            success: false,
            errors: v.flatten(validationResult.issues)
         };
      }

      switch (action) {
         case "add":
            return await addMember(validationResult.output);
         case "update":
            return updateMember(validationResult.output);
         case "reactivate":
            return reactivateMember(validationResult.output);
         default:
            throw new HttpsError("invalid-argument", "Invalid action");
      }
   } catch (error) {
      logger.error(error);
      throw error;
   }
});

async function addMember(data: MemberDetailsFormRequestData): Promise<SaveResponse> {
   return db.runTransaction(async (transaction) => {
      const memberColRef = db.collection(MEMBERS_COL);
      // Check if member name and phone is already exists
      const existingMember = await transaction.get(
         memberColRef.where("name", "==", data.name).where("phone", "==", data.phone)
      );
      if (!existingMember.empty) {
         return {
            success: false,
            errors: {
               nested: {
                  name: ["Member with same name already exists"],
                  phone: ["Member with same phone already exists"]
               }
            }
         };
      }
      // Check if member phone is already exists
      const existingPhone = await transaction.get(memberColRef.where("phone", "==", data.phone));
      if (!existingPhone.empty) {
         return {
            success: false,
            errors: {
               nested: {
                  phone: [`${existingPhone.docs[0].data().name} has same phone number`]
               }
            }
         };
      }
      // Check if member name is already exists
      const existingName = await transaction.get(memberColRef.where("name", "==", data.name));
      if (!existingName.empty) {
         return {
            success: false,
            errors: {
               nested: {
                  name: ["Member with same name already exists"]
               }
            }
         };
      }

      const memberDocRef = memberColRef.doc();
      // Generated member id
      const id = memberDocRef.id;
      // Get move in date
      const moveInDate = Timestamp.fromDate(new Date(data.moveInDate));
      // Create member object
      const memberData: MemberWithCurrentMonthRent = createMemberObject(data, id, moveInDate);
      // Set member data
      transaction.set(memberDocRef, memberData);

      return {
         success: true
      };
   });
}

function updateMember(data: MemberDetailsFormRequestData): Promise<SaveResponse> {
   const { id: dataId, moveInDate: dataMoveInDate, ...rest } = data;

   if (!dataId || !validateMemberId(dataId)) {
      throw new Error("Invalid member ID");
   }

   return db.runTransaction(async (transaction) => {
      const memberDocRef = db.collection(MEMBERS_COL).doc(dataId);
      const memberDoc = await transaction.get(memberDocRef);
      if (!memberDoc.exists) {
         throw new Error("Member not found");
      }

      const member = memberDoc.data() as MemberWithCurrentMonthRent;

      if (!isWithinOneMonthDiff(member.moveInDate.toDate(), new Date(dataMoveInDate))) {
         return {
            success: false,
            errors: {
               nested: {
                  moveInDate: ["Move in date should be within one month of current month"]
               }
            }
         };
      }

      let newOutstandingAmount = member.currentMonthRent.currentOutstanding;
      let newTotalCharges = member.currentMonthRent.totalCharges;
      let newStatus = member.currentMonthRent.status;

      if (rest.shouldForwardOutstanding) {
         newOutstandingAmount += rest.outstandingAmount;
         newTotalCharges += newOutstandingAmount;
         if (member.currentMonthRent.status !== "Due") {
            newStatus =
               member.currentMonthRent.amountPaid < newTotalCharges
                  ? "Partial"
                  : member.currentMonthRent.amountPaid > newTotalCharges
                    ? "Overpaid"
                    : "Paid";
         } else {
            newStatus = "Due";
         }
      }

      const moveInDate = Timestamp.fromDate(new Date(dataMoveInDate));
      const newCurrentMonthRent: Partial<RentHistory> = {
         id: moveInDate.toDate().toYearMonth(), // YYYY-MM
         generatedAt: moveInDate,
         rent: rest.rentAmount,
         electricity: 0,
         wifi: 0,
         expenses: [],
         totalCharges: newTotalCharges,
         amountPaid: rest.amountPaid,
         currentOutstanding: newOutstandingAmount,
         status: newStatus
      };
      const memberData: Partial<Member> = {
         name: rest.name,
         phone: rest.phone,
         floor: rest.floor,
         bedType: rest.bedType,
         currentRent: rest.rentAmount,
         securityDeposit: rest.securityDeposit,
         advanceDeposit: rest.advanceDeposit,
         optedForWifi: rest.isOptedForWifi,
         moveInDate,
         note: rest.note,
         totalAgreedDeposit: rest.securityDeposit + rest.rentAmount + rest.advanceDeposit,
         isActive: member.isActive,
         rentAtJoining: member.rentAtJoining
      };

      transaction.update(memberDocRef, { ...memberData, currentMonthRent: newCurrentMonthRent });
      return {
         success: true
      };
   });
}

function reactivateMember(data: MemberDetailsFormRequestData): SaveResponse {
   throw new Error("Not implemented");
}

export const deactivateMember = onCall({ cors: true }, async (request): Promise<SaveResponse> => {
   validateAuth(request);

   const requestData = validateRequiredFields(request.data, ["memberId", "leaveDate"]) as {
      memberId: string;
      leaveDate: string; // ISO date string
   };

   if (!validateMemberId(requestData.memberId)) {
      throw new Error("Invalid member ID");
   }

   return db.runTransaction(async (transaction) => {
      // Get member document
      const memberDoc = db.collection(MEMBERS_COL).doc(requestData.memberId);

      if (memberDoc.id !== requestData.memberId) {
         throw new Error("Member not found");
      }

      // Set TTL expiry to 6 months from deactivation date
      const leaveDate = new Date(requestData.leaveDate);
      const ttlExpiry = new Date(leaveDate);
      ttlExpiry.setMonth(ttlExpiry.getMonth() + 6);

      transaction.update(memberDoc, {
         isActive: false,
         leaveDate: leaveDate,
         ttlExpiry: ttlExpiry
      });

      return {
         success: true
      };
   });
});
