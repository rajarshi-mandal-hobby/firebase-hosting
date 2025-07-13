import type { PaymentStatus } from '../types/firestore-types';
import { IconCheck, IconDoneAll, IconSendMoney, IconClose, MyThemeIcon } from '../components';

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

export const statusConfigs: Record<PaymentStatus, StatusConfig> = {
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

export const getStatusIcon = (status: PaymentStatus) => {
  return statusConfigs[status]?.icon;
};

export const getStatusColor = (status: PaymentStatus) => {
  return statusConfigs[status]?.color;
};

export function getStatusAlertConfig(status: PaymentStatus) {
  const config = statusConfigs[status];
  const IconComponent = config.icon;
  return {
    color: config.alertColor,
    title: config.alertTitle,
    message: config.alertMessage,
    icon: <MyThemeIcon icon={IconComponent} color={config.alertColor} size={16} />,
    iconComponent: IconComponent,
  };
}
