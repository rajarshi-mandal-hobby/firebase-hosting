// Member and rent history type definitions
// Renamed from student.ts for better clarity

export interface Expense {
  description: string;
  amount: number;
}

export interface RentHistory {
  id: string; // Document ID: YYYY-MM (e.g., "2025-06")
  generatedAt: Date; // Timestamp - When this record was created
  rent: number;
  electricity: number;
  wifi: number;
  previousOutstanding: number; // Fetched from member.outstandingBalance before this bill's charges were added
  expenses: Expense[]; // Array of Maps - Holds all expenses for the month, including any initial unpaid deposit portion
  newCharges: number; // Calculated: rent + electricity + wifi + sum(expenses for this month)
  amountPaid: number; // Total amount paid against this specific bill
  currentOutstanding: number; // Calculated: previousOutstanding + newCharges - amountPaid
  status: "Due" | "Paid" | "Partially Paid" | "Overpaid";
  // Optional fields for backward compatibility and additional info
  billingMonth?: string; // YYYY-MM format for convenience
  totalDue?: number; // Alias for newCharges
  notes?: string;
  lastPaymentRecordedDate?: Date;
  createdAt?: Date; // For backward compatibility
  updatedAt?: Date; // For backward compatibility
}

export interface Member {
  id?: string; // Document ID from Firestore (auto-generated)
  name: string;
  phone: string; // e.g., +918777529394
  firebaseUid?: string; // Links to Firebase Auth after member login (nullable)
  floor: string; // e.g., '2nd'
  bedType: string; // e.g., 'Bed'
  moveInDate: Date; // Timestamp - The date the member moved in
  securityDeposit: number; // The refundable deposit amount
  rentAtJoining: number; // The first month's rent amount
  advanceDeposit: number; // Also, the first month's rent amount
  currentRent: number; // The member's current monthly rent, needed for updating
  totalAgreedDeposit: number; // rentAtJoining + advanceDeposit + securityDeposit (FIXED NAME)
  outstandingBalance: number; // Single Source of Truth for debt/credit. Positive = owes money, negative = in credit (FIXED NAME)
  isActive: boolean; // true for current members
  optedForWifi: boolean;
  leaveDate?: Date; // nullable, date member vacates (Timestamp)
  ttlExpiry?: Date; // nullable, set when isActive becomes false to trigger automatic deletion via TTL policy
  // Additional computed properties for UI convenience
  electricityAmount?: number;
  wifiAmount?: number;
  status?: "active" | "inactive"; // Computed property for convenience
}

// Form interfaces for adding/editing members
export interface AddMemberFormData {
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  moveInDate: Date;
  securityDeposit: number;
  advanceDeposit: number;
  rentAtJoining: number;
  fullPayment: boolean;
  actualAmountPaid?: number; // Only if fullPayment is false
}

export interface EditMemberFormData {
  floor: string;
  bedType: string;
  currentRent: number;
}

// Utility types for member operations
export interface MemberSummary {
  id: string;
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  currentRent: number;
  outstandingBalance: number; // FIXED NAME
  isActive: boolean;
  optedForWifi: boolean;
  lastPaymentDate?: Date;
}

export interface MemberStats {
  totalDeposit: number;
  totalPaid: number;
  outstandingBalance: number;
  monthlyRent: number;
  joinDate: Date;
  status: "Active" | "Inactive";
}

// Settlement preview for member deactivation
export interface SettlementPreview {
  memberName: string;
  totalAgreedDeposit: number; // FIXED NAME
  outstandingBalance: number; // FIXED NAME
  refundAmount: number;
  status: string;
  leaveDate: string;
}
