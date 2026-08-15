import type { Timestamp } from 'firebase/firestore';
import type { PaymentStatus, Adjustment } from '.';

export interface RentHistory {
    /**
     * Month ID is format 'YYYY-MM'
     */
    id: string;
    generatedAt: Timestamp;
    /**
     * This is for reference, the actual rent is stored in the member document
     */
    rent: number;
    electricity: number;
    wifi: number;
    adjustments: Adjustment[];
    totalCharges: number;
    amountPaid: number;
    outstanding: number;
    remarks?: string[];
    /**
     * @deprecated Use remarks instead
     */
    note?: string;
    status: PaymentStatus;
}
