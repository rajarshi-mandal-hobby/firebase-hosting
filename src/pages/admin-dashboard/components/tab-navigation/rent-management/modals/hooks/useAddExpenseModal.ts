import { useForm } from '@mantine/form';
import { useState, startTransition } from 'react';
import type { GlobalModalProps } from '../../../../../../../shared/components/GlobalModal';
import { toNumber, useGlobalFormResult } from '../../../../../../../shared/utils';
import { useGlobalFormStore } from '../../../../../../../contexts';
import { useRefreshKey } from '../../../../../../../shared/hooks/useRefreshKey';

interface FormExpenses {
    expenses: { description: string; amount: number | string }[];
}

export const useAddExpenseModal = ({ opened, onClose }: GlobalModalProps) => {
    const {
        state: { saveResult, values, error, isPending },
        selectedMember,
        dispatcher,
        onResetState
    } = useGlobalFormStore<FormExpenses>('add-expense');

    const [totalAmount, setTotalAmount] = useState(0);
    const [previousExpensesCache, setPreviousExpensesCache] = useState<FormExpenses['expenses']>([]);
    const [listKey, onUpdateListKey] = useRefreshKey();

    const previousExpenses = selectedMember?.currentMonthRent.expenses ?? [];
    const hasPreviousExpenses = previousExpenses.length > 0;

    const form = useForm<FormExpenses>({
        mode: 'uncontrolled',
        initialValues: { expenses: [{ description: '', amount: '' }] },
        validate: {
            expenses: {
                amount: (value) => {
                    const num = toNumber(value);
                    if (num === 0) return 'Amount must be greater than 0';
                    return null;
                },
                description: (value) => {
                    const str = value.trim();
                    if (!str) return 'Description is required';
                    return null;
                }
            }
        },
        validateInputOnBlur: true,
        transformValues: ({ expenses }) => ({
            expenses: expenses.map((e) => ({
                description: e.description.trim(),
                amount: toNumber(e.amount)
            }))
        }),
        onValuesChange: ({ expenses }) => {
            startTransition(() => setTotalAmount(expenses.reduce((s, e) => s + toNumber(e.amount), 0)));
        }
    });

    const otherErrors = useGlobalFormResult<FormExpenses>({
        form,
        selectedMember,
        opened,
        onClose,
        onResetState,
        initial: {
            expenses: hasPreviousExpenses ? previousExpenses : [{ description: '', amount: '' }]
        },
        values,
        error,
        saveResult,
        isPending
    });

    const currentExpenses = form.getValues().expenses;

    const removedCount =
        opened && hasPreviousExpenses ?
            previousExpenses.filter(
                (_, i) =>
                    !currentExpenses[i] ||
                    (!currentExpenses[i].description.trim() && !toNumber(currentExpenses[i].amount))
            ).length
        :   0;

    const actions = {
        addExpenseItem: () => {
            form.insertListItem('expenses', { description: '', amount: '' });
            onUpdateListKey();
        },
        removeExpenseItem: (i: number) => {
            if (currentExpenses.length > 1) {
                form.removeListItem('expenses', i);
            } else {
                form.replaceListItem('expenses', 0, { description: '', amount: '' });
            }
            setPreviousExpensesCache((p) => p.filter((_, idx) => idx !== i));
            onUpdateListKey();
            form.clearErrors();
        },
        resetExpenses: (i: number) => {
            if (previousExpensesCache[i]) {
                form.replaceListItem('expenses', i, previousExpensesCache[i]);
                onUpdateListKey();
                form.clearErrors();
            }
        },
        resetRemoved: () => {
            const merged = [...form.getInitialValues().expenses, ...currentExpenses].filter(
                (e) => e.description || e.amount
            );
            form.setValues({
                expenses: [...new Map(merged.map((e) => [e.description + e.amount, e])).values()]
            });
            setPreviousExpensesCache(previousExpenses);
            onUpdateListKey();
        },
        resetForm: () => {
            form.reset();
            setPreviousExpensesCache(previousExpenses);
            onUpdateListKey();
            onResetState();
        },
        isLastExpenseEntry: (exp: any, i: number) =>
            currentExpenses.length >= 5 ||
            i !== currentExpenses.length - 1 ||
            !exp.description.trim() ||
            !toNumber(exp.amount),
        handleOnSubmit: (values: FormExpenses) => startTransition(async () => await dispatcher(values))
    };

    return {
        form,
        totalAmount,
        currentExpenses,
        previousExpensesCache,
        removedCount,
        listKey,
        isRemoved: removedCount > 0,
        isRemovedOrModified: removedCount > 0 || form.isDirty(),
        hasPreviousExpenses,
        actions,
        isPending,
        hasError: !!error || !saveResult?.success || !!otherErrors,
        otherErrors
    };
};
