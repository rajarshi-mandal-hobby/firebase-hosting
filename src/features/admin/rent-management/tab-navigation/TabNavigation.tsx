import { SegmentedControl, Alert, Collapse } from "@mantine/core";
import { Activity } from "react";
import { RentManagement } from "../components/RentManagement";
import { MembersManagement } from "../../../members/components/MembersManagement";
import { ICON_SIZE } from "../../../../data/types";
import { IconExclamation } from "../../../../shared/icons";
import { useTabNavigation, type Tab } from "./hooks/useTabNavigation";

const TAB_DATA: { label: string; value: Tab }[] = [
	{ label: "Rent", value: "rent" },
	{ label: "Members", value: "members" }
] as const;

export function TabNavigation() {
	const { activeTab, handleTabChange, modalErrors, setModalError, hasModalErrors, hasModalErrorForMember } = useTabNavigation();

	console.log("🎨 Rendering TabNavigation");
	return (
		<>
			<SegmentedControl value={activeTab} onChange={handleTabChange} data={TAB_DATA} />

			<Collapse in={hasModalErrors}>
				<Alert
					color='red'
					variant='outline'
					withCloseButton={false}
					p='xs'
					mt='lg'
					icon={<IconExclamation size={ICON_SIZE} color='red' />}>
					{modalErrors.size} failed transaction{modalErrors.size === 1 ? "" : "s"}. Please try again.
				</Alert>
			</Collapse>

			<Activity mode={activeTab === "rent" ? "visible" : "hidden"}>
				<RentManagement hasModalErrorForMember={hasModalErrorForMember} onModalError={setModalError} />
			</Activity>

			<Activity mode={activeTab === "members" ? "visible" : "hidden"}>
				<MembersManagement />
			</Activity>
		</>
	);
}
