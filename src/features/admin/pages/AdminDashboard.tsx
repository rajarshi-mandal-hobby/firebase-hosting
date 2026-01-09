import { Text, Stack, Title } from "@mantine/core";

import { AdminMenu } from "./shared-components";
import { useAuth } from "../../../contexts/AuthContext";
import { GroupIcon, GroupSpaceApart, LoadingBox, MyAvatar } from "../../../shared/components";
import { TabNavigation } from "../rent-management/tab-navigation/TabNavigation";

export const AdminDashboard = () => {
	const { user, loading } = useAuth();
	const adminEmail = user?.email || "";
	const adminName = user?.displayName || "Admin";

	if (loading) {
		return <LoadingBox />;
	}

	console.log("🎨 Rendering AdminDashboard");

	return (
		<Stack p='md'>
			{/* Header with Admin Info and Sign Out */}
			<GroupSpaceApart>
				<GroupIcon>
					<MyAvatar name={adminName} src={user?.photoURL} size='md' />
					<Stack gap={0}>
						<Title order={4}>{adminName}</Title>
						<Text size='xs' c='dimmed'>
							{adminEmail || "Admin"}
						</Text>
					</Stack>
				</GroupIcon>

				{/* Admin Menu */}
				<AdminMenu />
			</GroupSpaceApart>

			{/* Tab Navigation */}
			<TabNavigation />
		</Stack>
	);
};
