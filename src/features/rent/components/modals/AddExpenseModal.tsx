import { useState } from 'react';
import { NumberInput, Stack, Text, Button, Group, ActionIcon, Alert, Textarea, rem } from '@mantine/core';
import { SharedModal } from '../../../../shared/components/SharedModal';
import { notifications } from '@mantine/notifications';
import { IconClose } from '../../../../shared/components/icons';

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

        <Stack gap='lg'>
          {expenses.map((expense, index) => (
            <Group key={index} align='flex-start' justify='space-between'>
              <Textarea
                label={index === 0 ? 'Description' : undefined}
                placeholder='Enter expense description'
                value={expense.description}
                onChange={(event) => updateExpenseItem(index, 'description', event.currentTarget?.value ?? '')}
                flex={2}
                autosize
                minRows={1}
              />
              <NumberInput
                label={index === 0 ? 'Amount' : undefined}
                placeholder='Amount'
                value={expense.amount}
                onChange={(value) => updateExpenseItem(index, 'amount', Number(value) || 0)}
                prefix='₹'
                min={0}
                flex={1}
                hideControls
              />
              {/* {expenses.length > 1 && (
                <ActionIcon color='red' variant='filled' onClick={() => removeExpenseItem(index)} flex={0} size={16}>
                  <IconClose size={16} />
                </ActionIcon>
              )} */}
            </Group>
          ))}
        </Stack>

        <Group gap='xs'>
          <Button
            variant='light'
            size='xs'
            style={{ height: `${rem(28)}` }}
            onClick={addExpenseItem}
            flex={1}
            leftSection='+'>
            Add Another Expense
          </Button>
          <ActionIcon
            color='red'
            variant='light'
            size={rem(28)}
            onClick={() => removeExpenseItem(expenses.length - 1)}
            disabled={expenses.length <= 1}>
            <IconClose size={'70%'} />
          </ActionIcon>
        </Group>

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
