import type { Floor, Bed, DefaultRents, Member, MemberFormAction } from '../../../data/types';
import type { BaseRentsAndRollingBills } from '../../../data/types/DefaultRents';

export interface MemberDetailsFormProps {
    rentsAndBills: BaseRentsAndRollingBills;
    memberAction: MemberFormAction;
    member: Member | null;
    members: Member[];
}

export type MemberFormData = {
    id?: string;
    moveInDate: string;
    name: string;
    phone: string;
    floor: Floor | null;
    bed: Bed | null;
    optedForWifi: boolean;
    note: string;
    amountPaid: number | string;
    forwardOutstanding: boolean;
    recalculate: boolean;
};

export type MemberFormDataTransformed = {
    id?: string;
    moveInDate: string;
    name: string;
    phone: string;
    floor: Floor;
    bed: Bed;
    optedForWifi: boolean;
    note: string;
    amountPaid: number;
    forwardOutstanding: boolean;
    recalculate: boolean;
};

export interface MemberFormSummary {
    rent: number;
    securityDeposit: number;
    totalDeposit: number;
    outstanding: number;
    wifi: number;
    prevWifi: number;
    total: number;
}
