import type { Timestamp } from 'firebase/firestore';
import type { Floor, BedType, Member, RentHistory } from '../../data/types';

// ======================================
// CONSTANTS AND ENUMS
// ======================================

/**
 * Admin roles as defined in schema
 */
export type AdminRole = 'primary' | 'secondary';

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
// export interface Member {
//   id: string; // Firestore document ID
//   name: string;
//   phone: string;
//   firebaseUid?: string;
//   fcmToken?: string;
//   floor: Floor;
//   bedType: BedType;
//   moveInDate: Timestamp;
//   securityDeposit: number;
//   rentAtJoining: number;
//   advanceDeposit: number;
//   currentRent: number;
//   currentMonthRent: RentHistory; // Optional embedded current month rent
//   totalAgreedDeposit: number;
//   isActive: boolean;
//   optedForWifi: boolean;
//   leaveDate?: Timestamp;
//   ttlExpiry?: Timestamp;
//   note: string;
// }

/**
 * Expense item for rent calculations
 */
export interface Expense {
  amount: number;
  description: string;
}

export const toMember = (data: any): Member => {
  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    firebaseUid: data.firebaseUid,
    fcmToken: data.fcmToken,
    floor: data.floor,
    bedType: data.bedType,
    moveInDate: data.moveInDate,
    securityDeposit: data.securityDeposit,
    rentAtJoining: data.rentAtJoining,
    advanceDeposit: data.advanceDeposit,
    currentRent: data.currentRent,
    currentMonthRent: data.currentMonthRent,
    totalAgreedDeposit: data.totalAgreedDeposit,
    isActive: data.isActive,
    optedForWifi: data.optedForWifi,
    leaveDate: data.leaveDate,
    ttlExpiry: data.ttlExpiry,
    note: data.note
  };
};

/**
 * Payment status for rent history
 */
export type PaymentStatus = 'Due' | 'Paid' | 'Partial' | 'Overpaid';

/**
 * General status type that extends payment status for broader use
 * Includes member activity statuses in addition to payment statuses
 */
export type GeneralStatus = PaymentStatus | 'active' | 'inactive';

/**
 * Utility type for member with embedded rent history.
 * Useful for API responses that include both member data and their complete rent history.
 */
export interface MemberWithRentHistory extends Member {
  rentHistory: RentHistory[];
}

// ======================================
// UPI AND PAYMENT TYPES
// ======================================

/**
 * UPI payment parameters as defined in schema section 7.2.4
 */
export interface UPIPaymentParams {
  pa: string; // UPI ID
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
// export interface ValidationError extends AppError {
//   code:
//     | 'validation/required-field'
//     | 'validation/invalid-format'
//     | 'validation/out-of-range'
//     | 'validation/duplicate-value'
//     | 'validation/invalid-floor'
//     | 'validation/invalid-bed-type'
//     | 'validation/invalid-phone'
//     | 'validation/invalid-amount';
//   field?: string;
// }

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
export type ApplicationError = FirestoreError | AuthError | BusinessError;

/**
 * Error result wrapper for operations that can fail
 */
export type Result<T, E = ApplicationError> = { success: true; data: T } | { success: false; error: E };

/**
 * Helper to create error objects
 */
export const createError = <T extends ApplicationError>(type: T['code'], message: string, details?: unknown): T =>
  ({
    code: type,
    message,
    details,
    timestamp: new Date()
  }) as T;
