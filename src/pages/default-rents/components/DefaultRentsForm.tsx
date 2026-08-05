import { Stack, Divider, SimpleGrid, Button, Text, Title, Checkbox, Paper } from '@mantine/core';
import {
    MyLoadingOverlay,
    NumberInputWithCurrency,
    GroupButtons,
    ErrorAlert,
    MyAlert
} from '../../../shared/components/index.ts';
import { useDefaultRentsForm } from './hooks/useDefaultRentsForm.ts';
import type { DefaultRentsFormProps } from '../types/index.ts';
import { getInputResetProps } from '../../../shared/utils/form-utils.tsx';
import { IconDataObject } from '../../../shared/icons/index.tsx';

export const DefaultRentsForm = (props: DefaultRentsFormProps) => {
    const {
        form,
        currentBillDate,
        nextBillingMonth,
        applyFromNextMonth,
        hasError,
        isPending,
        handleSave,
        handleFormReset,
        handleClearError,
        handleApplyFromNextMonth
    } = useDefaultRentsForm(props);

    const isButtonDisabled = !form.isDirty() || isPending;

    console.log('🎨 Rendering DefaultRentsForm');

    return (
        <form onSubmit={form.onSubmit(handleSave)}>
            <Stack gap='xl' pos='relative'>
                <MyLoadingOverlay visible={isPending} />

                <ErrorAlert
                    visible={hasError}
                    message='Error while saving values!'
                    variant='outline'
                    withCloseButton
                    onClose={handleClearError}
                />

                <Stack gap='xs'>
                    <Divider label='2nd Floor Rents' labelPosition='center' />
                    <SimpleGrid cols={2} verticalSpacing='sm'>
                        <NumberInputWithCurrency
                            label='Bed Rent'
                            required
                            key={form.key('secondBed')}
                            {...getInputResetProps(form, 'secondBed')}
                            {...form.getInputProps('secondBed')}
                        />
                        <NumberInputWithCurrency
                            label='Room Rent'
                            required
                            key={form.key('secondRoom')}
                            {...getInputResetProps(form, 'secondRoom')}
                            {...form.getInputProps('secondRoom')}
                        />
                        <NumberInputWithCurrency
                            label='Special Rent'
                            required
                            key={form.key('secondSpecial')}
                            {...getInputResetProps(form, 'secondSpecial')}
                            {...form.getInputProps('secondSpecial')}
                        />
                    </SimpleGrid>
                </Stack>

                <Stack gap='xs'>
                    <Divider label='3rd Floor Rents' labelPosition='center' />
                    <SimpleGrid cols={2} verticalSpacing='sm'>
                        <NumberInputWithCurrency
                            label='Bed Rent'
                            required
                            key={form.key('thirdBed')}
                            {...getInputResetProps(form, 'thirdBed')}
                            {...form.getInputProps('thirdBed')}
                        />
                        <NumberInputWithCurrency
                            label='Room Rent'
                            required
                            key={form.key('thirdRoom')}
                            {...getInputResetProps(form, 'thirdRoom')}
                            {...form.getInputProps('thirdRoom')}
                        />
                    </SimpleGrid>
                </Stack>

                <Stack gap='xs'>
                    <Divider label='General Charges' labelPosition='center' />
                    <SimpleGrid cols={2} verticalSpacing='sm'>
                        <NumberInputWithCurrency
                            label='Security Deposit'
                            required
                            key={form.key('securityDeposit')}
                            {...getInputResetProps(form, 'securityDeposit')}
                            {...form.getInputProps('securityDeposit')}
                        />
                        <NumberInputWithCurrency
                            label='WiFi Monthly Charge'
                            required
                            key={form.key('wifiMonthlyCharge')}
                            {...getInputResetProps(form, 'wifiMonthlyCharge')}
                            {...form.getInputProps('wifiMonthlyCharge')}
                        />
                    </SimpleGrid>
                </Stack>

                {!!currentBillDate && (
                    <MyAlert iconName='info'>
                        <Stack gap='xs'>
                            <Paper p='xs'>
                                <Checkbox
                                    label='Apply Changes from Next Month'
                                    checked={applyFromNextMonth}
                                    onChange={(event) => handleApplyFromNextMonth(event.currentTarget.checked)}
                                />
                            </Paper>
                            <Text>
                                To ensure smooth billing, changes will apply to all active members in the next billing
                                cycle starting from <strong>{nextBillingMonth}</strong>. Adjustments will be made when
                                generating next month's bill.
                            </Text>
                            <div>
                                <Title order={5}>Mid-month revisions</Title>
                                <Text>
                                    If revision is made in the middle of a month, it's your resposibility send the
                                    revised receipt to the affected members to prevent confusion.
                                </Text>
                            </div>
                        </Stack>
                    </MyAlert>
                )}

                <GroupButtons>
                    <Button variant='default' onClick={handleFormReset} disabled={isButtonDisabled}>
                        Reset
                    </Button>
                    <Button type='submit' disabled={isButtonDisabled} leftSection={<IconDataObject size={20} />}>
                        {isPending ? 'Saving...' : 'Save'}
                    </Button>
                </GroupButtons>
            </Stack>
        </form>
    );
};
