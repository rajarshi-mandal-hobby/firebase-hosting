import { type Floor, Floors } from '../../../../../../data/types';
import { toNumber } from '../../../../../../shared/utils';
import type { BillFormData } from '../hooks/useBillsForm';

/**
 * Computes the per head bill amount by dividing the total bill by the number of members.
 * @param totalBill - The total bill amount.
 * @param memberCount - The number of members.
 * @returns The per head bill amount, rounded up to the nearest integer.
 */
export const computePerHeadBill = (totalBill: number | string | undefined, memberCount: number | string | undefined) =>
    totalBill && memberCount ? Math.ceil(toNumber(totalBill) / toNumber(memberCount)) : 0;

export const computeToggleState = (
    formValues: BillFormData,
    floorIdNameMap: Record<Floor, Record<string, string>>,
    prevFloorIdNameMap: Record<Floor, Record<string, string>>
) => {
    const isNextMonth = !formValues.isUpdatingBills;
    const expenseIdsLookUp = new Set(formValues.addExpenseMemberIds);
    const floorExpensesStatus = {} as Record<Floor, boolean>;

    for (const floor of Object.values(Floors)) {
        floorExpensesStatus[floor] = Object.keys(isNextMonth ? floorIdNameMap[floor] : prevFloorIdNameMap[floor]).every(
            (id) => expenseIdsLookUp.has(id)
        );
    }

    return floorExpensesStatus;
};
