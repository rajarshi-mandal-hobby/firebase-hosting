import { useForm } from '@mantine/form';
import { randomId } from '@mantine/hooks';
import { closeAllModals } from '@mantine/modals';
import { doc } from 'firebase/firestore';
import { useState, startTransition, useEffectEvent, useEffect } from 'react';
import { type Member, type PaymentStatus, type RentHistory, DB } from '../../../../../data/types';
import { runTransactionWrapper, db } from '../../../../../firebase';
import {
    getMemberFirstname,
    getPaymentStatus,
    isSentence,
    notifyError,
    notifyLoading,
    notifySuccess,
    toIndianLocale,
    toNumber
} from '../../../../../shared/utils';
import { useFormStore } from '../../../../admin-dashboard/hooks/useFormStore';

interface FormExpenses {
    expenses: { description: string; amount: number | string; key: string }[];
}

const calculateExpense = (expenses: FormExpenses['expenses']) =>
    expenses.reduce((sum, { amount }) => sum + toNumber(amount), 0);

const getIndex = (field: string) => toNumber(field.split('.')[1] ?? -1);

export function useAddExpenseModal(member: Member) {
    const previousExpenses = member.currentMonthRent.adjustments.map((e) => ({ ...e, key: randomId() }));
    const hasPreviousExpenses = previousExpenses.length > 0;

    const memberId = member.id;
    const memberName = member.name;

    const [totalExpenseAmount, setTotalExpenseAmount] = useState(() => calculateExpense(previousExpenses));
    const { isGlobalPending, retrieveFormState, onFormSubmit, onFormError, clearFormState } =
        useFormStore<FormExpenses>();
    const formState = retrieveFormState('add_expense', memberId);
    const draft = formState?.draft;
    const isPending = !!formState?.isPending || isGlobalPending;
    const hasError = !!formState?.hasError;
    const clearState = () => clearFormState('add_expense', memberId);

    const form = useForm<FormExpenses>({
        mode: 'uncontrolled',
        initialValues: {
            expenses: hasPreviousExpenses ? previousExpenses : [{ amount: '', description: '', key: randomId() }]
        },
        validate: {
            expenses: {
                amount(value, _values, path, _signal) {
                    if (typeof value === 'string') return 'Amount is required';
                    const idx = getIndex(path);
                    // If the index is greater than the number of previous expenses, it means it is a new expense.
                    // So, we need to check if the amount is 0.
                    if (idx > previousExpenses.length - 1) {
                        return value === 0 ? 'Amount cannot be 0 for a new expense!' : null;
                    }

                    return null;
                },
                description(value, values, path, _signal) {
                    const isWord = isSentence(value.trim());
                    const idx = getIndex(path);
                    const err = 'Description too short!';
                    // If the index is greater than the number of previous expenses, it means it is a new expense.
                    // So, we need to check if the description is empty.
                    if (idx > previousExpenses.length - 1) {
                        return isWord ? null : err;
                    } else {
                        const num = values.expenses[idx].amount;
                        // For previous expenses, decription is required
                        // unless it is removed by typing zero for the amount.
                        if (typeof num === 'number' && num !== 0 && !isWord) return err;
                    }

                    return null;
                }
            }
        },
        transformValues({ expenses: exp }) {
            return {
                expenses: exp.map((e) => ({
                    ...e,
                    description: e.description.trim(),
                    amount: toNumber(e.amount)
                }))
            };
        },
        onValuesChange({ expenses }) {
            startTransition(() => {
                // Check if previous expenses amount is set to zero
                expenses.forEach((exp, i) => {
                    if (i < previousExpenses.length && exp.amount === 0 && exp.description.trim() !== '') {
                        form.setFieldValue(`expenses.${i}.description`, '');
                    }
                });

                setTotalExpenseAmount(() => calculateExpense(expenses));
            });
        }
    });

    const evnt = useEffectEvent(() => {
        if (draft) {
            form.setValues(draft);
        }
    });

    useEffect(() => {
        evnt();
    }, []);

    const expensesState = form.getValues().expenses.reduce(
        (acc, exp, i) => {
            const { totalCharges, amountPaid } = member.currentMonthRent;
            const prevExp = previousExpenses[i];

            // Guard clause in case arrays do not match in length
            if (!prevExp) {
                return {
                    ...acc,
                    newTotalCharge: totalCharges + totalExpenseAmount,
                    newOutstanding: totalCharges + totalExpenseAmount - amountPaid,
                    newStatus: getPaymentStatus(amountPaid, totalCharges + totalExpenseAmount)
                };
            }

            // Core comparison flags for the current item
            const isAmountChanged = prevExp.amount !== exp.amount;
            const isDescChanged = exp.description.trim().toLowerCase() !== prevExp.description.trim().toLowerCase();

            const itemRemoved = isAmountChanged && exp.amount === 0;
            const itemModified = isAmountChanged || isDescChanged;

            // Update tracking totals directly without creating new objects
            if (itemRemoved) {
                acc.isRemoved = true;
                acc.removedCount += 1;
                acc.itemsRemovedAtPos.push(i);
            }

            if (itemModified) {
                acc.isModified = true; // Fixed typo
                acc.modifiedCount += 1;
                acc.itemsModifiedAtPos.push(i);
            }

            const prevExpTotal = calculateExpense(previousExpenses);
            acc.newTotalCharge = totalCharges + totalExpenseAmount - prevExpTotal;
            acc.newOutstanding = acc.newTotalCharge - amountPaid;
            acc.newStatus = getPaymentStatus(amountPaid, acc.newTotalCharge);

            return acc;
        },
        {
            newTotalCharge: 0,
            newOutstanding: 0,
            newStatus: 'Paid' as PaymentStatus,
            isModified: false,
            isRemoved: false,
            removedCount: 0,
            modifiedCount: 0,
            itemsRemovedAtPos: [] as number[],
            itemsModifiedAtPos: [] as number[]
        }
    );

    const save = async (payload: FormExpenses) => {
        onFormSubmit(payload, 'add_expense', { memberId, memberName });

        const memberFirstname = getMemberFirstname(memberName);

        const notifyId = notifyLoading(`Adding expense...`);

        const memberNote = member.currentMonthRent.note.trim();
        const noteHasPeriodAtEnd = memberNote.endsWith('.');

        const transactionData = {
            currentMonthRent: {
                ...member.currentMonthRent,
                adjustments: payload.expenses
                    .filter((e) => e.amount !== 0)
                    .map((e) => ({
                        description: e.description,
                        amount: toNumber(e.amount)
                    })),
                totalCharges: expensesState.newTotalCharge,
                outstanding: expensesState.newOutstanding,
                paymentStatus: expensesState.newStatus,
                note:
                    expensesState.isRemoved && expensesState.newOutstanding < 0 ?
                        memberNote
                        + `${noteHasPeriodAtEnd ? '' : '.'} Previous expense of ${toIndianLocale(calculateExpense(previousExpenses))} has been removed`
                    :   memberNote
            } satisfies RentHistory
        };

        await runTransactionWrapper(
            async (t) => {
                t.update(doc(db, DB.memberCol, member.id), transactionData);

                notifySuccess('Added expenses!', {
                    id: notifyId,
                    update: true
                });
                clearState();
                closeAllModals();
            },
            (error) => {
                notifyError((error as Error).message, {
                    title: `${formState?.formName}: ${memberFirstname}`,
                    id: notifyId,
                    update: true
                });
                onFormError('add_expense', memberId);
            }
        );
    };

    const actions = {
        formValues() {
            return form.getValues().expenses;
        },
        addExpenseItem() {
            const newExpense = { description: '', amount: '', key: randomId() };
            form.insertListItem('expenses', newExpense);
            // Reset the new item's dirty state at the end to prevent it from being marked as dirty on insert.
            form.resetDirty({
                expenses: [...previousExpenses, newExpense]
            });
        },
        removeExpenseItem(i: number) {
            const formVals = actions.formValues();
            // The form should show at least one expense item.
            if (formVals.length > 1) {
                // If there are more expenses added than the initial ones, remove that item.
                form.removeListItem('expenses', i);
            } else {
                // Otherwise, replace the first expense item with an empty one
                form.replaceListItem('expenses', i, { key: randomId(), description: '', amount: '' });
            }
        },
        resetRemoved() {
            // 1. Pre-calculate sets of all previous amounts and descriptions for instant O(1) lookups
            const prevAmounts = new Set(previousExpenses.map((p) => p.amount));
            const prevDescriptions = new Set(previousExpenses.map((p) => p.description));

            // 2. Filter expenses that are not present in the previous expenses
            const currentExp = actions
                .formValues()
                .filter(
                    (exp) =>
                        prevAmounts.has(exp.amount as any) === false && prevDescriptions.has(exp.description) === false
                );

            // 3. Combine arrays, remove empty rows, and inject keys for React to identify the expenses and prevent re-rendering
            const merged = [...previousExpenses, ...currentExp].filter((e) => e.description && e.amount);
            form.setValues({ expenses: merged });
            form.resetDirty({
                expenses: previousExpenses
            });
        },
        resetForm() {
            form.reset();
            clearState();
        },
        isLastExpenseEntry(exp: FormExpenses['expenses'][number], i: number) {
            const valuesLength = actions.formValues().length;
            const notPreviousExp = expensesState.itemsRemovedAtPos[i] === undefined;
            return (
                valuesLength >= 5
                || i !== valuesLength - 1
                || (notPreviousExp && !exp.description.trim())
                || (notPreviousExp && !exp.amount)
            );
        },
        handleOnSubmit(values: FormExpenses) {
            startTransition(async () => save(values));
        }
    };

    return {
        form,
        totalExpenseAmount,
        expensesState,
        actions,
        isPending,
        hasPreviousExpenses,
        hasError
    };
}
