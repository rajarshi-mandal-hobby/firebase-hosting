import { Stack, Paper, Textarea, Group, ActionIcon, Alert, Button, Text, Divider, Collapse } from '@mantine/core';
import { GroupButtons, GroupIcon, GroupSpaceApart, NumberInputWithCurrency } from '../../../../../../shared/components';
import { IconUndo, IconAdd, IconUniversalCurrency, IconClose } from '../../../../../../shared/icons';
import { formatNumberWithOrdinal, toIndianLocale } from '../../../../../../shared/utils';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../../../../data/types';
import { type GlobalModalProps, GlobalModal } from '../../../../../../shared/components/GlobalModal';
import { useAddExpenseModal } from './hooks/useAddExpenseModal';

export const AddExpenseModal = ({ opened, onClose }: GlobalModalProps) => {
    const {
        form,
        currentExpenses,
        previousExpensesCache,
        totalAmount,
        removedCount,
        listKey,
        isRemovedOrModified,
        isRemoved,
        hasPreviousExpenses,
        actions: {
            handleOnSubmit,
            resetExpenses,
            removeExpenseItem,
            addExpenseItem,
            isLastExpenseEntry,
            resetRemoved,
            resetForm
        },
        hasError,
        otherErrors,
        isPending
    } = useAddExpenseModal({ opened, onClose });

    const isSubmitButtonDisabled = isPending || !form.isDirty() || !isRemovedOrModified;

    console.log('🎨 Rendering AddExpenseModal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Add Expense'
            isPending={isPending}
            hasErrorForMemeber={hasError}
            onResetError={resetForm}
            otherErrors={otherErrors}
        >
            <form onSubmit={form.onSubmit(handleOnSubmit)}>
                <Stack gap='lg'>
                    {/* Expenses List */}
                    {currentExpenses.map((expense, index) => (
                        <Stack gap='xs' key={index + '_expense_' + listKey} mb='sm'>
                            <Divider label={formatNumberWithOrdinal(index + 1) + ' Expense'} />
                            {/* Description Input */}
                            <Textarea
                                autoCapitalize='sentences'
                                label={formatNumberWithOrdinal(index + 1) + ' Description'}
                                placeholder='Repair, Maintenance...'
                                minRows={1}
                                flex={2}
                                autosize
                                required={!isRemoved}
                                key={form.key(`expenses.${index}.description`)}
                                {...form.getInputProps(`expenses.${index}.description`)}
                            />

                            {/* Amount Input & Actions */}
                            <GroupSpaceApart>
                                <NumberInputWithCurrency
                                    w={150}
                                    label='Amount'
                                    placeholder='Amount'
                                    hideControls
                                    required={!isRemoved}
                                    allowNegative
                                    allowDecimal={false}
                                    key={form.key(`expenses.${index}.amount`)}
                                    {...form.getInputProps(`expenses.${index}.amount`)}
                                />

                                {/* Action Buttons */}
                                <Group mt={28} wrap='nowrap'>
                                    {/* Reset Button */}
                                    {previousExpensesCache[index] && (
                                        <ActionIcon
                                            aria-label='Reset Expense'
                                            variant='default'
                                            disabled={
                                                !(
                                                    previousExpensesCache[index].description !== expense.description ||
                                                    previousExpensesCache[index].amount !== expense.amount
                                                )
                                            }
                                            size={ACTION_BUTTON_SIZE}
                                            onClick={() => resetExpenses(index)}
                                        >
                                            <IconUndo size={ACTION_ICON_SIZE} />
                                        </ActionIcon>
                                    )}

                                    {/* Remove Button */}
                                    <ActionIcon
                                        aria-label='Remove Expense'
                                        color='red'
                                        variant='light'
                                        onClick={() => removeExpenseItem(index)}
                                        disabled={index === 0 && expense.description === '' && expense.amount === ''}
                                        size={ACTION_BUTTON_SIZE}
                                    >
                                        <IconClose size={ACTION_ICON_SIZE} />
                                    </ActionIcon>

                                    {/* Add Button */}
                                    <ActionIcon
                                        aria-label='Add Expense'
                                        onClick={addExpenseItem}
                                        disabled={isLastExpenseEntry(expense, index)}
                                        size={ACTION_BUTTON_SIZE}
                                    >
                                        <IconAdd size={ACTION_ICON_SIZE} />
                                    </ActionIcon>
                                </Group>
                            </GroupSpaceApart>
                        </Stack>
                    ))}

                    {/* Summary Alert */}
                    <Alert color='orange' title='Expense Summary'>
                        <GroupIcon>
                            <IconUniversalCurrency />
                            <Text>Total Amount:</Text>
                            <Text fw={500}>{toIndianLocale(totalAmount)}</Text>
                        </GroupIcon>

                        {/* Check if initialExpenses are removed */}
                        <Collapse in={isRemoved}>
                            <Paper p='xs' mt='sm'>
                                <GroupIcon>
                                    <Text size='xs'>
                                        <span style={{ fontWeight: 700, color: 'red' }}>Warning!</span> You are about to
                                        remove {removedCount} existing expense
                                        {removedCount > 1 ? 's' : ''}.
                                    </Text>
                                    <Button size='xs' onClick={resetRemoved} w={100} hidden={!isRemoved}>
                                        Reset
                                    </Button>
                                </GroupIcon>
                            </Paper>
                        </Collapse>
                    </Alert>

                    {/* Footer Actions */}
                    <GroupButtons>
                        <Button variant='transparent' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit' disabled={isSubmitButtonDisabled}>
                            {hasPreviousExpenses && isRemovedOrModified ? 'Update Expenses' : 'Add expenses'}
                        </Button>
                    </GroupButtons>
                </Stack>
            </form>
        </GlobalModal>
    );
};
