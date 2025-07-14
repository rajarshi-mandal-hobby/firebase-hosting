/**
 * Billing Operations - Cloud Functions
 * 
 * This file contains HTTP callable functions for managing
 * billing, rent generation, and payment processing.
 */

import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
  validateAuth,
  createSuccessResponse,
  handleFunctionError,
} from "./utils/validation";
import { 
  ElectricBill, 
  AdminConfig, 
  Member, 
  RentHistory, 
  CloudFunctionResponse,
  PaymentStatus,
  GlobalSettings,
  Expense
} from "./types/shared";

const db = getFirestore();

// Request interfaces for billing operations
interface GenerateBulkBillsRequest {
  billingMonth: string; // YYYY-MM format
  floorElectricity: {
    "2nd": number;
    "3rd": number;
  };
  floorMemberCounts: {
    "2nd": number;
    "3rd": number;
  };
  bulkExpenses?: {
    memberIds: string[];
    amount: number;
    description: string;
  }[];
  wifiCharges?: {
    memberIds: string[];
    amount: number;
  };
}

interface RecordPaymentRequest {
  memberId: string;
  month: string; // YYYY-MM format
  amountPaid: number;
  note?: string;
}

interface GetMemberBillsRequest {
  memberId: string;
  limit?: number;
  startAfter?: string; // For pagination
}

/**
 * Generate bulk bills for all active members (Admin only)
 * Creates rent history entries based on electricity distribution and expenses
 */
export const generateBulkBills = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    generatedCount: number;
    skippedCount: number;
    errors: string[];
  }>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const requestData = request.data as GenerateBulkBillsRequest;

      if (!requestData?.billingMonth || !requestData?.floorElectricity) {
        throw new Error("Billing month and floor electricity data are required");
      }

      // Get all active members
      const membersSnapshot = await db
        .collection("members")
        .where("isActive", "==", true)
        .get();

      const activeMembers = membersSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];

      // Get global settings
      const settingsDoc = await db.collection("config").doc("globalSettings").get();
      if (!settingsDoc.exists) {
        throw new Error("Global settings not found");
      }
      const settings = settingsDoc.data() as GlobalSettings;

      let generatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Process each member
      for (const member of activeMembers) {
        try {
          // Check if bill already exists for this month
          const existingBillDoc = await db
            .collection("members")
            .doc(member.id)
            .collection("rentHistory")
            .doc(requestData.billingMonth)
            .get();

          if (existingBillDoc.exists) {
            skippedCount++;
            continue;
          }

          // Calculate electricity cost for member's floor
          const floorElectricityTotal = requestData.floorElectricity[member.floor];
          const floorMemberCount = requestData.floorMemberCounts[member.floor];
          const electricityCost = floorMemberCount > 0 ? floorElectricityTotal / floorMemberCount : 0;

          // Calculate expenses for this member
          let memberExpenses: Expense[] = [];
          if (requestData.bulkExpenses) {
            memberExpenses = requestData.bulkExpenses
              .filter(expense => expense.memberIds.includes(member.id))
              .map(expense => ({
                amount: expense.amount,
                description: expense.description,
              }));
          }

          // Calculate WiFi cost
          let wifiCost = 0;
          if (requestData.wifiCharges && requestData.wifiCharges.memberIds.includes(member.id)) {
            wifiCost = requestData.wifiCharges.amount;
          } else if (member.optedForWifi) {
            wifiCost = settings.wifiMonthlyCharge;
          }

          // Calculate total charges
          const totalExpenses = memberExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          const totalCharges = member.currentRent + electricityCost + wifiCost + totalExpenses;

          // Create rent history entry
          const rentHistoryData: Omit<RentHistory, "id"> = {
            generatedAt: new Date() as any, // Will be converted to Timestamp by Firestore
            rent: member.currentRent,
            electricity: electricityCost,
            wifi: wifiCost,
            previousOutstanding: member.outstandingBalance,
            expenses: memberExpenses,
            totalCharges,
            amountPaid: 0,
            currentOutstanding: member.outstandingBalance + totalCharges,
            note: member.outstandingNote || "",
            status: "Due" as PaymentStatus,
          };

          // Save to Firestore
          await db
            .collection("members")
            .doc(member.id)
            .collection("rentHistory")
            .doc(requestData.billingMonth)
            .set(rentHistoryData);

          // Update member's outstanding balance
          await db.collection("members").doc(member.id).update({
            outstandingBalance: rentHistoryData.currentOutstanding,
          });

          generatedCount++;
        } catch (error) {
          errors.push(`Error generating bill for ${member.name}: ${error}`);
        }
      }

      // Create/update electric bill record
      try {
        const electricBillData: Omit<ElectricBill, "id"> = {
          billingMonth: new Date(requestData.billingMonth + "-01") as any,
          generatedAt: new Date() as any,
          lastUpdated: new Date() as any,
          floorCosts: {
            "2nd": {
              bill: requestData.floorElectricity["2nd"],
              totalMembers: requestData.floorMemberCounts["2nd"],
            },
            "3rd": {
              bill: requestData.floorElectricity["3rd"],
              totalMembers: requestData.floorMemberCounts["3rd"],
            },
          },
          appliedBulkExpenses: requestData.bulkExpenses?.map(expense => ({
            members: expense.memberIds,
            amount: expense.amount,
            description: expense.description,
          })) || [],
        };

        await db
          .collection("electricBills")
          .doc(requestData.billingMonth)
          .set(electricBillData);
      } catch (error) {
        errors.push(`Error creating electric bill record: ${error}`);
      }

      return createSuccessResponse("Bills generated successfully", {
        generatedCount,
        skippedCount,
        errors,
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        generatedCount: number;
        skippedCount: number;
        errors: string[];
      }>;
    }
  }
);

