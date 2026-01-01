import { Input } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

export const FormClearButton = <T,>({
    field,
    form
}: {
    field: Parameters<UseFormReturnType<T>["setFieldValue"]>[0];
    form: UseFormReturnType<T>;
}) => {
    const value = form.values[field as keyof T];
    console.log(value);
    return value && value.toString().trim().length > 0 ?
            <Input.ClearButton onClick={() => form.setFieldValue(field, "" as any)} />
        :	null;
};