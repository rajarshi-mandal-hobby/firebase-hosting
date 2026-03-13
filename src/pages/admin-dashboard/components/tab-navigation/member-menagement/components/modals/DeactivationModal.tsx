import { Stack, Title, Badge, Collapse, Text, TextInput, VisuallyHidden, Button, Textarea } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { ALT_TEXT } from '../../../../../../../data/types';
import { GroupSpaceApart, GroupIcon, GroupButtons, MyAlert } from '../../../../../../../shared/components';
import { GlobalModal, type GlobalModalProps } from '../../../../../../../shared/components/GlobalModal';
import {
    IconCalendarMonth,
    IconPayments,
    IconUniversalCurrency,
    IconRupee,
    IconMoneyBag,
    IconWarning
} from '../../../../../../../shared/icons';
import { toIndianLocale } from '../../../../../../../shared/utils';
import { useDeactivationModal } from './hooks/useDeactivationModal';

export function DeactivationModal({ opened, onClose }: GlobalModalProps) {
    const {
        // Member Info
        form,
        selectedMember,
        // Date Info
        memberLastBillingMonth,
        selectedLeaveMonthFormatted,
        currentMonthName,
        nextMonthName,
        previousMonthName,
        minDate,
        maxDate,
        // Settlement Preview
        settlementPreview,
        isLeavingPreviousMonth,
        // Modal Actions
        actions: { handleSubmit, handleErrorReset },
        // Modal State
        isPending,
        hasError,
        otherErrors
    } = useDeactivationModal({ opened, onClose });

    const isNoLeaveMonthSelected = selectedLeaveMonthFormatted === 'Invalid Date';

    console.log('🎨 Rendering DeactivationModal');

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            isPending={isPending}
            hasErrorForMemeber={hasError}
            modalTitle='Deactivate Member'
            memberDescription={`${selectedMember?.floor} Floor - ${selectedMember?.bedType}`}
            otherErrors={otherErrors}
            onResetError={handleErrorReset}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap='lg'>
                    {/* Leave Date */}
                    <MonthPickerInput
                        label='Leave Month'
                        placeholder='Select Vacate Month'
                        minDate={settlementPreview.memberStatus === 'Due' ? minDate : minDate}
                        maxDate={maxDate}
                        clearable
                        required
                        key={form.key('leaveMonth')}
                        {...form.getInputProps('leaveMonth')}
                    />

                    <VisuallyHidden>
                        <TextInput
                            readOnly
                            required
                            key={form.key('selectedMemberId')}
                            {...form.getInputProps('selectedMemberId')}
                        />
                    </VisuallyHidden>

                    {form.errors.selectedMemberId && <Text c='red'>{form.errors.selectedMemberId}</Text>}

                    <Stack gap={'xs'}>
                        <GroupSpaceApart>
                            <Title order={5}>Settlement Preview</Title>
                            <Badge color={settlementPreview.color}>{settlementPreview.status}</Badge>
                        </GroupSpaceApart>

                        <GroupSpaceApart>
                            <GroupIcon>
                                <IconPayments />
                                <Text>Total Agreed Deposit</Text>
                            </GroupIcon>
                            <Text fw={500}>{toIndianLocale(settlementPreview.totalAgreedDeposit)}</Text>
                        </GroupSpaceApart>
                        <GroupSpaceApart>
                            <GroupIcon>
                                <IconUniversalCurrency />
                                <Text>Rent at Joining</Text>
                            </GroupIcon>
                            <Text fw={500}>{toIndianLocale(settlementPreview.rentAtJoining)}</Text>
                        </GroupSpaceApart>
                        <GroupSpaceApart>
                            <GroupIcon>
                                <IconRupee />
                                <Text>Outstanding for {memberLastBillingMonth}</Text>
                            </GroupIcon>
                            <Text fw={500}>{toIndianLocale(settlementPreview.currentMonthOutstanding)}</Text>
                        </GroupSpaceApart>
                        <GroupSpaceApart>
                            <GroupIcon>
                                <IconMoneyBag />
                                <Text fw={700}>{settlementPreview.text}</Text>
                            </GroupIcon>
                            <Text fw={700} c={isNoLeaveMonthSelected ? 'red' : settlementPreview.color}>
                                {isNoLeaveMonthSelected ? ALT_TEXT : toIndianLocale(settlementPreview.refundAmount)}
                            </Text>
                        </GroupSpaceApart>
                        <GroupSpaceApart>
                            <GroupIcon>
                                <IconCalendarMonth />
                                <Text fw={700}>Leave Month</Text>
                            </GroupIcon>
                            <Text fw={700}>{selectedLeaveMonthFormatted}</Text>
                        </GroupSpaceApart>
                    </Stack>

                    <Collapse in={!isNoLeaveMonthSelected}>
                        <MyAlert
                            color='red'
                            title={isLeavingPreviousMonth ? 'Previous Month Selected' : 'Current Month Selected'}
                            Icon={IconWarning}
                        >
                            <Stack>
                                {isLeavingPreviousMonth ?
                                    <Text>
                                        <strong>{currentMonthName}</strong> has been selected which is before the
                                        current billing month. Any previous paid amount will be adjusted in the
                                        settlement amount.
                                    </Text>
                                :   <>
                                        <Text>
                                            Member&apos;s electricity bill has not been calculated for{' '}
                                            <strong>
                                                {settlementPreview.memberStatus === 'Due' ?
                                                    currentMonthName
                                                :   nextMonthName}
                                            </strong>
                                            .{' '}
                                            {settlementPreview.memberStatus === 'Due' ?
                                                <Text component='span'>
                                                    If this bill was generated to calculate the electricity bill for the
                                                    month of <strong>{currentMonthName}</strong>, then select{' '}
                                                    <strong>{previousMonthName}</strong>.
                                                </Text>
                                            :   <Text component='span'>
                                                    Member has already paid an amount for this month, that is,{' '}
                                                    <strong>{currentMonthName}</strong>.
                                                </Text>
                                            }
                                        </Text>
                                        {settlementPreview.memberStatus !== 'Due' && (
                                            <Text>
                                                If you are deactivating the member this month, calculate the electricity
                                                bill for <strong>{currentMonthName}</strong> by generating next
                                                month&apos;s bill and deactivate thereafter, <strong>OR</strong>,
                                                calculate it manually. <strong>Otherwise</strong>, select{' '}
                                                <strong>{previousMonthName}</strong> as the leave month.
                                            </Text>
                                        )}
                                    </>
                                }
                                <Text fw={700}>
                                    Always verify the settlement amount before deactivating the member.
                                </Text>

                                <Textarea
                                    label='Additional Notes (Optional)'
                                    placeholder='Enter any additional notes'
                                    {...form.getInputProps('notes')}
                                />
                            </Stack>
                        </MyAlert>
                    </Collapse>

                    <GroupButtons>
                        <Button variant='transparent' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit' disabled={isPending || !form.isDirty()} color='red'>
                            Deactivate
                        </Button>
                    </GroupButtons>
                </Stack>
            </form>
        </GlobalModal>
    );
}
