/**
 * Firebase Service Layer - Main Aggregator
 *
 * This file serves as the main entry point for all data operations.
 * It aggregates all individual service modules and provides a unified API.
 *
 * Updated to use real Firestore onSnapshot listeners for real-time data.
 */

// Import Firebase Firestore functions
import { doc, collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';

// Import all service modules

import { MembersService } from './services/membersService';
import { BillingService } from './services/billingService';

// Import types
import type { GlobalSettingsType as GlobalSettings, AdminConfig, Admin, Member, RentHistory } from '../shared/types/firestore-types';

// Export the service error class
export { ServiceErrorDepricated as ServiceError } from './utils/serviceUtils';

// Import utilities
import {
  formatCurrency,
  formatBillingMonth,
  getCurrentBillingMonth,
  getNextBillingMonth,
  validatePhoneNumber,
} from './utils/serviceUtils';

/**
 * Simple Auth Service (placeholder)
 * Future: Will integrate with Firebase Auth
 */
export class AuthService {
  /**
   * Verify user authentication token
   * Future: Will call Firebase Function for token verification
   */
  static verifyAuth(idToken: string): Promise<{
    uid: string;
    role: 'admin' | 'member' | 'unlinked';
    userData?: Admin | Member;
  }> {
    // Mock implementation
    if (!idToken || idToken === 'invalid-token') {
      return Promise.reject(new ServiceErrorDepricated('auth/invalid-token', 'Invalid authentication token'));
    }

    // For testing, return mock data
    return Promise.resolve({
      uid: 'mock-uid',
      role: 'admin',
      userData: {
        email: 'admin@example.com',
        uid: 'mock-uid',
        role: 'primary',
        addedAt: new Date() as unknown as import('firebase/firestore').Timestamp,
        addedBy: 'system',
      },
    });
  }

  /**
   * Link member account to Google account
   * Future: Will call Firebase Function for account linking
   */
  static async linkMemberAccount(_idToken: string, phoneNumber: string): Promise<Member> {
    // Mock implementation
    const member = await MembersService.searchMembers(phoneNumber, true);
    if (member.length === 0) {
      throw new ServiceErrorDepricated('business/member-not-found', 'No member found with this phone number');
    }

    return member[0];
  }
}

/**
 * Simple Realtime Service (placeholder)
/**
 * Real-time Service using Firestore onSnapshot
 */
export class RealtimeService {
  /**
   * Subscribe to global settings changes using onSnapshot
   */

  static subscribeToGlobalSettings(callback: (settings: GlobalSettings) => void): () => void {
    const globalSettingsRef = doc(db, 'config', 'globalSettings');

    const unsubscribe = onSnapshot(
      globalSettingsRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as GlobalSettings;
          callback(data);
        } else {
          console.warn('Global settings document does not exist');
        }
      },
      (error) => {
        console.error('Error listening to global settings:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to admin config changes using onSnapshot
   */

  static subscribeToAdminConfig(callback: (adminConfig: AdminConfig) => void): () => void {
    const adminConfigRef = doc(db, 'config', 'adminConfig');

    const unsubscribe = onSnapshot(
      adminConfigRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as AdminConfig;
          callback(data);
        } else {
          console.warn('Admin config document does not exist');
        }
      },
      (error) => {
        console.error('Error listening to admin config:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to active members changes using onSnapshot
   */

  static subscribeToActiveMembers(callback: (members: Member[]) => void): () => void {
    const membersQuery = query(collection(db, 'members'), where('isActive', '==', true), orderBy('name'));

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const members: Member[] = [];
        snapshot.forEach((doc) => {
          members.push({
            id: doc.id,
            ...doc.data(),
          } as Member);
        });
        callback(members);
      },
      (error) => {
        console.error('Error listening to active members:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to all members changes using onSnapshot
   */

  static subscribeToAllMembers(callback: (members: Member[]) => void): () => void {
    const membersQuery = query(collection(db, 'members'), orderBy('name'));

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const members: Member[] = [];
        snapshot.forEach((doc) => {
          members.push({
            id: doc.id,
            ...doc.data(),
          } as Member);
        });
        callback(members);
      },
      (error) => {
        console.error('Error listening to all members:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to a single member's rent history using onSnapshot
   */
  static subscribeToMemberRentHistory(
    memberId: string,

    callback: (rentHistory: RentHistory[]) => void
  ): () => void {
    const rentHistoryQuery = query(
      collection(db, 'members', memberId, 'rentHistory'),
      orderBy('generatedAt', 'desc'),
      limit(12) // Last 12 months
    );

    const unsubscribe = onSnapshot(
      rentHistoryQuery,
      (snapshot) => {
        const rentHistory: RentHistory[] = [];
        snapshot.forEach((doc) => {
          rentHistory.push({
            id: doc.id,
            ...doc.data(),
          } as RentHistory);
        });
        callback(rentHistory);
      },
      (error) => {
        console.error('Error listening to member rent history:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to a specific member's data using onSnapshot
   * Used for member dashboard real-time updates
   */
  static subscribeToMember(memberId: string, callback: (member: Member | null) => void): () => void {
    const memberRef = doc(db, 'members', memberId);

    const unsubscribe = onSnapshot(
      memberRef,
      (doc) => {
        if (doc.exists()) {
          const member = { id: doc.id, ...doc.data() } as Member;
          callback(member);
        } else {
          console.warn(`Member document ${memberId} does not exist`);
          callback(null);
        }
      },
      (error) => {
        console.error('Error listening to member data:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to other active members (excluding current member)
   * Used for member dashboard friends directory
   */
  static subscribeToOtherActiveMembers(
    excludeMemberId: string,
    callback: (
      members: Array<{
        id: string;
        name: string;
        phone: string;
        floor: string;
        bedType: string;
      }>
    ) => void
  ): () => void {
    const membersQuery = query(collection(db, 'members'), where('isActive', '==', true), orderBy('name'));

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const members: Array<{
          id: string;
          name: string;
          phone: string;
          floor: string;
          bedType: string;
        }> = [];

        snapshot.forEach((doc) => {
          // Exclude the current member from the friends list
          if (doc.id !== excludeMemberId) {
            const memberData = doc.data() as Member;
            members.push({
              id: doc.id,
              name: memberData.name,
              phone: memberData.phone,
              floor: memberData.floor,
              bedType: memberData.bedType,
            });
          }
        });

        callback(members);
      },
      (error) => {
        console.error('Error listening to other active members:', error);
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to member dashboard data (member + current month)
   * Combines member data with current month rent history
   */
  static subscribeMemberDashboardData(
    firebaseUid: string,
    callback: (data: { member: Member | null; currentMonth: RentHistory | null; error?: string }) => void
  ): () => void {
    let historyUnsubscribe: (() => void) | null = null;
    let currentMemberId: string | null = null;

    // First, find the member by Firebase UID
    const membersQuery = query(
      collection(db, 'members'),
      where('firebaseUid', '==', firebaseUid),
      where('isActive', '==', true),
      limit(1)
    );

    const mainUnsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        if (snapshot.empty) {
          callback({
            member: null,
            currentMonth: null,
            error: 'No active member found for this account',
          });
          return;
        }

        const memberDoc = snapshot.docs[0];
        const member = { id: memberDoc.id, ...memberDoc.data() } as Member;
        const memberId = memberDoc.id;

        // If member changed, unsubscribe from previous history listener
        if (currentMemberId !== memberId) {
          if (historyUnsubscribe) {
            historyUnsubscribe();
          }
          currentMemberId = memberId;

          // Subscribe to current month rent history
          const rentHistoryQuery = query(
            collection(db, 'members', memberId, 'rentHistory'),
            orderBy('generatedAt', 'desc'),
            limit(1)
          );

          historyUnsubscribe = onSnapshot(
            rentHistoryQuery,
            (historySnapshot) => {
              const currentMonth = historySnapshot.empty
                ? null
                : ({ id: historySnapshot.docs[0].id, ...historySnapshot.docs[0].data() } as RentHistory);

              callback({
                member,
                currentMonth,
              });
            },
            (error) => {
              console.error('Error listening to member rent history:', error);
              callback({
                member,
                currentMonth: null,
                error: 'Failed to load current month data',
              });
            }
          );
        } else {
          // Member didn't change, just update member data
          // Current month will be updated by the history listener
        }
      },
      (error) => {
        console.error('Error listening to member dashboard data:', error);
        callback({
          member: null,
          currentMonth: null,
          error: 'Failed to load member data',
        });
      }
    );

    // Return cleanup function
    return () => {
      mainUnsubscribe();
      if (historyUnsubscribe) {
        historyUnsubscribe();
      }
    };
  }

  /**
   * Subscribe to member by Firebase UID
   * Used for member dashboard profile section
   */
  static subscribeToMemberByFirebaseUid(
    firebaseUid: string,
    callback: (member: Member | null, error?: string) => void
  ): () => void {
    const membersQuery = query(
      collection(db, 'members'),
      where('firebaseUid', '==', firebaseUid),
      where('isActive', '==', true),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        if (snapshot.empty) {
          callback(null, 'No active member found for this account');
          return;
        }

        const memberDoc = snapshot.docs[0];
        const member = { id: memberDoc.id, ...memberDoc.data() } as Member;
        callback(member);
      },
      (error) => {
        console.error('Error listening to member by Firebase UID:', error);
        callback(null, 'Failed to load member data');
      }
    );

    return unsubscribe;
  }

  /**
   * Subscribe to member's current month rent history
   * Used for member dashboard current rent section
   */
  static subscribeToMemberCurrentMonth(
    memberId: string,
    callback: (currentMonth: RentHistory | null, error?: string) => void
  ): () => void {
    const rentHistoryQuery = query(
      collection(db, 'members', memberId, 'rentHistory'),
      orderBy('generatedAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      rentHistoryQuery,
      (snapshot) => {
        const currentMonth = snapshot.empty
          ? null
          : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as RentHistory);

        callback(currentMonth);
      },
      (error) => {
        console.error('Error listening to member current month:', error);
        callback(null, 'Failed to load current month data');
      }
    );

    return unsubscribe;
  }
}

/**
 * Member Dashboard Service
 * Provides member-specific operations with enhanced error handling and retry mechanisms
 */
export class MemberDashboardService {
  /**
   * Get member dashboard data with retry mechanism
   * Attempts to fetch data multiple times with exponential backoff
   */
  static async getMemberDashboardDataWithRetry(
    firebaseUid: string,
    maxRetries = 3
  ): Promise<{
    member: Member;
    currentMonth: RentHistory | null;
    otherMembers: Array<{
      id: string;
      name: string;
      phone: string;
      floor: string;
      bedType: string;
    }>;
  }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get member dashboard data
        const dashboardData = await MembersService.getMemberDashboardData(firebaseUid);

        // Get other active members for friends directory
        const otherMembers = await MembersService.getOtherActiveMembers(dashboardData.member.id);

        return {
          member: dashboardData.member,
          currentMonth: dashboardData.currentMonth,
          otherMembers,
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed:`, error);

        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Wait with exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we reach here, all retries failed
    throw (
      lastError || new ServiceErrorDepricated('service/retry-failed', 'Failed to fetch data after multiple attempts')
    );
  }

  /**
   * Get member rent history with pagination support
   * Enhanced version with better error handling
   */
  static async getMemberRentHistoryWithPagination(
    memberId: string,
    limit = 12
  ): Promise<{
    rentHistory: RentHistory[];
    hasMore: boolean;
  }> {
    try {
      const rentHistory = await MembersService.getMemberRentHistory(memberId, limit + 1);

      return {
        rentHistory: rentHistory.slice(0, limit),
        hasMore: rentHistory.length > limit,
      };
    } catch (error) {
      console.error('Error fetching member rent history with pagination:', error);
      throw new ServiceErrorDepricated('firestore/read-error', 'Failed to fetch rent history');
    }
  }

  /**
   * Update member profile with validation
   * Enhanced version with better validation and error handling
   */
  static async updateMemberProfile(
    memberId: string,
    updates: {
      fcmToken?: string;
      phone?: string;
    }
  ): Promise<Member> {
    try {
      // Validate updates
      if (updates.phone && !validatePhoneNumber(updates.phone)) {
        throw new ServiceErrorDepricated('validation/invalid-phone', 'Invalid phone number format');
      }

      // Update member
      return await MembersService.updateMember(memberId, updates);
    } catch (error) {
      if (error instanceof ServiceErrorDepricated) {
        throw error;
      }
      console.error('Error updating member profile:', error);
      throw new ServiceErrorDepricated('firestore/write-error', 'Failed to update member profile');
    }
  }

  /**
   * Check member authentication status
   * Validates if the member is properly authenticated and active
   */
  static async validateMemberAuth(firebaseUid: string): Promise<{
    isValid: boolean;
    member?: Member;
    error?: string;
  }> {
    try {
      const member = await MembersService.getMemberByFirebaseUid(firebaseUid);

      if (!member) {
        return {
          isValid: false,
          error: 'No active member found for this account',
        };
      }

      if (!member.isActive) {
        return {
          isValid: false,
          error: 'Member account is inactive',
        };
      }

      return {
        isValid: true,
        member,
      };
    } catch (error) {
      console.error('Error validating member auth:', error);
      return {
        isValid: false,
        error: 'Failed to validate member authentication',
      };
    }
  }
}
export class UtilityService {
  /**
   * Format currency amount
   */
  static formatCurrency = formatCurrency;

  /**
   * Format billing month display
   */
  static formatBillingMonth = formatBillingMonth;

  /**
   * Get current billing month string
   */
  static getCurrentBillingMonth = getCurrentBillingMonth;

  /**
   * Get next billing month string
   */
  static getNextBillingMonth = getNextBillingMonth;

  /**
   * Calculate member statistics
   */
  static async calculateMemberStats() {
    return await MembersService.getMemberStats();
  }
}

/**
 * Main Service Aggregator
 *
 * This object provides a clean, organized API for all data operations.
 * Import this in components instead of individual services.
 */
export const FirestoreService = {
  // Configuration operations
//   Config: {
//     getGlobalSettings: ConfigService.getGlobalSettings.bind(ConfigService),
//     updateGlobalSettings: ConfigService.saveGlobalSettings.bind(ConfigService),
//     getAdminConfig: ConfigService.getAdminConfig.bind(ConfigService),
//     addAdmin: ConfigService.addAdmin.bind(ConfigService),
//     removeAdmin: ConfigService.removeAdmin.bind(ConfigService),
//     updateAdminRole: ConfigService.updateAdminRole.bind(ConfigService),
//   },

  // Member operations
  Members: {
    getMembers: MembersService.getMembers.bind(MembersService),
    getMember: MembersService.getMember.bind(MembersService),
    getMemberRentHistory: MembersService.getMemberRentHistory.bind(MembersService),
    searchMembers: MembersService.searchMembers.bind(MembersService),
    addMember: MembersService.addMember.bind(MembersService),
    updateMember: MembersService.updateMember.bind(MembersService),
    deactivateMember: MembersService.deactivateMember.bind(MembersService),
    deleteMember: MembersService.deleteMember.bind(MembersService),
    getMemberStats: MembersService.getMemberStats.bind(MembersService),

    // Member Dashboard specific methods
    getMemberByFirebaseUid: MembersService.getMemberByFirebaseUid.bind(MembersService),
    getMemberCurrentMonth: MembersService.getMemberCurrentMonth.bind(MembersService),
    getOtherActiveMembers: MembersService.getOtherActiveMembers.bind(MembersService),
    updateMemberFCMToken: MembersService.updateMemberFCMToken.bind(MembersService),
    linkMemberToFirebaseUid: MembersService.linkMemberToFirebaseUid.bind(MembersService),
    getMemberDashboardData: MembersService.getMemberDashboardData.bind(MembersService),
  },

  // Member Dashboard operations (enhanced with retry and error handling)
  MemberDashboard: {
    getMemberDashboardDataWithRetry:
      MemberDashboardService.getMemberDashboardDataWithRetry.bind(MemberDashboardService),
    getMemberRentHistoryWithPagination:
      MemberDashboardService.getMemberRentHistoryWithPagination.bind(MemberDashboardService),
    updateMemberProfile: MemberDashboardService.updateMemberProfile.bind(MemberDashboardService),
    validateMemberAuth: MemberDashboardService.validateMemberAuth.bind(MemberDashboardService),
  },

  // Billing operations
  Billing: {
    generateBulkBills: BillingService.generateBulkBills.bind(BillingService),
    recordPayment: BillingService.recordPayment.bind(BillingService),
    getCurrentElectricBill: BillingService.getCurrentElectricBill.bind(BillingService),
    getBillingSummary: BillingService.getBillingSummary.bind(BillingService),
    generateMonthlyBills: BillingService.generateMonthlyBills.bind(BillingService),
    getElectricBillHistory: BillingService.getElectricBillHistory.bind(BillingService),
    getElectricBill: BillingService.getElectricBill.bind(BillingService),
  },

  // Authentication operations
  Auth: {
    verifyAuth: AuthService.verifyAuth.bind(AuthService),
    linkMemberAccount: AuthService.linkMemberAccount.bind(AuthService),
  },

  // Real-time subscriptions
  Realtime: {
    subscribeToGlobalSettings: RealtimeService.subscribeToGlobalSettings.bind(RealtimeService),
    subscribeToAdminConfig: RealtimeService.subscribeToAdminConfig.bind(RealtimeService),
    subscribeToActiveMembers: RealtimeService.subscribeToActiveMembers.bind(RealtimeService),
    subscribeToAllMembers: RealtimeService.subscribeToAllMembers.bind(RealtimeService),
    subscribeToMemberRentHistory: RealtimeService.subscribeToMemberRentHistory.bind(RealtimeService),
    subscribeToMember: RealtimeService.subscribeToMember.bind(RealtimeService),
    subscribeToOtherActiveMembers: RealtimeService.subscribeToOtherActiveMembers.bind(RealtimeService),
    subscribeMemberDashboardData: RealtimeService.subscribeMemberDashboardData.bind(RealtimeService),
    subscribeToMemberByFirebaseUid: RealtimeService.subscribeToMemberByFirebaseUid.bind(RealtimeService),
    subscribeToMemberCurrentMonth: RealtimeService.subscribeToMemberCurrentMonth.bind(RealtimeService),
  },

  // Utility functions
  Utility: {
    formatCurrency: UtilityService.formatCurrency,
    formatBillingMonth: UtilityService.formatBillingMonth,
    getCurrentBillingMonth: UtilityService.getCurrentBillingMonth,
    getNextBillingMonth: UtilityService.getNextBillingMonth,
    calculateMemberStats: UtilityService.calculateMemberStats.bind(UtilityService),
  },
};

// Default export for convenience
export default FirestoreService;

// Re-export service error for external use
import { ServiceErrorDepricated } from './utils/serviceUtils';
export { ServiceErrorDepricated as FirestoreServiceError };
