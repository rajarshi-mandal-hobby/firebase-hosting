import { SegmentedControl, Collapse, Alert } from "@mantine/core";
import { Activity } from "react";
import { ICON_SIZE } from "../../../data/types";
import { IconExclamation } from "../../../shared/icons";
import { useErrorCache } from "./hooks/useErrorCache";
import { type Tab, useTabNavigation } from "./hooks/useTabNavigation";
import { MembersManagement } from "./member-menagement/components/MembersManagement";
import { RentManagement } from "../rent-management/components/RentManagement";

const TAB_DATA: { value: Tab; label: string }[] = [
	{ value: "rent", label: "Rent" },
	{ value: "members", label: "Members" }
] as const;

export function TabNavigation() {
	const { activeTab, handleTabChange, hasGlobalErrors, totalErrorCount, getActivityMode } = useTabNavigation();

	const errorCacheOptions = useErrorCache();
	console.log("🎨 Rendering TabNavigation");
	return (
		<>
			<SegmentedControl value={activeTab} onChange={handleTabChange} data={TAB_DATA} />

			<Collapse in={hasGlobalErrors}>
				<Alert color='red' variant='outline' p='xs' mt='lg' icon={<IconExclamation size={ICON_SIZE} color='red' />}>
					{totalErrorCount} {totalErrorCount === 1 ? "transaction" : "transactions"} failed. Please try again.
				</Alert>
			</Collapse>

			<Activity mode={getActivityMode(activeTab === "rent")}>
				<RentManagement {...errorCacheOptions} />
			</Activity>

			<Activity mode={getActivityMode(activeTab === "members")}>
				<MembersManagement />
			</Activity>
		</>
	);
}
