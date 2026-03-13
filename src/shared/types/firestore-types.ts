import type { Timestamp } from 'firebase/firestore';
import type { Member } from '../../data/types';

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
