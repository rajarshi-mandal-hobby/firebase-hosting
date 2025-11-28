import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  Stack,
  Text,
  Button,
  Group,
  ActionIcon,
  Alert,
  Textarea,
  Modal,
  Paper,
  Input,
  CloseIcon,
  Title,
  LoadingOverlay,
  rem,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import type { Expense } from '../../../../shared/types/firestore-types';
import { formatNumberIndianLocale, formatNumberWithOrdinal } from '../../../../shared/utils';
import { useForm } from '@mantine/form';
import { IconAdd, IconUndo } from '../../../../shared/icons';

interface AddExpenseModalProps {
  opened: boolean;
  onClose: () => void;
  memberName?: string;
  initialExpenses?: Expense[];
}

type FormExpenses = {
  expenses: {
    description: string;
    amount: number | string;
  }[];
};

export function AddExpenseModal({ opened, onClose, memberName = '', initialExpenses = [] }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);

  // ========== Form Setup ==========
  const form = useForm<FormExpenses>({
    initialValues: {
      expenses: [
        {
          description: '',
          amount: '',
        },
      ],
    },
    validate: {
      expenses: {
        description: (value, values, fieldName) => {
          const index = Number(fieldName.match(/\d+/)?.[0] ?? -1);
          const trimmed = value.trim();
          const rawAmount = values.expenses[index]?.amount ?? '';
          const amountNum = Number(rawAmount.toString().trim() || '0');

          const hasInitial = initialExpenses.length > 0;

          // If there were initial expenses:
          // - fully empty row is allowed (meaning "I will remove this expense")
          // - but if amount is non-zero, description must be present
          if (hasInitial) {
            const bothEmpty = !trimmed && (rawAmount === '' || amountNum === 0);
            if (bothEmpty) return null;

            if (amountNum !== 0 && !trimmed) {
              return 'Description is required when amount is non-zero';
            }
            // If description is present, we'll validate amount in amount validator
            return null;
          }

          // If there were NO initial expenses:
          // both fields are required
          if (!trimmed) {
            return 'Description is required';
          }

          return null;
        },
        amount: (value, values, fieldName) => {
          const index = Number(fieldName.match(/\d+/)?.[0] ?? -1);
          const raw = value?.toString().trim() ?? '';
          const num = Number(raw || '0');
          const desc = values.expenses[index]?.description.trim() ?? '';

          const hasInitial = initialExpenses.length > 0;

          // If there were initial expenses:
          // - fully empty row is allowed (meaning "I will remove this expense")
          // - if description is present, amount must be non-zero
          // - if amount is non-zero, description must be present (handled in description validator)
          if (hasInitial) {
            const bothEmpty = (!raw || num === 0) && !desc;
            if (bothEmpty) return null;

            if (desc && (!raw || num === 0)) {
              return 'Amount cannot be zero';
            }

            // Also forbid explicit 0 when something is entered
            if (raw && num === 0) {
              return 'Amount cannot be zero';
            }

            // Positive or negative is allowed
            return null;
          }

          // If there were NO initial expenses:
          // both fields required and amount must be non-zero
          if (!raw) {
            return 'Amount is required';
          }
          if (num === 0 || Number.isNaN(num)) {
            return 'Amount cannot be zero';
          }

          return null;
        },
      },
    },
    transformValues: (values) => ({
      expenses: values.expenses.map((expense) => ({
        description: expense.description.trim(),
        amount: Number(expense.amount),
      })),
    }),
  });

  // ========== Effects ==========
  // Use useEffectEvent to avoid dependency issues
  const effectEvent = useEffectEvent(() => {
    const mapped = initialExpenses.length ? [...initialExpenses] : [{ description: '', amount: '' }];

    form.setValues({ expenses: mapped });
  });

  useEffect(() => {
    effectEvent();
  }, [opened]);

  // ========== State Getters ==========
  const currentExpenses = form.getValues().expenses;

  const totalAmount = currentExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);

  // Count how many *initial* expenses have been effectively removed
  const removedCount = initialExpenses.reduce((count, _initial, index) => {
    const current = currentExpenses[index];
    if (!current) {
      // Row removed from array
      return count + 1;
    }
    const descEmpty = current.description.trim() === '';
    const amountNum = Number(current.amount?.toString().trim() || '0');
    const amountEmpty = !current.amount || amountNum === 0;

    // Both fields empty/zero -> treated as "removed"
    if (descEmpty && amountEmpty) {
      return count + 1;
    }

    return count;
  }, 0);

  const isRemoved = removedCount > 0;

  // ========== Helpers ==========
  const isLastExpenseEntry = (expense: FormExpenses['expenses'][number], index: number): boolean => {
    const expensesLength = currentExpenses.length;
    return (
      expensesLength >= 5 ||
      index !== expensesLength - 1 ||
      (expense.description.trim() === '' && Number(expense.amount) === 0)
    );
  };

  const isExpenseModified = useCallback(
    (expense: FormExpenses['expenses'][number], index: number): boolean => {
      const original = initialExpenses[index];
      if (!original) return true; // New expense
      return expense.description !== original.description || Number(expense.amount) !== original.amount;
    },
    [initialExpenses]
  );

  const isRemovedOrModified = useMemo((): boolean => {
    if (isRemoved) return true;
    for (let i = 0; i < currentExpenses.length; i++) {
      if (isExpenseModified(currentExpenses[i], i)) {
        return true;
      }
    }
    return false;
  }, [isRemoved, currentExpenses, isExpenseModified]);

  // ========== Actions ==========
  const addExpenseItem = (): void => {
    form.setValues({
      expenses: [...currentExpenses, { description: '', amount: '' }],
    });
  };

  const removeExpenseItem = (index: number): void => {
    if (currentExpenses.length > 1) {
      form.setValues({
        expenses: currentExpenses.filter((_, i) => i !== index),
      });
    } else {
      form.setValues({
        expenses: [{ description: '', amount: '' }],
      });
    }
  };

  const updateExpenseItem = (index: number, field: keyof Expense, value: string | number): void => {
    form.setFieldValue(`expenses.${index}.${field}`, value);
  };

  const resetExpenses = (index: number): void => {
    const original = initialExpenses[index];
    if (!original) return;

    form.setFieldValue(`expenses.${index}.description`, original.description);
    form.setFieldValue(`expenses.${index}.amount`, original.amount);
  };

  const clearExpenseField = (index: number, field: keyof Expense): void => {
    updateExpenseItem(index, field, field === 'description' ? '' : '');
  };

  const handleAddExpenses = async (): Promise<void> => {
    setLoading(true);
    try {
      // Mock API call - replace with actual Firebase function call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      notifications.show({
        title: 'Success',
        message: `${currentExpenses.length} expense(s) totaling ${formatNumberIndianLocale(
          totalAmount,
          true
        )} added for ${memberName}`,
        color: 'green',
      });

      onClose();
      form.setValues({ expenses: [{ description: '', amount: '' }] });
    } catch (error) {
      console.error('Error adding expenses:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to add expenses. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== Render ==========
  console.log('🎨 Rendering AddExpenseModal');

  return (
    <Modal opened={opened} onClose={onClose} title='Add Expense for:' centered pos='relative' onExitTransitionEnd={() => form.reset()}>
      <LoadingOverlay visible={loading} />
      <form onSubmit={form.onSubmit(handleAddExpenses)}>
        <Stack gap='lg'>
          <Title order={4}>{memberName}</Title>

          {/* Expenses List */}
          {currentExpenses.map((expense, index) => (
            <Paper key={index} withBorder p='md'>
              {/* Description Input */}
              <Textarea
                autoCapitalize='sentences'
                label={formatNumberWithOrdinal(index + 1) + ' Expense'}
                mb='md'
                placeholder='Repair, Maintenance...'
                minRows={1}
                flex={2}
                autosize
                required={initialExpenses[index] ? false : true}
                rightSection={
                  expense.description.trim() !== '' ? (
                    <Input.ClearButton onClick={() => clearExpenseField(index, 'description')} />
                  ) : undefined
                }
                key={form.key(`expenses.${index}.description`)}
                {...form.getInputProps(`expenses.${index}.description`)}
              />

              {/* Amount Input & Actions */}
              <Group align='flex-start' justify='space-between'>
                <NumberInputWithCurrency
                  w={150}
                  label='Amount'
                  placeholder='Amount'
                  hideControls
                  required={initialExpenses[index] ? false : true}
                  allowNegative
                  allowDecimal={false}
                  rightSection={
                    expense.amount.toString().trim() !== '' ? (
                      <Input.ClearButton onClick={() => clearExpenseField(index, 'amount')} />
                    ) : undefined
                  }
                  key={form.key(`expenses.${index}.amount`)}
                  {...form.getInputProps(`expenses.${index}.amount`)}
                />

                {/* Action Buttons */}
                <Group mt={28} wrap='nowrap'>
                  {/* Reset Button */}
                  {initialExpenses[index] && (
                    <ActionIcon
                      aria-label='Reset Expense'
                      color='gray.3'
                      c={isExpenseModified(expense, index) ? 'var(--mantine-color-text)' : undefined}
                      variant='outline'
                      disabled={!isExpenseModified(expense, index)}
                      size={30}
                      onClick={() => resetExpenses(index)}>
                      <IconUndo size={16} />
                    </ActionIcon>
                  )}

                  {/* Remove Button */}
                  <ActionIcon
                    aria-label='Remove Expense'
                    color='red'
                    variant='light'
                    onClick={() => removeExpenseItem(index)}
                    disabled={currentExpenses.length === 1 && expense.description === '' && expense.amount === ''}
                    size={30}>
                    <CloseIcon size='16' />
                  </ActionIcon>

                  {/* Add Button */}
                  <ActionIcon
                    aria-label='Add Expense'
                    color='gray.3'
                    c={isLastExpenseEntry(expense, index) ? undefined : 'var(--mantine-color-text)'}
                    variant='outline'
                    onClick={addExpenseItem}
                    disabled={isLastExpenseEntry(expense, index)}
                    size={30}>
                    <IconAdd size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}

          {/* Summary Alert */}
          <Alert
            color='orange'
            title='Expense Summary'
            styles={{
              title: { fontSize: rem(16) },
            }}>
            <Text size='sm'>
              Total: <strong>{formatNumberIndianLocale(totalAmount)}</strong>
            </Text>
            {/* Check if initialExpenses are removed */}
            {isRemoved && (
              <Text size='sm' mt={4}>
                You are about to remove {removedCount} existing expense
                {removedCount > 1 ? 's' : ''}.
              </Text>
            )}
          </Alert>

          {/* Footer Actions */}
          <Group gap='sm' justify='flex-end'>
            <Button variant='default' onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type='submit' loading={loading} disabled={loading || !isRemovedOrModified}>
              {isRemovedOrModified ? 'Update Expenses' : 'Add expenses'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
