import { Input } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

export const FormClearButton = <T,>({
    field,
    form
}: {
    field: Parameters<UseFormReturnType<T>["setFieldValue"]>[0];
    form: UseFormReturnType<T>;
}) => {
    const inputProps = form.getInputProps(field);
    const value: string | number = inputProps.defaultValue ?? inputProps.value;
    const isDirty = form.isDirty(field);
    const handleClear = () => {
        const node = form.getInputNode(field);
        form.setFieldValue(field, "" as any);
        node?.focus();
    };

    return isDirty && value !== "" ? <Input.ClearButton onClick={handleClear} /> : null;
};
