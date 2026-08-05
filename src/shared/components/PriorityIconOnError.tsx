import type { DefaultMantineColor } from '@mantine/core';
import { IconPriorityHigh } from '../icons';

interface PriorityIconOnErrorProps {
    showIcon: boolean;
    size?: number;
    color?: DefaultMantineColor;
}

/**
 * Displays a priority icon if the showIcon prop is true.
 */
export const PriorityIconOnError = ({ showIcon, color = 'red', size }: PriorityIconOnErrorProps) => {
    return showIcon ? <IconPriorityHigh size={size} c={color} /> : undefined;
};
