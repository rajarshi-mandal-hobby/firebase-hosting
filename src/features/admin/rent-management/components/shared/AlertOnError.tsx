import { Collapse, Alert, Group, Button, Text } from "@mantine/core";
import { ALT_TEXT, ICON_SIZE } from "../../../../../data/types";
import { IconExclamation } from "../../../../../shared/icons";

interface AlertErrorProps {
	hasGlobalErrors: boolean;
	hasErrorForMember: boolean;
	resetCallback: () => void;
	failedToMessage: string;
	memberName: string | null;
}

export const AlertOnError = ({
	hasGlobalErrors,
	hasErrorForMember,
	resetCallback,
	failedToMessage,
	memberName
}: AlertErrorProps) => (
	<Collapse in={hasGlobalErrors}>
		<Alert color='red' p='xs' variant='outline' icon={<IconExclamation size={ICON_SIZE} />}>
			{hasErrorForMember ?
				<Group wrap='nowrap' grow preventGrowOverflow={false}>
					<Text>Failed to {failedToMessage}. You can try again or reset the form to undo changes.</Text>
					<Button size='xs' onClick={resetCallback} w={110} autoFocus={false}>
						Reset
					</Button>
				</Group>
			:	<Text>Failed transaction for {memberName || ALT_TEXT}</Text>}
		</Alert>
	</Collapse>
);
