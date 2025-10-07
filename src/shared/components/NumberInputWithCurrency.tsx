import { NumberInput } from '@mantine/core';
import { IconRupee } from './icons';

// Remove ref from props interface, let forwardRef handle it
export const NumberInputWithCurrency = NumberInput.withProps({
  leftSection: <IconRupee size={16} />,
  stepHoldDelay: 500,
  stepHoldInterval: 100,
  step: 100,
  allowNegative: false,
});
