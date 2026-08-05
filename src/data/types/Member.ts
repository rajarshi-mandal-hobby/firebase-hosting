import type { Timestamp } from 'firebase/firestore';
import type { Floor, Bed, RentHistory } from '.';

export interface Member {
    id: string; // Firestore document ID
    moveInDate: Timestamp;
    name: string;
    phone: string;
    floor: Floor;
    bed: Bed;
    rent: number;
    securityDeposit: number;
    advanceDeposit: number;
    totalAgreedDeposit: number;
    isActive: boolean;
    optedForWifi: boolean;
    remarks: string;
    currentMonthRent: RentHistory;
    updatedAt?: Timestamp;
    leaveDate?: Timestamp;
}
