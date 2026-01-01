import { Alert, Title } from "@mantine/core";
import { GroupIcon } from ".";
import { IconInfo } from "../icons";
import type { IconComponent } from "../utils";

interface MyAlertProps {
	children: React.ReactNode;
	title?: string;
	color?: string;
	Icon?: IconComponent;
	my?: string;
}

export const MyAlert = ({ title, color = "red", Icon, children, my = "md" }: MyAlertProps) => {
	if (!Icon) {
		Icon = IconInfo;
	}

	if (!title) {
		title = "Alert";
	}

	return (
		<Alert p='md' color={color} my={my}>
			<GroupIcon mb='sm'>
				<Icon height={20} width={20} color='var(--alert-color)' />
				<Title order={5} c='var(--alert-color)'>
					{title}
				</Title>
			</GroupIcon>
			{children}
		</Alert>
	);
};
