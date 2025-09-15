import { NumberFormatter } from '@mantine/core';
import { memo, type ComponentProps } from 'react';

interface CurrencyFormatterProps
  extends Omit<ComponentProps<typeof NumberFormatter>, 'value' | 'prefix' | 'thousandSeparator'> {
  value?: number;
  prefix?: string;
  thousandSeparator?: boolean;
}

// Component-based currency display for NumberFormatter features
export const CurrencyFormatter = memo<CurrencyFormatterProps>(({ value, prefix, thousandSeparator, ...props }) => (
  <NumberFormatter prefix={prefix || '₹'} value={value} thousandSeparator={thousandSeparator} {...props} />
));
