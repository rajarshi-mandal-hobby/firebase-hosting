import type { Timestamp } from 'firebase/firestore';
import type { Floor } from '.';

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
    /**
     * Reference for member id to name mapping
     */
    idNameMap: Record<string, string>;
}
