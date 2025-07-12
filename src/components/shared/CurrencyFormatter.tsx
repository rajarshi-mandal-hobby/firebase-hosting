import { NumberFormatter, type NumberFormatterProps } from '@mantine/core';

interface CurrencyFormatterProps extends Omit<NumberFormatterProps, 'value' | 'prefix' | 'thousandSeparator'> {
  value?: number;
  prefix?: string;
  thousandSeparator?: boolean;
}

// Component-based currency display for NumberFormatter features
export const CurrencyFormatter: React.FC<CurrencyFormatterProps> = ({ value, prefix, thousandSeparator, ...props }) => (
  <NumberFormatter prefix={prefix || '₹'} value={value} thousandSeparator={thousandSeparator} {...props} />
);
