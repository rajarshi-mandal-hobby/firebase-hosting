import { Input } from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';

interface FormClearButtonProps<T> {
    field: Parameters<UseFormReturnType<T>['setFieldValue']>[0];
    form: UseFormReturnType<T>;
}

const useFormClearButton = <T,>(props: FormClearButtonProps<T>) => {
    const { field, form } = props;
    const inputProps = form.getInputProps(field);
    const value = inputProps.defaultValue ?? inputProps.value;
    const isDirty = form.isDirty(field);
    const handleClear = () => {
        const node = form.getInputNode(field);
        form.setFieldValue(field, '' as any);
        node?.focus();
    };

    return { value, isDirty, handleClear };
};

export const FormClearButton = <T,>(props: FormClearButtonProps<T>) => {
    const { value, isDirty, handleClear } = useFormClearButton(props);

    return isDirty && value !== '' ? <Input.ClearButton onClick={handleClear} /> : null;
};
