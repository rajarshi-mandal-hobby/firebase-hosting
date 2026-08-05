import { Stack, Text, TextInput, VisuallyHidden, Button, Textarea, Divider, LoadingOverlay } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { GroupIcon, GroupButtons, MyAlert, MyLoadingOverlay, ErrorAlert } from '../../../../../shared/components';
import { toIndianLocale } from '../../../../../shared/utils';
import { useDeactivationModal } from './hooks/useDeactivationModal';
import type { MemberManagementModalProps } from './types/member-management-modal';
import { GroupTable } from '../../../../../shared/components/group-helpers';
import { IconNote, IconPersonAlert } from '../../../../../shared/icons';
import { closeAllModals } from '@mantine/modals';

export function DeactivationModal({ member }: MemberManagementModalProps) {
    const {
        // Member Info
        form,
        // Date Info
        memberLastBillingMonth,
        selectedMonth,
        selectedMonthName,
        nextMonthName,
        monthAfterNextMonthName,
        minDate,
        maxDate,
        // Settlement Preview
        totalAgreedDeposit,
        currentMonthOutstanding,
        settlementStatusConfig,
        rentNow,
        amountRefundable,
        isLeavingPreviousMonth,
        // Modal Actions
        actions: { handleSubmit, handleErrorReset },
        // Modal State
        isPending,
        hasError
    } = useDeactivationModal(member);

    const color = isLeavingPreviousMonth ? 'red' : 'orange';

    console.log('🎨 Rendering DeactivationModal');

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap='lg' pos='relative'>
                <MyLoadingOverlay visible={isPending} />

                <ErrorAlert
                    variant='outline'
                    visible={hasError}
                    message='Got error while deactivating member!'
                    withCloseButton
                    onClose={handleErrorReset}
                />

                {/* Leave Date */}
                <MonthPickerInput
                    label='Leave Month'
                    placeholder='Select Vacate Month'
                    minDate={settlementStatusConfig.status === 'Payment Due' ? minDate : minDate}
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

                <MyAlert
                    color={color}
                    title={
                        !selectedMonth ? 'Select A Month'
                        : isLeavingPreviousMonth ?
                            'Previous Month Selected'
                        :   'Current Billing Month Selected'
                    }
                    // Icon={IconWarning}
                    iconName='warning'
                >
                    <Stack gap='xs'>
                        <GroupTable
                            iconName='payments'
                            label='Total Agreed Deposit'
                            value={toIndianLocale(totalAgreedDeposit)}
                        />
                        <GroupTable
                            iconName='universal_currency_alt'
                            label='Rent Now'
                            value={toIndianLocale(rentNow)}
                        />
                        <GroupTable
                            iconName='currency_rupee'
                            label={`Outstanding for ${memberLastBillingMonth}`}
                            value={toIndianLocale(currentMonthOutstanding)}
                        />
                        <GroupTable
                            iconName='money_bag'
                            label={selectedMonth ? settlementStatusConfig.status : 'Refund/Payable'}
                            labelFw={700}
                            value={selectedMonth ? toIndianLocale(amountRefundable) : '-'}
                            valueFw={700}
                            valueColor={settlementStatusConfig.color}
                        />
                        <GroupTable
                            iconName='event'
                            label='Leave Month'
                            labelFw={700}
                            value={selectedMonth || '-'}
                            valueFw={700}
                        />
                    </Stack>
                    <Divider my='md' color={color} />

                    <Stack pos='relative'>
                        <LoadingOverlay
                            visible={!selectedMonth}
                            loaderProps={{
                                children: ' '
                            }}
                            zIndex={1}
                        />
                        {isLeavingPreviousMonth ?
                            <Text>
                                <strong>{selectedMonthName}</strong> has been selected. Last two months payments will be
                                adjusted, and the member will be <strong>deactivated immediately</strong>.
                            </Text>
                        :   <Text>
                                The final adjusted amount will be after the <strong>{nextMonthName}</strong> electric
                                bill is calculated, and the member will be marked as inactive in{' '}
                                <strong>{monthAfterNextMonthName}</strong>.
                            </Text>
                        }

                        <Text fw={900}>Always verify the settlement amount!</Text>

                        <Textarea
                            label={
                                <GroupIcon gap={4}>
                                    <IconNote /> Additional Note (Optional)
                                </GroupIcon>
                            }
                            placeholder='Enter any additional notes'
                            autosize
                            minRows={2}
                            maxRows={5}
                            key={form.key('note')}
                            {...form.getInputProps('note')}
                        />
                    </Stack>
                </MyAlert>

                <GroupButtons>
                    <Button variant='default' onClick={() => closeAllModals()}>
                        Close
                    </Button>
                    <Button
                        type='submit'
                        disabled={isPending || !form.isDirty()}
                        color='red'
                        leftSection={<IconPersonAlert size={20} />}
                    >
                        {isPending ? 'Deactivating...' : 'Deactivate'}
                    </Button>
                </GroupButtons>
            </Stack>
        </form>
    );
}
