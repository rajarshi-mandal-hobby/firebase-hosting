import { fetchElectricBill } from "../../../../data/services/electricService";
import dayjs from "dayjs";
import type { Floor } from "../../../../data/types";

export const useBillFetchElectricity = () => {
	const fetchAndLoadBillData = async (
		dateToLoad: string,
		failedFetchMonth: string | null,
		membersOptions: { value: string; label: string }[],
		floorIdNameMap: Record<Floor, Record<string, string>>
	) => {
		const bill = await fetchElectricBill(dateToLoad.slice(0, 7), failedFetchMonth === dateToLoad);

		const prevMemberIds = new Set(membersOptions.map((item) => item.value));
		const newMembersOptions: { value: string; label: string }[] = [...membersOptions];
		const newFloorIdNameMap = {
			...floorIdNameMap,
			...bill.floorIdNameMap
		};

		for (const members of Object.values(newFloorIdNameMap)) {
			for (const [memberId, memberName] of Object.entries(members)) {
				if (prevMemberIds.has(memberId)) continue;
				newMembersOptions.push({
					value: memberId,
					label: memberName
				});
			}
		}

		return {
			selectedBillingMonth: dayjs(bill.id).format("YYYY-MM-DD"),
			secondFloorElectricityBill: bill.floorCosts["2nd"].bill,
			thirdFloorElectricityBill: bill.floorCosts["3rd"].bill,
			activeMemberCounts: {
				"2nd": bill.floorCosts["2nd"].members.length,
				"3rd": bill.floorCosts["3rd"].members.length
			},
			wifiCharges: {
				wifiMonthlyCharge: bill.wifi.amount,
				wifiMemberIds: bill.wifi.members
			},
			additionalExpenses: {
				addExpenseMemberIds: bill.expenses.members,
				addExpenseAmount: bill.expenses.amount,
				addExpenseDescription: bill.expenses.description
			},
			isUpdatingBills: true,
			prevMembersOptions: newMembersOptions,
			prevFloorIdNameMap: newFloorIdNameMap
		};
	};

	return { fetchAndLoadBillData };
};
