import type { Timestamp } from 'firebase/firestore';
import { useMembers } from '../../../../../contexts';
import type { Floor, DefaultRents, Member } from '../../../../../data/types';

export interface GenerateBillsData {
    billingMonths: {
        currentBillingMonth: Timestamp;
        nextBillingMonth: Timestamp;
    };
    floorIdNameMap: { [F in Floor]: { [memberId: string]: string } };
    wifiCharges: {
        wifiMemberIds: string[];
        wifiMonthlyCharge: number;
    };
    membersOptions: { value: string; label: string }[];
}

export const useBillsData = (rents: DefaultRents) => {
    const { members, error } = useMembers();

    const processData = (fetchedMembers: Member[], rents: DefaultRents): GenerateBillsData | null => {
        if (fetchedMembers.length === 0 || error) return null;

        const wifiMemberIds: string[] = [];
        // Object structure is { '2nd': { 'memberId': 'memberName' }, '3rd': { 'memberId': 'memberName' } }
        const floorIdNameMap: Record<Floor, Record<string, string>> = { '2nd': {}, '3rd': {} };

        const membersOptions = fetchedMembers.map((member) => {
            if (member.optedForWifi) wifiMemberIds.push(member.id);
            floorIdNameMap[member.floor][member.id] = member.name;
            return { label: member.name, value: member.id };
        });

        return {
            billingMonths: {
                currentBillingMonth: rents.currentBillingMonth,
                nextBillingMonth: rents.nextBillingMonth
            },
            floorIdNameMap,
            wifiCharges: { wifiMemberIds, wifiMonthlyCharge: rents.wifiMonthlyCharge },
            membersOptions
        };
    };

    const billingData = processData(members, rents);

    return billingData;
};
