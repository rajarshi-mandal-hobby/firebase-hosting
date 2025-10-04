import { NumberFormatter, type NumberFormatterProps } from '@mantine/core';

interface Options extends Omit<NumberFormatterProps, 'prefix'> {
  value?: number;
}

// Component-based currency display for NumberFormatter features
export const CurrencyFormatter = ({ value, ...props }: Options) => (
  <NumberFormatter prefix={'₹'} value={value} {...props} />
);
