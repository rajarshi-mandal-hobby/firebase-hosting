import { ThemeIcon, type ThemeIconProps } from '@mantine/core';

import type { PaymentStatus } from '../types/firestore-types';
import { getStatusAlertConfig } from '../utils';

interface StatusBadgeProps extends Omit<ThemeIconProps, 'children'> {
  status: PaymentStatus;
}

export function StatusBadge({ status, ...props }: StatusBadgeProps) {
  const config = getStatusAlertConfig(status);

  return <ThemeIcon color={config.color} {...props} >{<config.icon />}</ThemeIcon>;
}
    