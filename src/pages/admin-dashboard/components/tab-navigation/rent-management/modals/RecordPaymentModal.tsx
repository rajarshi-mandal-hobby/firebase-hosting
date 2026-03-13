import { Stack, Text, Alert, Button, Divider, TextInput, Paper, VisuallyHidden } from '@mantine/core';
import { toIndianLocale, StatusBadge } from '../../../../../../shared/utils';
import { NumberInputWithCurrency } from '../../../../../../shared/components/NumberInputWithCurrency';
import { GroupSpaceApart, GroupIcon, FormClearButton, GroupButtons } from '../../../../../../shared/components';
import { IconMoneyBag, IconPayments, IconRupee, IconUniversalCurrency } from '../../../../../../shared/icons';
import { GlobalModal, type GlobalModalProps } from '../../../../../../shared/components/GlobalModal';
import { useRecordPaymentModal } from './hooks/useRecordPaymentModal';

export const RecordPaymentModal = ({ opened, onClose }: GlobalModalProps) => {
    const {
        form,
        paymentDetails: { currentStatus, currentTitle, currentColor },
        prevStatus,
        prevStatusColor,
        prevStatusTitle,
        isPending,
        formAmountPaid,
        newOutstanding,
        isPaymentBelowOutstanding,
        selectedMember,
        hasError,
        otherErrors,
        actions: { resetForm, handleRecordPayment }
    } = useRecordPaymentModal({ opened, onClose });

    const { totalCharges, amountPaid, note, currentOutstanding } = selectedMember?.currentMonthRent || {
        totalCharges: 0,
        amountPaid: 0,
        note: '',
        currentOutstanding: 0
    };

    const isButtonDisabled = isPending || !form.isDirty() || !selectedMember;
    const CommonStatusBadge = <StatusBadge status={currentStatus} />;

    console.log('🎨 Rendering RecordPaymentModal', currentColor);

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            modalTitle='Record Payment'
            memberDescription={
                <GroupIcon>
                    <StatusBadge status={prevStatus} />
                    <Text c={prevStatusColor} fw={700}>
                        {prevStatusTitle}
                    </Text>
                </GroupIcon>
            }
            isPending={isPending}
            hasErrorForMemeber={hasError}
            onResetError={resetForm}
            otherErrors={otherErrors}
        >
            <form onSubmit={form.onSubmit(handleRecordPayment)}>
                <Stack gap='lg'>
                    <Stack gap='xs'>
                        <NumberInputWithCurrency
                            label='Paying Now'
                            list={'amount-suggestions'}
                            rightSection={<FormClearButton field='amountPaid' form={form} />}
                            required
                            w={150}
                            key={form.key('amountPaid')}
                            {...form.getInputProps('amountPaid')}
                        />

                        <TextInput
                            label='Note'
                            placeholder='Optional note...'
                            required={isPaymentBelowOutstanding}
                            list='payment-note-suggestions'
                            rightSection={<FormClearButton field='note' form={form} />}
                            key={form.key('note')}
                            {...form.getInputProps('note')}
                        />
                    </Stack>

                    <Alert color={currentColor}>
                        <Stack gap={'xs'}>
                            <GroupSpaceApart>
                                <GroupIcon>
                                    <IconPayments />
                                    <Text>Total charges</Text>
                                </GroupIcon>
                                <Text fw={500}>{toIndianLocale(totalCharges)}</Text>
                            </GroupSpaceApart>

                            <GroupSpaceApart>
                                <GroupIcon>
                                    <IconMoneyBag />
                                    <Text>Previously paid</Text>
                                </GroupIcon>
                                <Text fw={500}>{toIndianLocale(amountPaid)}</Text>
                            </GroupSpaceApart>

                            <GroupSpaceApart>
                                <GroupIcon>
                                    <IconRupee />
                                    <Text>Current outstanding</Text>
                                </GroupIcon>
                                <Text fw={500}>{toIndianLocale(currentOutstanding)}</Text>
                            </GroupSpaceApart>

                            <Divider color={currentColor} />
                            {/* New Payment Being Added */}
                            <GroupSpaceApart>
                                <GroupIcon>
                                    <IconUniversalCurrency />
                                    <Text>This payment</Text>
                                </GroupIcon>
                                <Text fw={700}>{toIndianLocale(formAmountPaid)}</Text>
                            </GroupSpaceApart>

                            <GroupSpaceApart>
                                <GroupIcon>
                                    <IconRupee />
                                    <Text>New outstanding</Text>
                                </GroupIcon>
                                <Text fw={700} c={currentColor}>
                                    {toIndianLocale(newOutstanding)}
                                </Text>
                            </GroupSpaceApart>

                            <GroupSpaceApart>
                                <GroupIcon>
                                    {CommonStatusBadge}
                                    <Text fw={500}>New Status</Text>
                                </GroupIcon>
                                <Text fw={700} c={currentColor}>
                                    {currentTitle}
                                </Text>
                            </GroupSpaceApart>

                            <Paper p='xs'>
                                <Text size='xs'>
                                    <strong>Note:</strong>
                                    <br />
                                    - If payment is less than total charges, a note is required.
                                    <br />- Set amount to <strong>0</strong> to remove a payment. Any previous note will
                                    be removed.
                                </Text>
                            </Paper>
                        </Stack>
                    </Alert>

                    <GroupButtons>
                        <Button variant='transparent' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button disabled={isButtonDisabled} type='submit' leftSection={CommonStatusBadge}>
                            Record {toIndianLocale(formAmountPaid)}
                        </Button>
                    </GroupButtons>
                </Stack>

                <VisuallyHidden>
                    <datalist id='amount-suggestions'>
                        <option value={toIndianLocale(totalCharges)}>Total Charges</option>
                        {amountPaid > 0 && (
                            <>
                                <option value={toIndianLocale(amountPaid)}>Paid Amount</option>
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
        </GlobalModal>
    );
};
