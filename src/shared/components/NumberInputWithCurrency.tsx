import { NumberInput, Loader } from '@mantine/core';
import type { NumberInputProps } from '@mantine/core';
import { forwardRef } from 'react';

// Remove ref from props interface, let forwardRef handle it
export const NumberInputWithCurrency = forwardRef<HTMLInputElement, NumberInputProps>(({ disabled, ...props }, ref) => (
  <NumberInput
    leftSection='₹'
    required
    rightSection={disabled ? <Loader size={16} /> : undefined}
    ref={ref}
    disabled={disabled}
    stepHoldDelay={500}
    stepHoldInterval={100}
    {...props} // includes defaultValue, name, etc. from form.getInputProps
  />
));
