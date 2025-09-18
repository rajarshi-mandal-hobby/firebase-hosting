import { NumberFormatter, type NumberFormatterProps } from '@mantine/core';
import { memo } from 'react';

interface MyCurrencyFormatterProps extends Omit<NumberFormatterProps, 'prefix'> {
  value?: number;
}

// Component-based currency display for NumberFormatter features
export const CurrencyFormatter = memo<MyCurrencyFormatterProps>(({ value, ...props }) => (
  <NumberFormatter prefix={'₹'} value={value} {...props} />
));
