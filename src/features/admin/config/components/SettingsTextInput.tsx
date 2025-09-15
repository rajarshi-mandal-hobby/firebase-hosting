import { TextInput, Loader, type TextInputProps } from '@mantine/core';

interface SettingsTextInputProps extends Omit<TextInputProps, 'value' | 'onChange' | 'name'> {
  form: any; // mantine form instance (useForm return). Keep as any to avoid tight coupling here.
  name: string;
  loading?: boolean;
  saving?: boolean;
}

export const SettingsTextInput = ({ 
  form, 
  name, 
  loading = false,
  saving = false,
  disabled,
  size = 'sm',
  required = true,
  ...props 
}: SettingsTextInputProps) => {
  const inputProps = form.getInputProps(name) as any;
  
  return (
    <TextInput
      key={form.key(name)}
      size={size}
      required={required}
      rightSection={loading ? <Loader size={16} /> : undefined}
      disabled={loading || saving || disabled}
      {...inputProps}
      {...props}
    />
  );
};
