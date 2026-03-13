import type { Timestamp } from 'firebase/firestore';
import type { AdminConfig } from '../shemas/AdminConfig';
import type { FlatErrors } from 'valibot';

export * from './constants';

/**
 * Payment status for rent history
 */
export type PaymentStatus = 'Due' | 'Paid' | 'Partial' | 'Overpaid';

/**
 * General status type that extends payment status for broader use
 * Includes member activity statuses in addition to payment statuses
 */
export type GeneralStatus = PaymentStatus | 'active' | 'inactive';

export interface ConfigCollection {
    globalSettings: DefaultRents | null;
    admins: AdminConfig | null;
}

export const Floors = {
    second: '2nd',
    third: '3rd'
} as const;
export type Floor = (typeof Floors)[keyof typeof Floors];

export const BedTypes = {
    bed: 'Bed',
    room: 'Room',
    special: 'Special'
} as const;
export type BedType = (typeof BedTypes)[keyof typeof BedTypes];

/**
 * Bed Rents
 */
export type BedRents = {
    [F in Floor]: F extends '2nd' ? Record<BedType, number> : Record<Exclude<BedType, 'Special'>, number>;
};

/**
 * Default Values
 */
export interface DefaultRents {
    // replaced invalid syntax with the explicit BedTypes mapping
    bedRents: BedRents;
    securityDeposit: number;
    wifiMonthlyCharge: number;
    upiVpa: string;
    currentBillingMonth: Timestamp;
    nextBillingMonth: Timestamp;
}

export interface Member {
    id: string; // Firestore document ID
    name: string;
    phone: string;
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
    note: string;
    leaveDate?: Timestamp;
    ttlExpiry?: Timestamp;
    firebaseUid?: string;
    fcmToken?: string;
}

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
    status: PaymentStatus;
    note?: string;
}

export interface Expense {
    amount: number;
    description: string;
}

/**
 * Electric Bill for a specific month
 * Collection: electric-bills
 * Document: YYYY-MM
 */
export interface ElectricBill {
    id: string;
    floorCosts: {
        [K in Floor]: {
            bill: number;
            members: string[];
        };
    };
    expenses: {
        members: string[];
        amount: number;
        description: string;
    };
    wifi: {
        members: string[];
        amount: number;
    };
    floorIdNameMap: Record<Floor, Record<string, string>>;
}

type ValidationError = FlatErrors<any>;

export type SaveResult =
    | {
          success: true;
      }
    | {
          success: false;
          errors: ValidationError;
      };
