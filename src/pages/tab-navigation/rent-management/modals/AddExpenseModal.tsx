import { Stack, Divider, Textarea, Group, ActionIcon, Paper, Collapse, Button, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { ACTION_BUTTON_SIZE, type Member } from '../../../../data/types';
import {
    MyLoadingOverlay,
    ErrorAlert,
    MemberPaymentDetails,
    GroupSpaceApart,
    NumberInputWithCurrency,
    MyAlert,
    GroupTable,
    StatusThemeIcon,
    GroupIcon,
    GroupButtons
} from '../../../../shared/components';
import { IconClose, IconAdd_2 } from '../../../../shared/icons';
import { formatNumberWithOrdinal, getInputResetProps, toIndianLocale } from '../../../../shared/utils';
import { useAddExpenseModal } from './hooks/useAddExpenseModal';

interface AddExpenseModalProps {
    member: Member;
}
export function AddExpenseModal({ member }: AddExpenseModalProps) {
    const {
        form,
        totalExpenseAmount,
        expensesState: {
            isRemoved,
            itemsRemovedAtPos,
            isModified,
            removedCount,
            modifiedCount,
            newOutstanding,
            newStatus,
            newTotalCharge: newTotalRent
        },
        actions: {
            formValues,
            removeExpenseItem,
            addExpenseItem,
            isLastExpenseEntry,
            resetRemoved,
            resetForm,
            handleOnSubmit
        },
        isPending,
        hasPreviousExpenses,
        hasError
    } = useAddExpenseModal(member);

    const isSubmitButtonDisabled = isPending || !form.isDirty();

    console.log('🎨 Rendering Add Expense form', isModified);

    return (
        <form onSubmit={form.onSubmit(handleOnSubmit)}>
            <Stack gap='lg' pos='relative'>
                <MyLoadingOverlay visible={isPending} />

                <ErrorAlert
                    message='Error while recording payment!'
                    visible={hasError}
                    withCloseButton
                    onClose={resetForm}
                />

                <MemberPaymentDetails member={member} />

                {/* Expenses List */}
                {formValues().map((expense, index) => (
                    <Stack gap='xs' key={expense.key}>
                        <Divider label={formatNumberWithOrdinal(index + 1) + ' Expense'} />
                        {/* Description Input */}
                        <Textarea
                            autoCapitalize='sentences'
                            label={formatNumberWithOrdinal(index + 1) + ' Description'}
                            placeholder='Repair, Maintenance...'
                            minRows={1}
                            autosize
                            required={itemsRemovedAtPos[index] === undefined}
                            key={form.key(`expenses.${index}.description`)}
                            {...getInputResetProps(form, `expenses.${index}.description`)}
                            {...form.getInputProps(`expenses.${index}.description`)}
                        />

                        {/* Amount Input & Actions */}
                        <GroupSpaceApart align='flex-end'>
                            <NumberInputWithCurrency
                                w={150}
                                label='Amount'
                                placeholder='Amount'
                                hideControls
                                required
                                allowNegative
                                allowDecimal={false}
                                key={form.key(`expenses.${index}.amount`)}
                                {...getInputResetProps(form, `expenses.${index}.amount`)}
                                {...form.getInputProps(`expenses.${index}.amount`)}
                            />

                            {/* Action Buttons */}
                            <Group wrap='nowrap'>
                                {/* Remove Button */}
                                <ActionIcon
                                    aria-label={`Remove Expense ${index + 1}`}
                                    color='red'
                                    variant='my-light'
                                    onClick={() => removeExpenseItem(index)}
                                    disabled={index === 0 && expense.description === '' && expense.amount === ''}
                                    size={ACTION_BUTTON_SIZE}
                                >
                                    <IconClose />
                                </ActionIcon>

                                {/* Add Button */}
                                <ActionIcon
                                    aria-label={`Add Expense ${index + 1}`}
                                    onClick={addExpenseItem}
                                    disabled={isLastExpenseEntry(expense, index)}
                                    size={ACTION_BUTTON_SIZE}
                                >
                                    <IconAdd_2 />
                                </ActionIcon>
                            </Group>
                        </GroupSpaceApart>
                    </Stack>
                ))}

                {/* Summary Alert */}
                <MyAlert iconName='info' title='Expense Summary'>
                    <Stack gap='xs'>
                        <GroupTable
                            iconName='universal_currency_alt'
                            label='Total Expenses'
                            value={toIndianLocale(totalExpenseAmount)}
                            valueFw={700}
                        />

                        <GroupTable
                            iconName='universal_currency_alt'
                            label='New Outstanding'
                            value={toIndianLocale(newOutstanding)}
                            valueFw={700}
                        />

                        <GroupTable
                            iconName='universal_currency_alt'
                            label='New Charges'
                            value={toIndianLocale(newTotalRent)}
                            valueFw={700}
                        />

                        <GroupTable
                            icon={<StatusThemeIcon paymentStatus={newStatus} />}
                            label='New Status'
                            value={newStatus}
                            valueFw={700}
                        />
                    </Stack>

                    {/* Check if initialExpenses are removed */}
                    <Paper p='xs' mt='sm'>
                        <Text fw={700} size='xs'>
                            Note:
                        </Text>
                        <Text size='xs'>Set amount to 0 to remove a expense. Any previous note will be removed.</Text>
                        <Collapse expanded={isRemoved || isModified}>
                            <Divider my='xs' />
                            <GroupIcon>
                                <Stack gap={0} flex={1} key={isRemoved ? 'remove' : 'modify'}>
                                    <Text c='red' fw={700} size='xs'>
                                        Warning!
                                    </Text>
                                    <Text size='xs'>
                                        You are about to <strong>{isRemoved ? 'remove' : 'modify'}</strong>{' '}
                                        {isRemoved ? removedCount : modifiedCount} existing expense
                                        {isRemoved ?
                                            removedCount > 1 ?
                                                's'
                                            :   ''
                                        : modifiedCount > 1 ?
                                            's'
                                        :   ''}
                                        .
                                    </Text>
                                </Stack>

                                <Button
                                    size='xs'
                                    onClick={(e) => {
                                        e.currentTarget.blur();
                                        resetRemoved();
                                    }}
                                >
                                    Reset
                                </Button>
                            </GroupIcon>
                        </Collapse>
                    </Paper>
                </MyAlert>

                {/* Footer Actions */}
                <GroupButtons>
                    <Button variant='transparent' onClick={() => modals.close(member.id)}>
                        Close
                    </Button>
                    <Button type='submit' disabled={isSubmitButtonDisabled}>
                        {`${hasPreviousExpenses ? 'Update' : 'Add'} Expense`}
                    </Button>
                </GroupButtons>
            </Stack>
        </form>
    );
}
