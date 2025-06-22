// Configuration and system-wide type definitions

export interface BedTypeRates {
  [bedType: string]: number;
}

export interface FloorBedTypes {
  [floor: string]: BedTypeRates;
}

// Base configuration interface for static values stored in Firestore
export interface BaseConfig {
  floors: string[];
  bedTypes: FloorBedTypes;
  defaultSecurityDeposit: number;
  wifiMonthlyCharge: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveStudentCounts {
  total: number;
  byFloor: Record<string, number>;
  wifiOptedIn: number; // Changed from wifiOpted to match spec
}

export interface ConfigData {
  floors: string[];
  bedTypes: FloorBedTypes;
  defaultSecurityDeposit: number;
  currentBillingMonth: Date | null; // Can be null until first bill generation
  nextBillingMonth: Date | null; // Can be null until first bill generation
  wifiMonthlyCharge: number;
  activeStudentCounts: ActiveStudentCounts;
  createdAt: Date;
  updatedAt: Date;
}

// Separate interface for admin management (separate document)
export interface AdminConfig {
  list: string[]; // Array of Firebase UIDs (not emails)
  createdAt: Date;
  updatedAt: Date;
}

// Electric bills collection structure (new as per spec)
export interface ElectricBills {
  [billingMonth: string]: { // YYYY-MM format
    [floor: string]: number; // e.g., {"2nd": 1000, "3rd": 1200}
  };
}

// Helper types for form validation
export type Floor = '2nd' | '3rd';
export type BedType = 'Bed' | 'Special Room' | 'Room';

// Utility type for billing months
export type BillingMonth = string; // Format: YYYY-MM

export interface SystemStats {
  totalStudents: number;
  activeStudents: number;
  totalOutstanding: number;
  currentBillingCycle: string;
}
