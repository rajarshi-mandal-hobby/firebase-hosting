import { useState } from 'react';
import { NumberInput, Stack, Text, TextInput, Button, Group, ActionIcon, Alert } from '@mantine/core';
import { SharedModal } from '../../../../components/shared/SharedModal';
import { notifications } from '@mantine/notifications';

interface ExpenseItem {
  description: string;
  amount: number;
}

interface AddExpenseModalProps {
  opened: boolean;
  onClose: () => void;
  memberName?: string;
}

export function AddExpenseModal({ opened, onClose, memberName = '' }: AddExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([{ description: '', amount: 0 }]);

  const addExpenseItem = () => {
    setExpenses((prev) => [...prev, { description: '', amount: 0 }]);
  };

  const removeExpenseItem = (index: number) => {
    if (expenses.length > 1) {
      setExpenses((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateExpenseItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setExpenses((prev) => prev.map((expense, i) => (i === index ? { ...expense, [field]: value } : expense)));
  };

  const handleAddExpenses = async () => {
    // Validate expenses
    const validExpenses = expenses.filter((expense) => expense.description.trim() && expense.amount > 0);

    if (validExpenses.length === 0) {
      notifications.show({
        title: 'Validation Error',
        message: 'Please add at least one valid expense with description and amount',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual Firebase function call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const totalAmount = validExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      notifications.show({
        title: 'Success',
        message: `${validExpenses.length} expense(s) totaling ₹${totalAmount.toLocaleString()} added for ${memberName}`,
        color: 'green',
      });

      onClose();
      setExpenses([{ description: '', amount: 0 }]);
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to add expenses. Please try again.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const validExpensesCount = expenses.filter((expense) => expense.description.trim() && expense.amount > 0).length;

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title='Add Expense'
      loading={loading}
      primaryActionText='Add Expenses'
      onPrimaryAction={handleAddExpenses}
      size='md'>
      <Stack gap='md'>
        <Text size='sm' c='dimmed'>
          Adding expenses for <strong>{memberName || 'Selected Member'}</strong>
        </Text>

        <Stack gap='xs'>
          {expenses.map((expense, index) => (
            <Group key={index} align='flex-end'>
              <TextInput
                label={index === 0 ? 'Description' : undefined}
                placeholder='Enter expense description'
                value={expense.description}
                onChange={(event) => updateExpenseItem(index, 'description', event.currentTarget?.value ?? '')}
                style={{ flex: 1 }}
              />
              <NumberInput
                label={index === 0 ? 'Amount' : undefined}
                placeholder='Amount'
                value={expense.amount}
                onChange={(value) => updateExpenseItem(index, 'amount', Number(value) || 0)}
                prefix='₹'
                min={0}
                style={{ width: 120 }}
              />
              {expenses.length > 1 && (
                <ActionIcon
                  color='red'
                  variant='subtle'
                  onClick={() => removeExpenseItem(index)}
                  style={{ marginBottom: index === 0 ? 0 : 0 }}>
                  ×
                </ActionIcon>
              )}
            </Group>
          ))}
        </Stack>

        <Button variant='light' size='xs' onClick={addExpenseItem}>
          + Add Another Expense
        </Button>

        {totalAmount > 0 && (
          <Alert color='blue' title='Expense Summary'>
            <Text size='sm'>
              Total: <strong>₹{totalAmount.toLocaleString()}</strong> ({validExpensesCount} valid expense
              {validExpensesCount !== 1 ? 's' : ''})
            </Text>
          </Alert>
        )}
      </Stack>
    </SharedModal>
  );
}
