import { ThemeIcon } from '@mantine/core';
import { IconCheck, IconDoneAll, IconPriorityHigh } from '../icons';
import type { PaymentStatus } from '../types/firestore-types';
import type { SVGProps } from 'react';

type IconComponent = React.ComponentType<SVGProps<SVGSVGElement>>;

// Define the shape of each status configuration
type StatusConfigEntry = {
  icon: IconComponent;
  color: string;
  title: string;
  message: string;
};

const StatusConfig: Record<PaymentStatus, StatusConfigEntry> = {
  Paid: {
    icon: IconCheck,
    color: 'green',
    title: 'Payment Complete',
    message: 'Your rent for this month has been paid in full.',
  },
  Overpaid: {
    icon: IconDoneAll,
    color: 'green.8',
    title: 'Overpaid',
    message: 'You have a credit balance that will be adjusted in future bills.',
  },
  Partial: {
    icon: IconPriorityHigh,
    color: 'orange.7',
    title: 'Partial Payment',
    message: 'You have made a partial payment. Please complete the remaining amount.',
  },
  Due: {
    icon: IconPriorityHigh,
    color: 'red',
    title: 'Payment Due',
    message: 'Your rent payment is pending. Please make the payment before 15th of this month.',
  },
} as const;

export const getStatusAlertConfig = (status: PaymentStatus) => StatusConfig[status];
export const getStatusColor = (status: PaymentStatus) => StatusConfig[status].color;
export const getStatusIcon = (status: PaymentStatus) => StatusConfig[status].icon;
export const getStatusTitle = (status: PaymentStatus) => StatusConfig[status].title;
export const getStatusMessage = (status: PaymentStatus) => StatusConfig[status].message;

// StatusBadge component
type StatusBadgeProps = {
  size: number;
  status: PaymentStatus;
};

export const StatusBadge = ({ size, status }: StatusBadgeProps) => {
  const { icon: Icon, color } = StatusConfig[status];
  const innerIconSize = size - (size < 16 ? 2 : 4);

  return (
    <ThemeIcon color={color} size={size} radius='50%'>
      <Icon width={innerIconSize} height={innerIconSize} />
    </ThemeIcon>
  );
};
