// Student and rent history type definitions

export interface Expense {
  description: string;
  amount: number;
}

export interface RentHistory {
  id: string; // Document ID: YYYY-MM
  billingMonth: string; // YYYY-MM
  rent: number;
  electricity: number;
  wifi: number;
  previousOutstanding: number;
  expenses: Expense[];
  totalDue: number;
  amountPaid: number;
  currentOutstanding: number;
  status: 'Due' | 'Paid' | 'Partially Paid' | 'Overpaid';
  notes?: string;
  lastPaymentRecordedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id?: string; // Document ID from Firestore
  name: string;
  phone: string;
  firebaseUid?: string; // Links to Firebase Auth after student login
  floor: string;
  bedType: string;
  moveInDate: Date;
  securityDeposit: number;
  advanceDeposit: number;
  rentAtJoining: number;
  currentRent: number;
  totalDepositAgreed: number;
  currentOutstandingBalance: number;
  isActive: boolean;
  optedForWifi: boolean;
  leaveDate?: Date;
  // Additional properties for billing calculations
  electricityAmount?: number;
  wifiAmount?: number;
  status?: 'active' | 'inactive'; // Computed property for convenience
}

// Form interfaces for adding/editing students
export interface AddStudentFormData {
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

export interface EditStudentFormData {
  floor: string;
  bedType: string;
  currentRent: number;
}

// Utility types for student operations
export interface StudentSummary {
  id: string;
  name: string;
  phone: string;
  floor: string;
  bedType: string;
  currentRent: number;
  currentOutstandingBalance: number;
  isActive: boolean;
  optedForWifi: boolean;
  lastPaymentDate?: Date;
}

export interface StudentStats {
  totalDeposit: number;
  totalPaid: number;
  outstandingBalance: number;
  monthlyRent: number;
  joinDate: Date;
  status: 'Active' | 'Inactive';
}
