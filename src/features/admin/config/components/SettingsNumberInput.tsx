import { NumberInput, Loader } from '@mantine/core';
import type { NumberInputProps } from '@mantine/core';
import { forwardRef } from 'react';

// Remove ref from props interface, let forwardRef handle it
export const SettingsNumberInput = forwardRef<HTMLInputElement, NumberInputProps>(({ disabled, ...props }, ref) => (
  <NumberInput
    leftSection='₹'
    required
    rightSection={disabled ? <Loader size={16} /> : undefined}
    ref={ref}
    disabled={disabled}
    {...props} // includes defaultValue, name, etc. from form.getInputProps
  />
));
SettingsNumberInput.displayName = 'SettingsNumberInput';
