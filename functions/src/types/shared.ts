/**
 * Shared Types for Firebase Functions
 *
 * This file contains type definitions used by Cloud Functions.
 * These should mirror the types from the frontend for consistency.
 */

import { Timestamp } from 'firebase-admin/firestore';

// Basic types
export type Floor = '2nd' | '3rd';
export type BedType = 'Bed' | 'Room' | 'Special';
export type AdminRole = 'primary' | 'secondary';
export type PaymentStatus = 'Due' | 'Paid' | 'Partial' | 'Overpaid';

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

// Member types
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
  currentMonthRent: RentHistory; // Optional embedded current month rent
  totalAgreedDeposit: number;
  isActive: boolean;
  optedForWifi: boolean;
  leaveDate?: Timestamp;
  ttlExpiry?: Timestamp;
}

export interface Expense {
  amount: number;
  description: string;
}

export const toMember = (snap: any): Member => {
  const data = snap.data();
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
  };
};

export interface RentHistory {
  id: string;
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

// Billing types
export interface ElectricBill {
  id: string;
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

// Response types
export interface CloudFunctionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Request types for functions
export interface GetMembersRequest {
  includeInactive?: boolean;
  floor?: Floor;
  searchTerm?: string;
}

export interface GetMemberRequest {
  memberId: string;
  includeRentHistory?: boolean;
}

export interface GetRentHistoryRequest {
  memberId: string;
  limit?: number;
  startAfter?: string; // For pagination
}

// Error types
export interface FunctionError {
  code: string;
  message: string;
  details?: unknown;
}
