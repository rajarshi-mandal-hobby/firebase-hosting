import { ICON_SIZE } from "../../../../../data/types";
import { IconExclamation } from "../../../../../shared/icons";

interface DisplayPriorityIconProps {
	showIcon: boolean;
}
export const DisplayPriorityIcon = ({ showIcon }: DisplayPriorityIconProps) => {
	return showIcon ? <IconExclamation size={ICON_SIZE} color='red' /> : null;
};
