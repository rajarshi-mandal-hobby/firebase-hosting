import type { UseFormReturnType } from '@mantine/form';
import { IconUndo, IconClose } from '../icons';

export const formCloseIconProps = <T,>(
    form: UseFormReturnType<T>,
    field: Parameters<UseFormReturnType<T>['isDirty']>[0]
) => {
    if (!field) return {};

    const initialValues = form.getInitialValues();
    const initialValue = (initialValues as any)[field];
    const isDirty = form.isDirty(field);
    const icon =
        isDirty ?
            initialValue ? <IconUndo />
            :   <IconClose />
        :   undefined;

    return {
        rightSection: icon,
        rightSectionWidth: icon && 34,
        rightSectionProps: icon && {
            onClick: () => form.setFieldValue(field, initialValue),
            style: { cursor: 'pointer' }
        }
    };
};
