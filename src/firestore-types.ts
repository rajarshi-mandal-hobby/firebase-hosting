import type { Timestamp } from 'firebase/firestore';

// ======================================
// CONSTANTS AND ENUMS
// ======================================

/**
 * Available floors as defined in the schema
 */
export const FLOORS = ['2nd', '3rd'] as const;
export type Floor = typeof FLOORS[number];

/**
 * Available bed types per floor
 */
export const BED_TYPES = {
  '2nd': ['Bed', 'Room', 'Special Room'],
  '3rd': ['Bed', 'Room']
} as const;

export type BedTypeFor2nd = typeof BED_TYPES['2nd'][number];
export type BedTypeFor3rd = typeof BED_TYPES['3rd'][number];
export type BedType = BedTypeFor2nd | BedTypeFor3rd;

/**
 * Admin roles as defined in schema
 */
export type AdminRole = 'primary' | 'secondary';

/**
 * Collection names for type safety
 */
export const COLLECTIONS = {
  CONFIG: 'config',
  MEMBERS: 'members',
  ELECTRIC_BILLS: 'electricBills'
} as const;

/**
 * Config document IDs
 */
export const CONFIG_DOCS = {
  GLOBAL_SETTINGS: 'globalSettings',
  ADMINS: 'admins'
} as const;

// ======================================
// UTILITY TYPES
// ======================================

/**
 * Makes a type nullable and optional for mock data scenarios
 */
type NullableOptional<T> = T | null | undefined;

/**
 * Makes specific keys of a type nullable while keeping them optional
 */
type MakeNullable<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: NullableOptional<T[P]>;
};

// ======================================
// CONFIGURATION TYPES
// ======================================

/**
 * Global application settings stored in Firestore
 * Collection: config / Document: globalSettings
 */
export interface GlobalSettings {
  floors: Floor[];
  bedTypes: {
    [K in Floor]: {
      [bedType: string]: number;
    };
  };
  securityDeposit: number;
  wifiMonthlyCharge: number;
  upiPhoneNumber: string;
  activememberCounts: {
    total: number;
    byFloor: {
      [K in Floor]: number;
    };
    wifiOptedIn: number;
  };
  currentBillingMonth?: Timestamp;
  nextBillingMonth?: Timestamp;
}

/**
 * Admin user configuration
 * Collection: config / Document: admins
 */
export interface Admin {
  email: string;
  uid: string;
  role: AdminRole;
  addedAt: Timestamp;
  addedBy: string;
}

export interface AdminConfig {
  list: Admin[];
  primaryAdminUid: string;
  maxAdmins: number;
}

// ======================================
// MEMBER AND RENT TYPES
// ======================================

/**
 * Base member interface for Firestore documents
 * Collection: members
 */
export interface Member {
  id: string; // Firestore document ID
  name: string;
  phone: string;
  firebaseUid?: string;
  fcmToken?: string;
  floor: Floor;
  bedType: BedType;
  moveInDate: Timestamp;
  securityDeposit: number;
  rentAtJoining: number;
  advanceDeposit: number;
  currentRent: number;
  totalAgreedDeposit: number;
  outstandingBalance: number;
  outstandingNote?: string;
  isActive: boolean;
  optedForWifi: boolean;
  leaveDate?: Timestamp;
  ttlExpiry?: Timestamp;
}

/**
 * Expense item for rent calculations
 */
export interface Expense {
  amount: number;
  description: string;
}

/**
 * Payment status for rent history
 */
export type PaymentStatus = 'Due' | 'Paid' | 'Partially Paid' | 'Overpaid';

/**
 * General status type that extends payment status for broader use
 * Includes member activity statuses in addition to payment statuses
 */
export type GeneralStatus = PaymentStatus | 'active' | 'inactive';

/**
 * Rent history record for a specific month
 * Subcollection: members/{memberId}/rentHistory
 */
export interface RentHistory {
  id: string; // YYYY-MM
  generatedAt: Timestamp;
  rent: number;
  electricity: number;
  wifi: number;
  previousOutstanding: number;
  expenses: Expense[];
  totalCharges: number;
  amountPaid: number;
  currentOutstanding: number;
  note?: string;
  status: PaymentStatus;
}

// ======================================
// MOCK DATA AND EXTENDED TYPES
// ======================================

