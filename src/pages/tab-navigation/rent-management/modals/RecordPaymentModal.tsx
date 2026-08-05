import { Stack, TextInput, Paper, List, ListItem, Button, VisuallyHidden, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import type { Member } from '../../../../data/types';
import {
    StatusThemeIcon,
    MyLoadingOverlay,
    ErrorAlert,
    MemberPaymentDetails,
    NumberInputWithCurrency,
    MyAlert,
    GroupTable,
    GroupButtons
} from '../../../../shared/components';
import { getInputResetProps, toIndianLocale, toNumber } from '../../../../shared/utils';
import { useRecordPaymentModal } from './hooks/useRecordPaymentModal';

interface RecordPaymentModalProps {
    member: Member;
}

export function RecordPaymentModal({ member }: RecordPaymentModalProps) {
    const {
        form,
        formValues,
        paymentDisplayData: { currentStatus, currentTitle },
        isPending,
        newOutstanding,
        isPaymentBelowOutstanding,
        hasError,
        actions: { resetForm, handleRecordPayment }
    } = useRecordPaymentModal(member);

    const isButtonDisabled = isPending || !form.isDirty();
    const { totalCharges = 0, amountPaid = 0, note = '' } = member?.currentMonthRent ?? {};

    console.log('🎨 Rendering RecordPaymentModal');

    return (
        <form onSubmit={form.onSubmit(handleRecordPayment)}>
            <Stack gap='lg' pos='relative'>
                <MyLoadingOverlay visible={isPending} />

                <ErrorAlert
                    message='Error while recording payment!'
                    visible={hasError}
                    withCloseButton
                    onClose={resetForm}
                />

                <MemberPaymentDetails member={member} />

                <Stack gap='xs'>
                    <NumberInputWithCurrency
                        label='Paying Now'
                        list={'amount-suggestions'}
                        required
                        w={150}
                        key={form.key('amountPaid')}
                        {...form.getInputProps('amountPaid')}
                        {...getInputResetProps(form, 'amountPaid')}
                    />

                    <TextInput
                        label='Note'
                        placeholder='Optional note...'
                        required={isPaymentBelowOutstanding}
                        list='payment-note-suggestions'
                        key={form.key('note')}
                        {...form.getInputProps('note')}
                        {...getInputResetProps(form, 'note')}
                    />
                </Stack>

                <MyAlert iconName='info' title='Payment Summary' color='yellow'>
                    <Stack gap='xs'>
                        {/* New Payment Being Added */}
                        <GroupTable
                            iconName='universal_currency_alt'
                            label='This payment'
                            value={toNumber(formValues.amountPaid)}
                            valueFw={700}
                        />
                        <GroupTable
                            iconName='currency_rupee'
                            label='New outstanding'
                            value={newOutstanding}
                            valueFw={700}
                        />
                        <GroupTable
                            icon={<StatusThemeIcon paymentStatus={currentStatus} />}
                            label='New Status'
                            value={currentTitle}
                            valueFw={700}
                        />

                        <Paper p='sm'>
                            <Text size='xs' fw={700}>
                                Note:
                            </Text>
                            <List size='xs'>
                                <ListItem>If payment is less than total charges, a note is required.</ListItem>
                                <ListItem>
                                    Set amount to <strong>“0”</strong> to remove a payment. Any previous note will be
                                    removed.
                                </ListItem>
                            </List>
                        </Paper>
                    </Stack>
                </MyAlert>

                <GroupButtons>
                    <Button variant='default' onClick={() => modals.close(member.id)}>
                        Close
                    </Button>
                    <Button
                        disabled={isButtonDisabled}
                        type='submit'
                        leftSection={<StatusThemeIcon paymentStatus={currentStatus} size={18} />}
                    >
                        Record {toIndianLocale(formValues.amountPaid)}
                    </Button>
                </GroupButtons>
            </Stack>

            <VisuallyHidden>
                <datalist id='amount-suggestions'>
                    <option value={toIndianLocale(totalCharges)}>Total Charges</option>
                    {amountPaid > 0 && (
                        <>
                            <option value={toIndianLocale(amountPaid)}>Amount Paid</option>
                            <option value={toIndianLocale(0)}>Remove Payment</option>
                        </>
                    )}
                </datalist>

                <datalist id='payment-note-suggestions'>
                    {!!note && <option value={note}>Previous Note</option>}
                    {isPaymentBelowOutstanding && <option value='Partial payment received.'>Partial Note</option>}
                </datalist>
            </VisuallyHidden>
        </form>
    );
}
