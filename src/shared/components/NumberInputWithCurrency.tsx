import { NumberInput } from '@mantine/core';

// Remove ref from props interface, let forwardRef handle it
export const NumberInputWithCurrency = NumberInput.withProps({
  prefix: '₹ ',
  stepHoldDelay: 500,
  stepHoldInterval: 100,
  step: 100,
  allowNegative: false,
  thousandSeparator: ',',
  thousandsGroupStyle: 'lakh',
  hideControls: true,
});
