import { useState, useRef, useEffect, useEffectEvent } from "react";
import { fetchMembers } from "../../../../data/services/membersService";
import type { Timestamp } from "@firebase/firestore";
import { fetchDefaultValues } from "../../../../data/services/defaultsService";
import { type DefaultValues, type Floor, type Member } from "../../../../data/types";

type FunctionName = "fetchGlobalSettings" | "fetchMembers";

interface FunctionError {
	functionName: FunctionName;
	error: Error;
}

export type GenerateBillsData = {
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
};

export const useBillsData = () => {
	const [billingData, setBillingData] = useState<GenerateBillsData | null>(null);
	const [isLoading, setLoading] = useState(true);
	const [error, setError] = useState<FunctionError | null>(null);

	const retryCountRef = useRef<Record<FunctionName, number>>({
		fetchMembers: 0,
		fetchGlobalSettings: 0
	});

	const retryFunctionRef = useRef<FunctionName | null>(null);
	const [fetchTrigger, setFetchTrigger] = useState(0);

	const processData = (fetchedMembers: Member[], billingData: DefaultValues): GenerateBillsData => {
		const wifiMemberIds: string[] = [];
		const floorIdNameMap: Record<Floor, Record<string, string>> = { "2nd": {}, "3rd": {} };

		const membersOptions = fetchedMembers.reduce<{ label: string; value: string }[]>(
			(acc, member) => {
				if (member.optedForWifi) wifiMemberIds.push(member.id);
				floorIdNameMap[member.floor][member.id] = member.name;
				acc.push({ label: member.name, value: member.id });
				return acc;
			},
			[] as { label: string; value: string }[]
		);

		return {
			billingMonths: {
				currentBillingMonth: billingData.currentBillingMonth,
				nextBillingMonth: billingData.nextBillingMonth
			},
			floorIdNameMap,
			wifiCharges: {
				wifiMemberIds,
				wifiMonthlyCharge: billingData.wifiMonthlyCharge
			},
			membersOptions
		};
	};

	const effectEvent = useEffectEvent(async () => {
		try {
			setLoading(true);
			setError(null);

			const retryFunction = retryFunctionRef.current;

			// ✅ Step 1: Fetch members first
			let fetchedMembers: Member[];
			try {
				fetchedMembers = await fetchMembers({
					isActive: "active",
					reload: retryFunction === "fetchMembers"
				});
				// Reset members retry count on success
				retryCountRef.current.fetchMembers = 0;
			} catch (err) {
				console.error(err);
				setError({
					functionName: "fetchMembers",
					error: err as Error
				});
				setLoading(false);
				return; // ✅ Stop here - don't fetch settings
			}

			// ✅ Step 2: Only if members succeeded, fetch settings
			let billingData;
			try {
				billingData = (await fetchDefaultValues()) as DefaultValues;
				// Reset settings retry count on success
				retryCountRef.current.fetchGlobalSettings = 0;
			} catch (err) {
				setError({
					functionName: "fetchGlobalSettings",
					error: err as Error
				});
				setLoading(false);
				return; // ✅ Settings failed, show error
			}

			// ✅ Both succeeded - process and set data
			retryFunctionRef.current = null;
			const processedData = processData(fetchedMembers, billingData);
			setBillingData(processedData);
			setLoading(false);
			setError(null);
		} catch (err: any) {
			setError({
				functionName: "fetchMembers",
				error: err as Error
			});
			setLoading(false);
		}
	});

	// ✅ Sequential fetch - first resolve members, then settings
	useEffect(() => {
		effectEvent();
	}, [fetchTrigger]);

	// ✅ Manual retry handler
	const handleRefetch = () => {
		if (!error) return;

		const currentRetryCount = retryCountRef.current[error.functionName];

		if (currentRetryCount >= 3) {
			setError((prev) => ({
				...prev!,
				error: new Error("Maximum retry attempts (3) exceeded. Please refresh the page.")
			}));
			return;
		}

		retryCountRef.current[error.functionName]++;
		retryFunctionRef.current = error.functionName; // ✅ Retry the specific failed function
		setFetchTrigger((prev) => prev + 1); // ✅ Trigger effect re-run
	};

	return { isLoading, error, billingData, handleRefetch } as const;
};
