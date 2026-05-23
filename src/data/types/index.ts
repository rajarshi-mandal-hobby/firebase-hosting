import type { Timestamp } from 'firebase/firestore';
import type { FlatErrors } from 'valibot';
import type { ReactNode } from 'react';
import type { BED_LABEL, FLOOR_LABEL, MEMBER_STATUS_LABEL, MEMBER_STATUS, FLOOR, BED } from './constants';

export * from './constants';

export type MemberStatus = keyof typeof MEMBER_STATUS;

export type MemberStatusLabel = (typeof MEMBER_STATUS_LABEL)[MemberStatus];

export type PaymentStatus = 'Due' | 'Paid' | 'Partial' | 'Overpaid';

export type FloorAndAll = keyof typeof FLOOR;

export type Floor = Exclude<FloorAndAll, 'all'>;

export type FloorLabel = (typeof FLOOR_LABEL)[FloorAndAll];

export type Bed = keyof typeof BED;

export type BedLabel = (typeof BED_LABEL)[Bed];

export type BedRents = {
    [F in Floor]: F extends 'second' ? Record<Bed, number> : Record<Exclude<Bed, 'special'>, number>;
};

export interface DefaultValues {
    rents: BedRents;
    wifiCharge: number;
    securityDeposit: number;
    billDates: {
        prevMonth: Timestamp;
        currentMonth: Timestamp;
    };
}

export interface Member {
    id: string; // Firestore document ID
    moveInDate: Timestamp;
    name: string;
    phone: string;
    floor: Floor;
    bed: Bed;
    rent: number;
    rentAtJoining: number;
    securityDeposit: number;
    advanceDeposit: number;
    totalAgreedDeposit: number;
    isActive: boolean;
    optedForWifi: boolean;
    note: string;
    currentMonthRent: RentHistory;
    leaveDate?: Timestamp;
}

export interface Expense {
    amount: number;
    description: string;
}

export interface RentHistory {
    id: string;
    generatedAt: Timestamp;
    rent: number;
    electricity: number;
    wifi: number;
    prevOutstanding: number;
    expenses: Expense[];
    totalCharges: number;
    amountPaid: number;
    outstanding: number;
    note: string;
    status: PaymentStatus;
}

export interface Bill {
    id: string;
    generatedAt: Timestamp;
    electric: {
        [K in Floor]: {
            totalAmount: number;
            members: string[];
        };
    };
    expenses: {
        members: string[];
        totalAmount: number;
        description: string;
    };
    wifi: {
        members: string[];
        totalAmount: number;
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

export interface ReactChildren {
    children: ReactNode;
}
