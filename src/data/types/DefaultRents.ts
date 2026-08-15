import type { Timestamp } from 'firebase/firestore';
import type { BedRents, Bill } from '.';

export interface DefaultRents {
    rents: BedRents;
    wifiCharge: number;
    securityDeposit: number;
    billDates: {
        prevMonth: Timestamp;
        currentMonth: Timestamp;
    };
}

export interface BaseRentsAndRollingBills {
    defaults: {
        rents: BedRents;
        securityDeposit: number;
    };
    bills: {
        previousMonth?: Bill;
        currentMonth?: Bill;
    };
}
