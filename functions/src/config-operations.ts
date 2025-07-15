/**
 * Configuration Operations - Cloud Functions
 * 
 * This file contains HTTP callable functions for managing
 * global settings and admin configuration.
 */

import { onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import {
  validateAuth,
  createSuccessResponse,
  handleFunctionError,
} from "./utils/validation";
import { GlobalSettings, AdminConfig, Member, RentHistory, CloudFunctionResponse } from "./types/shared";

const db = getFirestore();

/**
 * Get global settings from Firestore
 * Accessible by authenticated admins and members
 */
export const getGlobalSettings = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<GlobalSettings>> => {
    try {
      // Validate authentication
      validateAuth(request);

      // Get global settings document
      const settingsDoc = await db.collection("config").doc("globalSettings").get();

      if (!settingsDoc.exists) {
        throw new Error("Global settings not found");
      }

      const settings = settingsDoc.data() as GlobalSettings;

      return createSuccessResponse("Global settings retrieved successfully", settings);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<GlobalSettings>;
    }
  }
);

/**
 * Update global settings (Admin only)
 * Validates the settings and updates atomically
 */
export const updateGlobalSettings = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<GlobalSettings>> => {
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

      // Validate request data
      if (!request.data || typeof request.data !== "object") {
        throw new Error("Invalid settings data");
      }

      const newSettings = request.data as Partial<GlobalSettings>;

      // Get current settings
      const currentSettingsDoc = await db.collection("config").doc("globalSettings").get();
      const currentSettings = currentSettingsDoc.data() as GlobalSettings;

      // Merge with current settings (preserving system fields)
      const updatedSettings: GlobalSettings = {
        ...currentSettings,
        ...newSettings,
        // Preserve system-managed fields
        activememberCounts: currentSettings.activememberCounts,
        currentBillingMonth: currentSettings.currentBillingMonth,
        nextBillingMonth: currentSettings.nextBillingMonth,
      };

      // Update the document
      await db.collection("config").doc("globalSettings").set(updatedSettings);

      return createSuccessResponse("Global settings updated successfully", updatedSettings);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<GlobalSettings>;
    }
  }
);

/**
 * Get admin configuration (Admin only)
 * Returns the list of admins and configuration
 */
export const getAdminConfig = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<AdminConfig>> => {
    try {
      const uid = validateAuth(request);

      // Get admin config
      const adminDoc = await db.collection("config").doc("admins").get();
      if (!adminDoc.exists) {
        throw new Error("Admin configuration not found");
      }

      const adminConfig = adminDoc.data() as AdminConfig;
      
      // Check if user is admin
      const isAdmin = adminConfig.list.some(admin => admin.uid === uid);
      if (!isAdmin) {
        throw new Error("Unauthorized: Admin access required");
      }

      return createSuccessResponse("Admin configuration retrieved successfully", adminConfig);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<AdminConfig>;
    }
  }
);

/**
 * Get member dashboard data (Member only)
 * Returns member's own data and current month rent history
 */
export const getMemberDashboard = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    member: Omit<Member, 'securityDeposit' | 'totalAgreedDeposit' | 'rentAtJoining' | 'advanceDeposit'>;
    currentMonthRent?: RentHistory;
    upiVpa: string;
  }>> => {
    try {
      const uid = validateAuth(request);

      // Find member by firebase UID
      const membersSnapshot = await db.collection("members")
        .where("firebaseUid", "==", uid)
        .where("isActive", "==", true)
        .get();

      if (membersSnapshot.empty) {
        throw new Error("Member account not found or not active");
      }

      const memberDoc = membersSnapshot.docs[0];
      const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member;

      // Get global settings for UPI phone number
      const settingsDoc = await db.collection("config").doc("globalSettings").get();
      if (!settingsDoc.exists) {
        throw new Error("Global settings not found");
      }
      const settings = settingsDoc.data() as GlobalSettings;

      // Get current month rent history
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      let currentMonthRent: RentHistory | undefined;

      try {
        const rentHistoryDoc = await db
          .collection("members")
          .doc(memberDoc.id)
          .collection("rentHistory")
          .doc(currentMonth)
          .get();

        if (rentHistoryDoc.exists) {
          currentMonthRent = { id: rentHistoryDoc.id, ...rentHistoryDoc.data() } as RentHistory;
        }
      } catch (error) {
        console.warn("Could not fetch current month rent history:", error);
      }

      // Filter member data to exclude admin-only fields
      // eslint-disable-next-line no-unused-vars
      const { securityDeposit: _securityDeposit, totalAgreedDeposit: _totalAgreedDeposit, rentAtJoining: _rentAtJoining, advanceDeposit: _advanceDeposit, ...filteredMemberData } = memberData;

      return createSuccessResponse("Member dashboard data retrieved successfully", {
        member: filteredMemberData,
        currentMonthRent,
        upiVpa: settings.upiVpa,
      });

    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        member: Omit<Member, "securityDeposit" | "rentAtJoining" | "advanceDeposit" | "totalAgreedDeposit">;
        currentMonthRent?: RentHistory;
        upiVpa: string;
      }>;
    }
  }
);

/**
 * Get admin dashboard data (Admin only)
 * Returns overview of members, current billing stats, and system status
 */
