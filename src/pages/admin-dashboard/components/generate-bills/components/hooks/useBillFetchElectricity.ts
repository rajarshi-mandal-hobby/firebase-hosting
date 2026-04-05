import dayjs from 'dayjs';
import { ELECTRICITY, ERROR_CAUSE, type ElectricBill, type Floor } from '../../../../../../data/types';
import type { BillFormData } from './useBillsForm';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../../../firebase';

export const fetchElectricity = async (
    dateToLoad: string,
    membersOptions: { value: string; label: string }[],
    floorIdNameMap: Record<Floor, Record<string, string>>
) => {
    // 1. Standardize date format using dayjs
    const date = dayjs(dateToLoad);
    if (!date.isValid()) {
        throw new Error('Invalid month format', { cause: ERROR_CAUSE.INVALID_DATA });
    }
    const monthId = date.format('YYYY-MM');

    // 2. Fetch Data
    const docRef = doc(db, ELECTRICITY.COL, monthId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
        throw new Error(`Electric Bill not found for ${date.format('MMMM YYYY')}`);
    }

    const bill = docSnapshot.data() as ElectricBill;
    const prevMap = bill.floorIdNameMap;

    // 3. Merge Floor Maps & Member Options efficiently
    const mergedFloorMap = {} as Record<Floor, Record<string, string>>;

    for (const floor in floorIdNameMap) {
        mergedFloorMap[floor as Floor] = { ...floorIdNameMap[floor as Floor], ...prevMap[floor as Floor] };
    }

    const obj = Object.values(mergedFloorMap).flatMap((i) => Object.entries(i)) as [string, string][];
    const bObj = membersOptions.map((i) => [i.value, i.label]) as [string, string][];
    const updatedMembersOptions = [...new Map([...obj, ...bObj])].map(([key, value]) => ({ value: key, label: value }));

    // 4. Return structured data
    return {
        formData: {
            selectedBillingMonth: dayjs(bill.id).format('YYYY-MM-DD'),
            secondFloorElectricityBill: bill.floorCosts['2nd'].bill,
            thirdFloorElectricityBill: bill.floorCosts['3rd'].bill,
            secondFloorActiveMemberCount: bill.floorCosts['2nd'].members.length,
            thirdFloorActiveMemberCount: bill.floorCosts['3rd'].members.length,
            wifiMonthlyCharge: bill.wifi.amount,
            wifiMemberIds: bill.wifi.members,
            addExpenseMemberIds: bill.expenses.members,
            addExpenseAmount: bill.expenses.amount,
            addExpenseDescription: bill.expenses.description,
            isUpdatingBills: true
        } as BillFormData,
        metaData: {
            prevMembersOptions: updatedMembersOptions,
            prevFloorIdNameMap: mergedFloorMap
        }
    };
};
