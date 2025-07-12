import React from 'react';
import { type ThemeIconProps } from '@mantine/core';
import { IconCheck, IconClose, IconDoneAll, IconSendMoney, MyThemeIcon } from './icons';

export type PaymentStatus = 'Paid' | 'Due' | 'Partial' | 'Overpaid' | 'Partially Paid';
export type GeneralStatus = PaymentStatus | 'active' | 'inactive';

interface IconProps {
  size?: number | string;
  color?: string;
}

interface StatusConfig {
  icon: React.FC<IconProps>;
  color: string;
  alertColor: string;
  alertTitle: string;
  alertMessage: string;
}

const statusConfigs: Record<PaymentStatus, StatusConfig> = {
  Paid: {
    icon: IconCheck,
    color: 'green.6',
    alertColor: 'green.6',
    alertTitle: 'Payment Complete',
    alertMessage: 'Your rent for this month has been paid in full.',
  },
  Overpaid: {
    icon: IconDoneAll,
    color: 'lime.7',
    alertColor: 'teal',
    alertTitle: 'Overpaid',
    alertMessage: 'You have a credit balance that will be adjusted in future bills.',
  },
  Partial: {
    icon: IconSendMoney,
    color: 'orange.6',
    alertColor: 'orange.6',
    alertTitle: 'Partial Payment',
    alertMessage: 'You have made a partial payment. Please complete the remaining amount.',
  },
  'Partially Paid': {
    icon: IconSendMoney,
    color: 'orange.6',
    alertColor: 'orange.6',
    alertTitle: 'Partial Payment',
    alertMessage: 'You have made a partial payment. Please make the payment before 15th of this month.',
  },
  Due: {
    icon: IconClose,
    color: 'red.7',
    alertColor: 'red.7',
    alertTitle: 'Payment Due',
    alertMessage: 'Your rent payment is pending. Please make the payment before 15th of this month.',
  },
};

// Simple mapping for GeneralStatus-only statuses
const generalStatusMap = {
  active: 'Paid',
  inactive: 'Due',
} as const;

interface StatusBadgeProps extends Omit<ThemeIconProps, 'children'> {
  status: PaymentStatus;
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const config = statusConfigs[status];

  return <MyThemeIcon icon={config.icon} color={config.color} {...props} />;
}

export const getStatusIcon = (status: PaymentStatus) => {
  return statusConfigs[status]?.icon;
}

export const getStatusColor = (status: PaymentStatus) => {
  return statusConfigs[status]?.color;
}

export function getStatusAlertConfig(status: PaymentStatus) {
  const config = statusConfigs[status];
  const IconComponent = config.icon;
  return {
    color: config.alertColor,
    title: config.alertTitle,
    message: config.alertMessage,
    icon: <MyThemeIcon icon={IconComponent} color={config.alertColor} size={16} />,
  };
}

// StatusIndicator component (merged from StatusIndicator.tsx)
interface StatusIndicatorProps {
  status: GeneralStatus;
  size?: number;
  children: React.ReactNode;
}

export function StatusIndicator({ status, size = 16, children }: StatusIndicatorProps) {
  // Map GeneralStatus to PaymentStatus for reuse
  const paymentStatus: PaymentStatus =
    generalStatusMap[status as keyof typeof generalStatusMap] || (status as PaymentStatus);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {children}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          borderRadius: '50%',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid white',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
        }}>
        <StatusBadge status={paymentStatus} size={size - 2} />
      </div>
    </div>
  );
}
