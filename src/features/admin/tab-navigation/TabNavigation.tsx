import { Stack, SegmentedControl } from "@mantine/core";
import { useState, startTransition, Activity } from "react";
import { MembersManagement } from "../../members/components/MembersManagement";
import { RentManagement } from "../rent-management/components/RentManagement";

type Tab = "rent" | "members";

const TAB_DATA: { label: string; value: Tab }[] = [
	{ label: "Rent", value: "rent" },
	{ label: "Members", value: "members" }
];

export const TabNavigation = () => {
	const [activeTab, setActiveTab] = useState<Tab>("rent");

	console.log("Rendering TabNavigation");

	return (
		<Stack gap='lg'>
			<SegmentedControl
				value={activeTab}
				onChange={(value) => startTransition(() => setActiveTab(value as Tab))}
				data={TAB_DATA}
			/>

			<Activity mode={activeTab === "rent" ? "visible" : "hidden"}>
				<RentManagement />
			</Activity>

			<Activity mode={activeTab === "members" ? "visible" : "hidden"}>
				<MembersManagement />
			</Activity>
		</Stack>
	);
};
