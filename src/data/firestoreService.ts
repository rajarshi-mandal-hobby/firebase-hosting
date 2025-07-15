/**
 * Firebase Service Layer - Main Aggregator
 * 
 * This file serves as the main entry point for all data operations.
 * It aggregates all individual service modules and provides a unified API.
 * 
 * Updated to use real Firestore onSnapshot listeners for real-time data.
 */

// Import Firebase Firestore functions
import { 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from '../../firebase';

// Import all service modules
import { ConfigService } from './services/configService';
import { MembersService } from './services/membersService';
import { BillingService } from './services/billingService';

// Import types
import type { 
  GlobalSettings, 
  AdminConfig,
  Admin, 
  Member,
  RentHistory
} from '../shared/types/firestore-types';

// Export the service error class
export { ServiceError } from './utils/serviceUtils';

// Import utilities
import { 
  formatCurrency, 
  formatBillingMonth, 
  getCurrentBillingMonth, 
  getNextBillingMonth 
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
      return Promise.reject(new ServiceError('auth/invalid-token', 'Invalid authentication token'));
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
      throw new ServiceError('business/member-not-found', 'No member found with this phone number');
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
    const membersQuery = query(
      collection(db, 'members'),
      where('isActive', '==', true),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const members: Member[] = [];
        snapshot.forEach((doc) => {
          members.push({ 
            id: doc.id, 
            ...doc.data() 
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
    const membersQuery = query(
      collection(db, 'members'),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(
      membersQuery,
      (snapshot) => {
        const members: Member[] = [];
        snapshot.forEach((doc) => {
          members.push({ 
            id: doc.id, 
            ...doc.data() 
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
            ...doc.data() 
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
}

/**
 * Utility Service
 */
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
  Config: {
    getGlobalSettings: ConfigService.getGlobalSettings.bind(ConfigService),
    updateGlobalSettings: ConfigService.updateGlobalSettings.bind(ConfigService),
    getAdminConfig: ConfigService.getAdminConfig.bind(ConfigService),
    addAdmin: ConfigService.addAdmin.bind(ConfigService),
    removeAdmin: ConfigService.removeAdmin.bind(ConfigService),
    updateAdminRole: ConfigService.updateAdminRole.bind(ConfigService),
  },

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
import { ServiceError } from './utils/serviceUtils';
export { ServiceError as FirestoreServiceError };
