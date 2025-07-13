/**
 * Firebase Service Layer - Main Aggregator
 * 
 * This file serves as the main entry point for all data operations.
 * It aggregates all individual service modules and provides a unified API.
 * 
 * In production, most operations will call Firebase Functions or direct Firestore operations.
 * This mock implementation simulates those operations with setTimeout for realistic async behavior.
 */

// Import all service modules
import { ConfigService } from './services/configService';
import { MembersService } from './services/membersService';
import { BillingService } from './services/billingService';

// Import types
import type { 
  GlobalSettings, 
  Admin, 
  Member,
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
  static async verifyAuth(idToken: string): Promise<{
    uid: string;
    role: 'admin' | 'member' | 'unlinked';
    userData?: Admin | Member;
  }> {
    // Mock implementation
    if (!idToken || idToken === 'invalid-token') {
      throw new ServiceError('auth/invalid-token', 'Invalid authentication token');
    }

    // For testing, return mock data
    return {
      uid: 'mock-uid',
      role: 'admin',
      userData: {
        email: 'admin@example.com',
        uid: 'mock-uid',
        role: 'primary',
        addedAt: new Date() as unknown as import('firebase/firestore').Timestamp,
        addedBy: 'system',
      },
    };
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
 * Future: Will use Firestore onSnapshot listeners
 */
export class RealtimeService {
  /**
   * Subscribe to global settings changes
   */
  static subscribeToGlobalSettings(callback: (settings: GlobalSettings) => void): () => void {
    // Mock implementation - call immediately and then periodically
    let isActive = true;
    
    const updateCallback = async () => {
      if (!isActive) return;
      try {
        const settings = await ConfigService.getGlobalSettings();
        callback(settings);
      } catch (error) {
        console.error('Error fetching global settings:', error);
      }
    };

    // Initial call
    updateCallback();

    // Periodic updates every 30 seconds
    const interval = setInterval(updateCallback, 30000);

    // Return unsubscribe function
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }

  /**
   * Subscribe to active members changes
   */
  static subscribeToActiveMembers(callback: (members: Member[]) => void): () => void {
    let isActive = true;
    
    const updateCallback = async () => {
      if (!isActive) return;
      try {
        const members = await MembersService.getMembers({ isActive: true });
        callback(members);
      } catch (error) {
        console.error('Error fetching active members:', error);
      }
    };

    updateCallback();
    const interval = setInterval(updateCallback, 15000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
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
    searchMembers: MembersService.searchMembers.bind(MembersService),
    addMember: MembersService.addMember.bind(MembersService),
    updateMember: MembersService.updateMember.bind(MembersService),
    deactivateMember: MembersService.deactivateMember.bind(MembersService),
    deleteMember: MembersService.deleteMember.bind(MembersService),
    getMemberStats: MembersService.getMemberStats.bind(MembersService),
  },

  // Billing operations
  Billing: {
    generateMonthlyBills: BillingService.generateMonthlyBills.bind(BillingService),
    getElectricBillHistory: BillingService.getElectricBillHistory.bind(BillingService),
    getElectricBill: BillingService.getElectricBill.bind(BillingService),
    updateElectricBill: BillingService.updateElectricBill.bind(BillingService),
    deleteBillingMonth: BillingService.deleteBillingMonth.bind(BillingService),
  },

  // Authentication operations
  Auth: {
    verifyAuth: AuthService.verifyAuth.bind(AuthService),
    linkMemberAccount: AuthService.linkMemberAccount.bind(AuthService),
  },

  // Real-time subscriptions
  Realtime: {
    subscribeToGlobalSettings: RealtimeService.subscribeToGlobalSettings.bind(RealtimeService),
    subscribeToActiveMembers: RealtimeService.subscribeToActiveMembers.bind(RealtimeService),
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
