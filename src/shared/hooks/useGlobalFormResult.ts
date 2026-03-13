import type { UseFormReturnType } from '@mantine/form';
import { useEffect, useEffectEvent } from 'react';
import type { Member, SaveResult } from '../../data/types';

interface UseGlobalFormResultProps<T> {
    form: UseFormReturnType<T>;
    selectedMember: Member | null;
    opened: boolean;
    onClose: () => void;
    onResetState: () => void;
    initial: T;
    values: T | null;
    error: string | null;
    saveResult: SaveResult | null;
    isPending: boolean;
}

export const useGlobalFormResult = <T>({
    form,
    selectedMember,
    opened,
    onClose,
    onResetState,
    initial,
    values,
    error,
    saveResult,
    isPending
}: UseGlobalFormResultProps<T>) => {
    const otherErrors =
        (saveResult?.success === false && (saveResult.errors.root?.[0] || saveResult.errors.other?.[0])) || null;

    const setupForm = useEffectEvent(() => {
        if (!selectedMember && !opened) return;

        if (!values) {
            const isDifferent = JSON.stringify(form.getValues()) !== JSON.stringify(initial);

            if (isDifferent) {
                console.log('Setting initial values', saveResult);
                form.setValues(initial);
                form.resetDirty();
            }
            return;
        }

        const isDifferent = JSON.stringify(form.getValues()) !== JSON.stringify(values);
        console.log('Are values different', isDifferent);

        if (isDifferent) {
            console.log('Values are different');
            form.setValues(values || initial);
            if (saveResult?.success === false || !!error) form.setInitialValues(initial);
        }

        if (!saveResult) return;

        if (saveResult.success) {
            console.log('Result success');
            onResetState();
            onClose();
        } else if (saveResult.errors.nested) {
            form.setErrors(saveResult.errors.nested);
        }
    });

    useEffect(() => {
        setupForm();
    }, [opened, error, isPending, values]);

    return otherErrors;
};
