import React from 'react';
import { NumberInput } from '@mantine/core';

interface ConfigNumberInputProps {
  label: string;
  description: string;
  value: string | number;
  onChange: (value: string | number) => void;
  onBlur?: () => void;
  disabled: boolean;
  fieldPath: string;
  placeholder: string;
  getFieldError: (path: string) => string | undefined;
  isFieldUnset: (value: string | number | undefined, allowZero?: boolean) => boolean;
  showValidationErrors: boolean;
  allowZero?: boolean;
}

const ConfigNumberInput: React.FC<ConfigNumberInputProps> = ({
  label,
  description,
  value,
  onChange,
  onBlur,
  disabled,
  fieldPath,
  placeholder,
  getFieldError,
  isFieldUnset,
  showValidationErrors,
  allowZero = false,
}) => {
  return (
    <NumberInput
      label={label}
      description={description}
      value={value || ''}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      size="sm"
      hideControls
      min={0}
      required
      placeholder={placeholder}
      error={
        getFieldError(fieldPath) ||
        (isFieldUnset(value, allowZero) && showValidationErrors
          ? 'This field is required'
          : undefined)
      }
    />
  );
};

export default ConfigNumberInput;