export const getAdminDashboard = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    memberStats: {
      total: number;
      active: number;
      inactive: number;
      wifiOptedIn: number;
      byFloor: Record<string, number>;
      recentJoinings: Member[];
    };
    billingStats: {
      currentMonth: string;
      totalOutstanding: number;
      membersWithOutstanding: number;
      averageRent: number;
    };
    systemHealth: {
      lastBillingGenerated?: string;
      membersNeedingAttention: Member[];
    };
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

      // Get all members
      const membersSnapshot = await db.collection("members").get();
      const allMembers = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Member[];

      const activeMembers = allMembers.filter(m => m.isActive);
      const inactiveMembers = allMembers.filter(m => !m.isActive);
      const wifiOptedMembers = activeMembers.filter(m => m.optedForWifi);

      // Calculate floor distribution
      const floorStats: Record<string, number> = {};
      activeMembers.forEach(member => {
        floorStats[member.floor] = (floorStats[member.floor] || 0) + 1;
      });

      // Get recent joinings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentJoinings = activeMembers
        .filter(member => {
          const moveInDate = member.moveInDate.toDate();
          return moveInDate >= thirtyDaysAgo;
        })
        .sort((a, b) => b.moveInDate.toDate().getTime() - a.moveInDate.toDate().getTime())
        .slice(0, 5);

      // Calculate billing stats
      const totalOutstanding = activeMembers.reduce((sum, member) => sum + member.outstandingBalance, 0);
      const membersWithOutstanding = activeMembers.filter(m => m.outstandingBalance > 0).length;
      const averageRent = activeMembers.length > 0 
        ? activeMembers.reduce((sum, member) => sum + member.currentRent, 0) / activeMembers.length 
        : 0;

      // Find members needing attention (high outstanding, long overdue, etc.)
      const membersNeedingAttention = activeMembers
        .filter(member => 
          member.outstandingBalance > member.currentRent * 2 || // More than 2 months outstanding
          (member.outstandingNote && member.outstandingNote.trim() !== "")
        )
        .slice(0, 10);

      // Get current month
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Get global settings for system health
      const settingsDoc = await db.collection("config").doc("globalSettings").get();
      const settings = settingsDoc.exists ? settingsDoc.data() as GlobalSettings : null;

      const dashboardData = {
        memberStats: {
          total: allMembers.length,
          active: activeMembers.length,
          inactive: inactiveMembers.length,
          wifiOptedIn: wifiOptedMembers.length,
          byFloor: floorStats,
          recentJoinings,
        },
        billingStats: {
          currentMonth,
          totalOutstanding,
          membersWithOutstanding,
          averageRent: Math.round(averageRent),
        },
        systemHealth: {
          lastBillingGenerated: settings?.currentBillingMonth?.toDate().toISOString().slice(0, 7),
          membersNeedingAttention,
        },
      };

      return createSuccessResponse("Admin dashboard data retrieved successfully", dashboardData);
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        memberStats: {
          total: number;
          active: number;
          inactive: number;
          wifiOptedIn: number;
          byFloor: Record<string, number>;
          recentJoinings: Member[];
        };
        billingStats: {
          currentMonth: string;
          totalOutstanding: number;
          membersWithOutstanding: number;
          averageRent: number;
        };
        systemHealth: {
          lastBillingGenerated?: string;
          membersNeedingAttention: Member[];
        };
      }>;
    }
  }
);

/**
 * Get comprehensive member data for admin (Admin only)
 * Returns detailed member information including financial data
 */
export const getAdminMemberDetails = onCall(
  { cors: true },
  async (request): Promise<CloudFunctionResponse<{
    member: Member;
    recentRentHistory: RentHistory[];
    totalPaidThisYear: number;
    averageMonthlyPayment: number;
  }>> => {
    try {
      const uid = validateAuth(request);
      const requestData = request.data as { memberId: string };

      if (!requestData?.memberId) {
        throw new Error("Member ID is required");
      }

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

      // Get member details
      const memberDoc = await db.collection("members").doc(requestData.memberId).get();
      if (!memberDoc.exists) {
        throw new Error("Member not found");
      }

      const memberData = { id: memberDoc.id, ...memberDoc.data() } as Member;

      // Get recent rent history (last 6 months)
      const rentHistorySnapshot = await db
        .collection("members")
        .doc(requestData.memberId)
        .collection("rentHistory")
        .orderBy("generatedAt", "desc")
        .limit(6)
        .get();

      const recentRentHistory = rentHistorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as RentHistory[];

      // Calculate year-to-date payments
      const currentYear = new Date().getFullYear();
      const yearStartDate = new Date(currentYear, 0, 1);
      
      const yearPayments = recentRentHistory.filter(rent => 
        rent.generatedAt.toDate() >= yearStartDate
      );

      const totalPaidThisYear = yearPayments.reduce((sum, rent) => sum + rent.amountPaid, 0);
      const averageMonthlyPayment = yearPayments.length > 0 
        ? totalPaidThisYear / yearPayments.length 
        : 0;

      return createSuccessResponse("Member details retrieved successfully", {
        member: memberData,
        recentRentHistory,
        totalPaidThisYear,
        averageMonthlyPayment: Math.round(averageMonthlyPayment),
      });
    } catch (error) {
      return handleFunctionError(error) as CloudFunctionResponse<{
        member: Member;
        recentRentHistory: RentHistory[];
        totalPaidThisYear: number;
        averageMonthlyPayment: number;
      }>;
    }
  }
);