/**
 * Record payment for a member's bill (Admin only)
 * Updates the rent history and member's outstanding balance
 */
export const recordPayment = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{ 
    success: boolean;
    updatedRent: RentHistory;
  }>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const requestData = request.data as RecordPaymentRequest;

      if (!requestData?.memberId || !requestData?.month || typeof requestData?.amountPaid !== 'number') {
        throw new Error("Member ID, month, and amount paid are required");
      }

      // Get the rent history document
      const rentHistoryRef = db
        .collection("members")
        .doc(requestData.memberId)
        .collection("rentHistory")
        .doc(requestData.month);

      const rentHistoryDoc = await rentHistoryRef.get();
      if (!rentHistoryDoc.exists) {
        throw new Error("Rent history not found for the specified month");
      }

      const rentData = { id: rentHistoryDoc.id, ...rentHistoryDoc.data() } as RentHistory;

      // Calculate new payment details
      const newAmountPaid = Math.max(0, requestData.amountPaid);
      const newCurrentOutstanding = rentData.previousOutstanding + rentData.totalCharges - newAmountPaid;
      
      // Determine payment status
      let newStatus: PaymentStatus;
      if (newAmountPaid === 0) {
        newStatus = "Due";
      } else if (newAmountPaid >= rentData.totalCharges) {
        newStatus = newAmountPaid > rentData.totalCharges ? "Overpaid" : "Paid";
      } else {
        newStatus = "Partially Paid";
      }

      // Update rent history
      const updateData = {
        amountPaid: newAmountPaid,
        currentOutstanding: newCurrentOutstanding,
        status: newStatus,
        ...(requestData.note && { note: requestData.note }),
      };

      await rentHistoryRef.update(updateData);

      // Update member's outstanding balance
      await db.collection("members").doc(requestData.memberId).update({
        outstandingBalance: newCurrentOutstanding,
      });

      const updatedRentData = { ...rentData, ...updateData };

      return createSuccessResponse("Payment recorded successfully", {
        success: true,
        updatedRent: updatedRentData,
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        success: boolean;
        updatedRent: RentHistory;
      }>;
    }
  }
);

/**
 * Get current electric bill (Admin only)
 * Returns the most recent electric bill
 */
export const getCurrentElectricBill = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<ElectricBill | null>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      // Get the most recent electric bill
      const billsSnapshot = await db
        .collection("electricBills")
        .orderBy("billingMonth", "desc")
        .limit(1)
        .get();

      if (billsSnapshot.empty) {
        return createSuccessResponse("No electric bills found", null);
      }

      const billDoc = billsSnapshot.docs[0];
      const billData = { id: billDoc.id, ...billDoc.data() } as ElectricBill;

      return createSuccessResponse("Current electric bill retrieved successfully", billData);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<ElectricBill | null>;
    }
  }
);

/**
 * Get billing summary for admin dashboard (Admin only)
 * Returns billing overview and statistics
 */
export const getBillingSummary = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    currentMonth: {
      totalGenerated: number;
      totalCollected: number;
      totalOutstanding: number;
      paymentRate: number;
    };
    recentPayments: {
      memberId: string;
      memberName: string;
      amount: number;
      month: string;
      paidDate: string;
    }[];
    upcomingDues: {
      memberId: string;
      memberName: string;
      amount: number;
      daysOverdue: number;
    }[];
  }>> => {
    try {
      const uid = validateAuth(request);

      // Check if user is admin
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

      // Get all active members
      const membersSnapshot = await db
        .collection("members")
        .where("isActive", "==", true)
        .get();

      const activeMembers = membersSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];

      // Calculate current month statistics
      let totalGenerated = 0;
      let totalCollected = 0;
      let totalOutstanding = 0;

      const recentPayments: any[] = [];
      const upcomingDues: any[] = [];

      // Process each member's current month data
      for (const member of activeMembers) {
        try {
          const rentHistoryDoc = await db
            .collection("members")
            .doc(member.id)
            .collection("rentHistory")
            .doc(currentMonth)
            .get();

          if (rentHistoryDoc.exists) {
            const rentData = rentHistoryDoc.data() as RentHistory;
            
            totalGenerated += rentData.totalCharges;
            totalCollected += rentData.amountPaid;
            
            const outstanding = rentData.totalCharges - rentData.amountPaid;
            if (outstanding > 0) {
              totalOutstanding += outstanding;
              
              // Calculate days overdue (assuming bills are due on 5th of each month)
              const currentDate = new Date();
              const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 5);
              const daysOverdue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
              
              upcomingDues.push({
                memberId: member.id,
                memberName: member.name,
                amount: outstanding,
                daysOverdue,
              });
            }

            // If payment was made, add to recent payments
            if (rentData.amountPaid > 0) {
              recentPayments.push({
                memberId: member.id,
                memberName: member.name,
                amount: rentData.amountPaid,
                month: currentMonth,
                paidDate: rentData.generatedAt.toDate().toISOString().split('T')[0],
              });
            }
          }
        } catch (error) {
          console.warn(`Could not fetch rent history for member ${member.id}:`, error);
        }
      }

      const paymentRate = totalGenerated > 0 ? (totalCollected / totalGenerated) * 100 : 0;

      // Sort and limit results
      recentPayments.sort((a, b) => new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime());
      upcomingDues.sort((a, b) => b.daysOverdue - a.daysOverdue);

      const summary = {
        currentMonth: {
          totalGenerated,
          totalCollected,
          totalOutstanding,
          paymentRate: Math.round(paymentRate * 100) / 100,
        },
        recentPayments: recentPayments.slice(0, 10),
        upcomingDues: upcomingDues.slice(0, 10),
      };

      return createSuccessResponse("Billing summary retrieved successfully", summary);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<any>;
    }
  }
);
