import type { UseFormReturnType } from '@mantine/form';
import { IconClose, IconUndo } from '../icons';
import { type MouseEvent } from 'react';

type FormPath<FormShape> = Parameters<UseFormReturnType<FormShape>['setFieldValue']>[0];

export function getInputResetProps<FormShape>(form: UseFormReturnType<FormShape>, path: FormPath<FormShape>) {
    const getNestedValue = (obj: any, pathString: string) => {
        return pathString.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const initialValue = getNestedValue(form.getInitialValues(), path as string);
    const isFieldDirty = form.isDirty(path as string);

    return {
        rightSection:
            isFieldDirty ?
                initialValue ? <IconUndo />
                :   <IconClose />
            :   undefined,
        rightSectionProps: {
            onClick: (e: MouseEvent) => {
                e.preventDefault();
                form.resetField(path);
                form.setDirty({ [path]: false });

                setTimeout(() => {
                    form.getInputNode(path)?.focus();
                }, 0);
            },
            style: { cursor: 'pointer' }
        }
    };
}

/**
 * Updates multiple form fields with full TypeScript auto-complete.
 */
export const setFormValues = <T, K extends keyof T>(form: UseFormReturnType<T>, fields: Pick<T, K>) => {
    Object.entries(fields).forEach(([key, value]) => {
        form.setFieldValue(key, value as any);
    });
};
