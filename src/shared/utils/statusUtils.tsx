import { ThemeIcon } from '@mantine/core';
import { IconCheck, IconDoneAll, IconPriorityHigh, type IconComponent } from '../icons';
import { DEFAULT_SVG_SIZE } from '../types';
import type { PaymentStatus } from '../../data/types';

// Define the shape of each status configuration

type Color = 'green' | 'green.8' | 'orange' | 'red';

interface StatusConfigEntry {
    icon: IconComponent;
    color: Color;
    title: string;
    message: string;
}

const StatusConfig: Record<PaymentStatus, StatusConfigEntry> = {
    Paid: {
        icon: IconCheck,
        color: 'green',
        title: 'Payment Complete',
        message: 'The rent for this month has been paid in full.'
    },
    Overpaid: {
        icon: IconDoneAll,
        color: 'green.8',
        title: 'Overpaid',
        message: 'There is a credit balance that will be adjusted in future bills.'
    },
    Partial: {
        icon: IconPriorityHigh,
        color: 'orange',
        title: 'Partial Payment',
        message: 'A partial payment has been made. The outstanding amount will be adjusted in future bills.'
    },
    Due: {
        icon: IconPriorityHigh,
        color: 'red',
        title: 'Payment Due',
        message: 'The rent payment is pending. Please make the payment before 15th of this month.'
    }
} as const;

export const getStatusAlertConfig = (status: PaymentStatus) => StatusConfig[status];
export const getStatusColor = (status: PaymentStatus) => StatusConfig[status].color;
export const getStatusIcon = (status: PaymentStatus) => StatusConfig[status].icon;
export const getStatusTitle = (status: PaymentStatus) => StatusConfig[status].title;
export const getStatusMessage = (status: PaymentStatus) => StatusConfig[status].message;

// StatusBadge component
type StatusBadgeProps = {
    size?: number;
    status: PaymentStatus;
};

export const StatusBadge = ({ size = DEFAULT_SVG_SIZE, status }: StatusBadgeProps) => {
    const { icon: Icon, color } = StatusConfig[status];
    const innerIconSize = size - (size < 16 ? 2 : 4);

    return (
        <ThemeIcon color={color} size={size} radius='50%' autoContrast={false}>
            <Icon width={innerIconSize} height={innerIconSize} />
        </ThemeIcon>
    );
};
