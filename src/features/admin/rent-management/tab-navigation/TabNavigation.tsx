import { SegmentedControl, Alert, Collapse } from "@mantine/core";
import { useState, startTransition, Activity } from "react";
import { RentManagement } from "../components/RentManagement";
import { MembersManagement } from "../../../members/components/MembersManagement";
import { ICON_SIZE } from "../../../../data/types";
import { IconExclamation } from "../../../../shared/icons";

type Tab = "rent" | "members";

const TAB_DATA: { label: string; value: Tab }[] = [
	{ label: "Rent", value: "rent" },
	{ label: "Members", value: "members" }
];

type ModalType = "recordPayment" | "addExpense";

export function TabNavigation() {
	const [activeTab, setActiveTab] = useState<Tab>("rent");
	const [failedModalMap, setFailedModalMap] = useState<Map<ModalType, Set<string>>>(new Map());
	
	const addFailure = (type: ModalType, id: string) => {
		setFailedModalMap((prev) => {
			const next = new Map(prev);
			// Use optional chaining and default to new Set
			const updatedSet = new Set(next.get(type)).add(id);
			return next.set(type, updatedSet);
			});
		};

		const removeFailure = (type: ModalType, id: string) => {
			setFailedModalMap((prev) => {
				if (!prev.has(type)) return prev; // Optimization: skip update if type doesn't exist

				const next = new Map(prev);
				const updatedSet = new Set(next.get(type));
				updatedSet.delete(id);

				if (updatedSet.size === 0) {
					next.delete(type);
				} else {
					next.set(type, updatedSet);
				}
				return next;
			});
		};

		const hasFailures = (memberId: string, type?: ModalType) => {
			if (type) return failedModalMap.get(type)?.has(memberId) ?? false;

			// Use for...of on the Map directly instead of spreading into an array
			for (const set of failedModalMap.values()) {
				if (set.has(memberId)) return true;
			}
			return false;
		};

	return (
		<>
			<SegmentedControl
				value={activeTab}
				onChange={(value) => startTransition(() => setActiveTab(value as Tab))}
				data={TAB_DATA}
			/>

			<Collapse in={failedModalMap.size > 0}>
				<Alert
					color='red'
					variant='outline'
					withCloseButton={false}
					p='xs'
					mt='lg'
					icon={<IconExclamation size={ICON_SIZE} color='red' />}>
					{failedModalMap.size} failed transaction{failedModalMap.size === 1 ? "" : "s"}. Please try again.
				</Alert>
			</Collapse>

			<Activity mode={activeTab === "rent" ? "visible" : "hidden"}>
				<RentManagement
					addFailure={addFailure}
					removeFailure={removeFailure}
					hasFailures={hasFailures}
				/>
			</Activity>

			<Activity mode={activeTab === "members" ? "visible" : "hidden"}>
				<MembersManagement />
			</Activity>
		</>
	);
}
