import { DEFAULT_SVG_SIZE } from '../../data/types';
import { IconPriorityHigh } from '../icons';

interface DisplayPriorityIconOnErrorProps {
    showIcon: boolean;
}

/**
 * Displays a priority icon if the showIcon prop is true.
 * Uses IconPriorityHigh icon from the shared icons library.
 *
 * @param {DisplayPriorityIconOnErrorProps} props - The component props.
 * @param {boolean} props.showIcon - Whether to display the icon.
 * @returns {JSX.Element | null} The icon if showIcon is true, otherwise null.
 */
export const PriorityIconOnError = ({ showIcon }: DisplayPriorityIconOnErrorProps) => {
    return showIcon ? <IconPriorityHigh size={DEFAULT_SVG_SIZE} color='red' /> : null;
};
