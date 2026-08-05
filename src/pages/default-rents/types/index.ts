import type { DefaultRents, Member } from '../../../data/types';

export interface DefaultRentsFormProps {
    defaultRents: DefaultRents | null;
    members: Member[];
    onResetValues: VoidFunction;
}

export interface DefaultFormValues {
    secondBed: string | number;
    secondRoom: string | number;
    secondSpecial: string | number;
    thirdBed: string | number;
    thirdRoom: string | number;
    securityDeposit: string | number;
    wifiMonthlyCharge: string | number;
}

export interface DefaultFormValuesTransformed {
    secondBed: number;
    secondRoom: number;
    secondSpecial: number;
    thirdBed: number;
    thirdRoom: number;
    securityDeposit: number;
    wifiMonthlyCharge: number;
}