/**
 * Extended member type for mock data with nullable optional fields and embedded rent history.
 * This type is used in mock data where some fields may be null/undefined and rent history
 * is embedded directly in the member object instead of being a separate subcollection.
 */
export interface MockMemberData extends MakeNullable<Member, 'firebaseUid' | 'fcmToken' | 'outstandingNote' | 'leaveDate' | 'ttlExpiry'> {
  rentHistory?: RentHistory[] | null;
}

/**
 * Utility type for member with embedded rent history.
 * Useful for API responses that include both member data and their complete rent history.
 */
export interface MemberWithRentHistory extends Member {
  rentHistory: RentHistory[];
}

// ======================================
// BILLING TYPES
// ======================================

/**
 * Electric bill for a specific month
 * Collection: electricBills
 */
export interface ElectricBill {
  id: string; // YYYY-MM
  billingMonth: Timestamp;
  generatedAt: Timestamp;
  lastUpdated: Timestamp;
  floorCosts: {
    [K in Floor]: {
      bill: number;
      totalMembers: number;
    };
  };
  appliedBulkExpenses: {
    members: string[];
    amount: number;
    description: string;
  }[];
}

// ======================================
// UPI AND PAYMENT TYPES
// ======================================

/**
 * UPI payment parameters as defined in schema section 7.2.4
 */
export interface UPIPaymentParams {
  pa: string; // UPI ID (e.g., "+918777529394@paytm")
  pn: string; // Payee name (e.g., "Rent Payment")
  am: number; // Amount
  cu: string; // Currency (e.g., "INR")
  tn: string; // Transaction note
}

/**
 * UPI payment URI generator parameters
 */
export interface UPIPaymentData {
  memberName: string;
  amount: number;
  billingMonth: string; // YYYY-MM format
  upiPhoneNumber: string;
}

// ======================================
// NOTIFICATION AND FCM TYPES
// ======================================

/**
 * FCM notification payload structure
 */
export interface FCMNotification {
  title: string;
  body: string;
  data?: {
    type: 'bill_generated' | 'payment_recorded' | 'general';
    memberId?: string;
    amount?: string;
    [key: string]: string | undefined;
  };
}

/**
 * FCM token update request
 */
export interface FCMTokenUpdate {
  memberId: string;
  fcmToken: string;
  lastUpdated: Timestamp;
}

// ======================================
// CLOUD FUNCTION TYPES
// ======================================

/**
 * Standard cloud function response structure
 */
export interface CloudFunctionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * Member dashboard data response (section 8.1)
 */
export interface MemberDashboardData {
  member: Omit<Member, 'securityDeposit' | 'totalAgreedDeposit' | 'rentAtJoining' | 'advanceDeposit'>;
  currentMonthRent?: RentHistory;
  upiPhoneNumber: string;
}

/**
 * Settlement preview for member deactivation (section 6.5)
 */
export interface SettlementPreview {
  memberName: string;
  totalAgreedDeposit: number;
  outstandingBalance: number;
  refundAmount: number; // Can be negative if member owes money
  status: 'Refund Due' | 'Payment Due' | 'Settled';
  leaveDate: string; // ISO date string
}

// ======================================
// FORM AND VALIDATION TYPES
// ======================================

/**
 * Member form data for adding new members
 */
export interface AddMemberFormData {
  name: string;
  phone: string;
  floor: Floor;
  bedType: BedType;
  moveInDate: Date;
  securityDeposit: number;
  rentAtJoining: number;
  advanceDeposit: number;
  fullPayment: boolean;
  actualAmountPaid?: number;
}

/**
 * Member form data for editing existing members
 */
export interface EditMemberFormData {
  floor: Floor;
  bedType: BedType;
  currentRent: number;
}

/**
 * Phone verification for account linking
 */
export interface PhoneVerificationData {
  phoneNumber: string;
  idToken: string;
}

/**
 * Account linking response
 */
export interface AccountLinkResponse {
  success: boolean;
  memberId?: string;
  memberName?: string;
  message: string;
}

// ======================================
// RUNTIME VALIDATION HELPERS
// ======================================

/**
 * Runtime validation for floor values
 */
export const validateFloor = (floor: string): floor is Floor => 
  FLOORS.includes(floor as Floor);

/**
 * Runtime validation for bed type values based on floor
 */
export const validateBedType = (floor: Floor, bedType: string): bedType is BedType => {
  const validTypes = BED_TYPES[floor] as readonly string[];
  return validTypes.includes(bedType);
};

