import { useForm } from '@mantine/form';
import { useState, startTransition, useEffectEvent, useEffect } from 'react';
import { simulateNetworkDelay } from '../../../../../data/utils/serviceUtils';
import { toNumber } from '../../../../../shared/utils';
import { useGlobalModalManager } from '../../../stores/modal-store';
import type { GlobalModalProps } from '../../../stores/GlobalModal';
import * as v from 'valibot';
import { valibotResolver } from 'mantine-form-valibot-resolver';

const ExpenseSchema = v.pipe(
    v.object({
        description: v.string(),
        amount: v.union([v.string(), v.number()])
    }),
    // Custom logic to handle "Both empty" vs "One filled"
    v.check((input) => {
        const desc = input.description.trim();
        const amt = toNumber(input.amount);

        // Valid if both are empty (for existing entries being "removed")
        // or both are filled. Invalid if only one is provided.
        if (desc && amt === 0) return false;
        if (!desc && amt !== 0) return false;
        return true;
    }, 'Both description and amount are required.')
);

const FormExpensesSchema = v.object({
    expenses: v.array(ExpenseSchema)
});

interface FormExpenses {
    expenses: {
        description: string;
        amount: number | string;
    }[];
}

export const useAddExpenseModal = ({ opened, onClose }: GlobalModalProps) => {
    const modalManager = useGlobalModalManager('addExpense', opened, onClose);
    const {
        selectedMember,
        handleModalWork,
        setModalError,
        clearModalError,
        hasErrorForModal,
        getCachedFormValues,
        isModalWorking
    } = modalManager;

    const [refreshKey, setRefreshKey] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [previousExpensesCache, setPreviousExpensesCache] = useState<FormExpenses['expenses']>([]);

    const previousExpenses = selectedMember?.currentMonthRent?.expenses ?? [];
    const hasPreviousExpenses = previousExpenses.length > 0;

    const form = useForm<FormExpenses>({
        mode: 'uncontrolled',
        initialValues: { expenses: [{ description: '', amount: '' }] },
        validate: valibotResolver(FormExpensesSchema),
        validateInputOnBlur: true,
        transformValues: ({ expenses }) => ({
            expenses: expenses.map((e) => ({ description: e.description.trim(), amount: toNumber(e.amount) }))
        }),
        onValuesChange: ({ expenses }) => {
            startTransition(() => setTotalAmount(expenses.reduce((s, e) => s + toNumber(e.amount), 0)));
        }
    });

    const initForm = useEffectEvent(() => {
        if (!opened || isModalWorking || !selectedMember) return;
        const initial = hasPreviousExpenses ? previousExpenses : [{ description: '', amount: '' }];
        setPreviousExpensesCache(initial);
        form.setValues(hasErrorForModal ? getCachedFormValues() : { expenses: initial });
        form.resetDirty({ expenses: initial });
    });

    useEffect(() => initForm(), [opened]);

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
            setRefreshKey((k) => k + 1);
        },
        removeExpenseItem: (i: number) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            currentExpenses.length > 1 ?
                form.removeListItem('expenses', i)
            :   form.replaceListItem('expenses', 0, { description: '', amount: '' });
            setPreviousExpensesCache((p) => p.filter((_, idx) => idx !== i));
            setRefreshKey((k) => k + 1);
            form.clearErrors();
        },
        resetExpenses: (i: number) => {
            if (previousExpensesCache[i]) {
                form.replaceListItem('expenses', i, previousExpensesCache[i]);
                setRefreshKey((k) => k + 1);
                form.clearErrors();
            }
        },
        resetRemoved: () => {
            const merged = [...form.getInitialValues().expenses, ...currentExpenses].filter(
                (e) => e.description || e.amount
            );
            form.setValues({
                expenses: Array.from(new Map(merged.map((e) => [e.description + e.amount, e])).values())
            });
            setPreviousExpensesCache(previousExpenses);
            setRefreshKey((k) => k + 1);
        },
        resetForm: () => {
            form.reset();
            setPreviousExpensesCache(previousExpenses);
            setRefreshKey((k) => k + 1);
            clearModalError();
        },
        isLastExpenseEntry: (exp: any, i: number) =>
            currentExpenses.length >= 5 ||
            i !== currentExpenses.length - 1 ||
            !exp.description.trim() ||
            !toNumber(exp.amount),
        handleOnSubmit: (values: FormExpenses) =>
            handleModalWork(async () => {
                try {
                    await simulateNetworkDelay(3000);
                    throw new Error('Simulated error');
                    clearModalError()
                } catch (e) {
                    setModalError(values, (e as Error).message);
                }
            })
    };

    return {
        form,
        totalAmount,
        currentExpenses,
        previousExpensesCache,
        removedCount,
        refreshKey,
        isRemoved: removedCount > 0,
        isRemovedOrModified: removedCount > 0 || form.isDirty(),
        hasPreviousExpenses,
        actions,
        ...modalManager
    };
};
