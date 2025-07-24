/**
 * Simplified Service Layer Exports
 *
 * Direct exports of individual service modules without aggregation.
 * This replaces the large FirestoreService aggregator object with simple, tree-shakable exports.
 */

// Individual service classes
export { ConfigService } from '../../data/services/configService';
export { MembersService } from '../../data/services/membersService';
export { BillingService } from '../../data/services/billingService';

// Additional service classes from main service file
export { AuthService, RealtimeService, MemberDashboardService, UtilityService } from '../../data/firestoreService';

// Service utilities and error handling
export { ServiceError } from '../../data/utils/serviceUtils';

// Utility functions for direct import
export {
  formatCurrency,
  formatBillingMonth,
  getCurrentBillingMonth,
  getNextBillingMonth,
  validatePhoneNumber,
  validateEmail,
  validateAmount,
} from '../../data/utils/serviceUtils';
