import { type ThemeIconProps } from '@mantine/core';
import { MyThemeIcon } from './icons';
import type { PaymentStatus } from '../types/firestore-types';
import { getStatusAlertConfig } from '../utils';

interface StatusBadgeProps extends Omit<ThemeIconProps, 'children'> {
  status: PaymentStatus;
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const config = getStatusAlertConfig(status);

  return <MyThemeIcon icon={config.iconComponent} color={config.color} {...props} />;
}
