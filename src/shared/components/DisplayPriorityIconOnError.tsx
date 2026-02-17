import { DEFAULT_SVG_SIZE } from '../../data/types';
import { IconExclamation } from '../icons';

interface DisplayPriorityIconOnErrorProps {
    showIcon: boolean;
}
export const DisplayPriorityIconOnError = ({ showIcon }: DisplayPriorityIconOnErrorProps) => {
    return showIcon ? <IconExclamation size={DEFAULT_SVG_SIZE} color='red' /> : null;
};