/**
 * Get available bed types for a specific floor
 */
export const getBedTypesForFloor = (floor: Floor): readonly string[] =>
  BED_TYPES[floor];

/**
 * Validate phone number format (+91 followed by 10 digits)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+91[0-9]{10}$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number to standard format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 91, add +
  if (digits.startsWith('91') && digits.length === 12) {
    return `+${digits}`;
  }
  
  // If it's 10 digits, add +91
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  
  return phone; // Return as-is if format is unclear
};

// ======================================
// FIRESTORE QUERY HELPERS
// ======================================

/**
 * Get collection path with type safety
 */
export const getCollectionPath = (collection: keyof typeof COLLECTIONS): string => 
  COLLECTIONS[collection];

/**
 * Get config document path with type safety
 */
export const getConfigDocPath = (docId: keyof typeof CONFIG_DOCS): string =>
  `${COLLECTIONS.CONFIG}/${CONFIG_DOCS[docId]}`;

/**
 * Generate member rent history collection path
 */
export const getMemberRentHistoryPath = (memberId: string): string =>
  `${COLLECTIONS.MEMBERS}/${memberId}/rentHistory`;

/**
 * Generate electric bill document path
 */
export const getElectricBillPath = (billingMonth: string): string =>
  `${COLLECTIONS.ELECTRIC_BILLS}/${billingMonth}`;

/**
 * Validate and format billing month (YYYY-MM)
 */
export const validateBillingMonth = (month: string): boolean => {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(month)) return false;
  
  const [year, monthNum] = month.split('-').map(Number);
  return year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12;
};

/**
 * Generate billing month string from Date
 */
export const formatBillingMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Parse billing month string to Date (first day of month)
 */
export const parseBillingMonth = (month: string): Date => {
  const [year, monthNum] = month.split('-').map(Number);
  return new Date(year, monthNum - 1, 1);
};

// ======================================
// ERROR HANDLING TYPES
// ======================================

/**
 * Base error interface for application errors
 */
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp?: Date;
}

/**
 * Firestore-specific error types
 */
export interface FirestoreError extends AppError {
  code: 
    | 'firestore/permission-denied'
    | 'firestore/not-found'
    | 'firestore/already-exists'
    | 'firestore/failed-precondition'
    | 'firestore/aborted'
    | 'firestore/out-of-range'
    | 'firestore/unimplemented'
    | 'firestore/internal'
    | 'firestore/unavailable'
    | 'firestore/data-loss'
    | 'firestore/unauthenticated'
    | 'firestore/deadline-exceeded'
    | 'firestore/resource-exhausted'
    | 'firestore/cancelled'
    | 'firestore/invalid-argument'
    | 'firestore/unknown';
  firestoreCode?: string;
}

/**
 * Authentication-specific error types
 */
export interface AuthError extends AppError {
  code:
    | 'auth/invalid-token'
    | 'auth/token-expired'
    | 'auth/user-not-found'
    | 'auth/account-not-linked'
    | 'auth/phone-mismatch'
    | 'auth/invalid-phone'
    | 'auth/permission-denied'
    | 'auth/admin-only'
    | 'auth/member-only';
}

/**
 * Validation error types
 */
export interface ValidationError extends AppError {
  code:
    | 'validation/required-field'
    | 'validation/invalid-format'
    | 'validation/out-of-range'
    | 'validation/duplicate-value'
    | 'validation/invalid-floor'
    | 'validation/invalid-bed-type'
    | 'validation/invalid-phone'
    | 'validation/invalid-amount';
  field?: string;
}

/**
 * Business logic error types
 */
export interface BusinessError extends AppError {
  code:
    | 'business/member-not-active'
    | 'business/billing-already-generated'
    | 'business/insufficient-balance'
    | 'business/invalid-payment-amount'
    | 'business/settlement-required'
    | 'business/max-admins-reached'
    | 'business/primary-admin-removal'
    | 'business/duplicate-member';
}

/**
 * Union type for all application errors
 */
export type ApplicationError = FirestoreError | AuthError | ValidationError | BusinessError;

/**
 * Error result wrapper for operations that can fail
 */
export type Result<T, E = ApplicationError> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Helper to create error objects
 */
export const createError = <T extends ApplicationError>(
  type: T['code'],
  message: string,
  details?: unknown
): T => ({
  code: type,
  message,
  details,
  timestamp: new Date(),
} as T);
