import {
    Button,
    Group,
    Select,
    SimpleGrid,
    Stack,
    Textarea,
    TextInput,
    Text,
    Checkbox,
    List,
    Divider,
    Paper,
    Space,
    Switch,
    Chip
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import checkboxCard from '../../../css-modules/CheckboxCard.module.css';
import { MyLoadingOverlay, MyAlert, NumberInputWithCurrency, GroupIcon } from '../../../shared/components';
import {
    IconEvent,
    IconEditOff,
    IconKingBed,
    IconNote,
    IconPersonAlert,
    IconPersonAdd,
    IconPersonEdit,
    IconPerson,
    IconInfo
} from '../../../shared/icons';
import {
    notifyError,
    toIndianLocale,
    normalizePhoneInput,
    formatPhoneNumber,
    getInputResetProps
} from '../../../shared/utils';
import { useMemberDetailsForm } from '../hooks/useMemberDetailsForm';
import { MemberFormConfirmationModal } from './modals/MemberFormConfirmationModal';
import { GroupSpaceApart, SummaryGrid } from '../../../shared/components/group-helpers';
import { modals } from '@mantine/modals';
import { generateMemberActionNote, normalizeNameInput } from '../utils/utils';
import type { MemberDetailsFormProps } from '../types';
import { startTransition } from 'react';

export const MemberForm = ({ rentsAndBills, member, memberAction, members }: MemberDetailsFormProps) => {
    const {
        isPending,
        isButtonDisabled,
        memberActions: { isAdding, isEditing, isReactivating },
        summary,
        formConfig: { form, formValues, secondFloorSelectData, thirdFlSelectData, minDate, maxDate },
        calendarEvents: {
            canEdit,
            calendarMonth,
            isBillingMonthSameAscalendarMonth,
            isPreviousDateSelected,
            lastBillDate
        },
        actions: { handleConfirm, handleFormReset }
    } = useMemberDetailsForm({ rentsAndBills, member, memberAction, members });

    console.log('🎨 Rendering Member Form');

    return (
        <form
            onSubmit={form.onSubmit(
                (values) => {
                    const updatedValues = {
                        ...values,
                        logs: generateMemberActionNote(
                            values,
                            memberAction,
                            form,
                            member,
                            summary,
                            isPreviousDateSelected
                        )
                    };
                    modals.openConfirmModal({
                        title: 'Confirm Action',
                        children: <MemberFormConfirmationModal values={updatedValues} summary={summary} />,
                        labels: { confirm: 'Confirm', cancel: 'Cancel' },
                        confirmProps: {
                            leftSection: <IconPersonAlert size={20} />
                        },
                        onConfirm() {
                            handleConfirm(updatedValues);
                        }
                    });
                },
                () => {
                    notifyError('Please fix the validation errors before submitting the form.');
                }
            )}
        >
            <Stack pos='relative' gap='xl'>
                <MyLoadingOverlay visible={isPending} />

                <Stack gap='xs'>
                    <MonthPickerInput
                        readOnly={!canEdit}
                        label='Join Month'
                        placeholder='Pick date'
                        minDate={minDate}
                        maxDate={maxDate}
                        required
                        leftSection={<IconEvent />}
                        key={form.key('moveInDate')}
                        {...form.getInputProps('moveInDate')}
                        {...(canEdit ? getInputResetProps(form, 'moveInDate') : { rightSection: <IconEditOff /> })}
                    />

                    <MyAlert
                        iconName={isBillingMonthSameAscalendarMonth && canEdit ? 'info' : 'warning'}
                        color={isPreviousDateSelected || !canEdit ? 'orange' : 'green'}
                        title={`Calendar Month: ${calendarMonth}`}
                    >
                        {!canEdit && (
                            <List>
                                <List.Item>
                                    You cannot edit the <strong>Join Month</strong> after the bill is generated.
                                </List.Item>
                                <List.Item>
                                    If <strong>Floor</strong> is changed in the current billing month{' '}
                                    <strong>({lastBillDate})</strong>, consider recalculating the electric bills for
                                    each floor and sharing the updated bills with the members. Otherwise, the electric
                                    bills will be recalculated on a per-head basis as done normally in the next month.
                                </List.Item>
                            </List>
                        )}
                        {canEdit && (
                            <>
                                <GroupIcon mb='xs' justify='center'>
                                    <IconEvent fw={700} />
                                    <Text fw={900}>
                                        {isPreviousDateSelected ?
                                            'Previous billing month selected!'
                                        :   'Current billing month selected!'}
                                    </Text>
                                </GroupIcon>

                                <List>
                                    {isAdding && !isBillingMonthSameAscalendarMonth && (
                                        <List.Item>
                                            The billing month is not same as the current month. Are you sure to add the
                                            member in <strong>{lastBillDate}</strong>?
                                        </List.Item>
                                    )}
                                    <List.Item>
                                        <strong>Be MINDFULL while selecting the join date.</strong> It cannot be changed
                                        if next month's bill is generated, or, the previous month is selected.
                                    </List.Item>
                                    <List.Item>
                                        If a previous month's date is selected, all the active members' bills will be
                                        recalculated. <strong>You will not be able to UNDO this action.</strong>
                                    </List.Item>
                                </List>
                            </>
                        )}
                    </MyAlert>
                </Stack>

                {/* Personal Information */}
                <Stack gap='xs'>
                    <Divider label='Personal Information' labelPosition='center' />
                    <TextInput
                        label='Full Name'
                        placeholder='Enter full name'
                        required
                        leftSection={<IconPerson />}
                        key={form.key('name')}
                        {...form.getInputProps('name')}
                        {...getInputResetProps(form, 'name')}
                        onBlur={(e) => {
                            const val = e.currentTarget.value;
                            const formattedValue = normalizeNameInput(val);
                            e.currentTarget.value = formattedValue;

                            form.getInputProps('name').onBlur(e);
                        }}
                    />
                    <TextInput
                        label='Phone Number'
                        type='tel'
                        placeholder='10-digit number'
                        inputMode='numeric'
                        leftSection='+91'
                        required
                        key={form.key('phone')}
                        {...getInputResetProps(form, 'phone')}
                        {...form.getInputProps('phone')}
                        onChange={(e) => {
                            startTransition(() => {
                                const val = e.currentTarget.value;
                                const formattedValue = formatPhoneNumber(val);
                                e.currentTarget.value = formattedValue;

                                form.getInputProps('phone').onChange(e);
                            });
                        }}
                    />

                    {/* Additional Details */}
                    <Paper withBorder p='sm' mt='xs'>
                        <Switch
                            label={`WiFi Opt-in ${
                                isAdding || (!!member && !member.optedForWifi) ?
                                    `(${toIndianLocale(summary.wifi)}/mo)`
                                :   ''
                            }`}
                            size='sm'
                            description={
                                member?.optedForWifi ? 'Member has opted for Wi-Fi' : (
                                    <>
                                        Toggle if the member is opting for Wifi. Wifi charges for opted-in members will
                                        be recalculated within this billing cycle itself.
                                        <br />
                                        To avoid recalculating, you can add him while generating next month's bill.
                                    </>
                                )
                            }
                            key={form.key('optedForWifi')}
                            {...form.getInputProps('optedForWifi', { type: 'checkbox' })}
                        />
                    </Paper>
                </Stack>

                {/* Accommodation Details */}
                <Stack gap='xs'>
                    <Divider label='Accommodation Details' />
                    <SimpleGrid cols={2}>
                        <Select
                            label='Floor'
                            placeholder='Select floor'
                            clearable={!!member && form.isDirty('floor')}
                            clearButtonProps={{
                                onClick() {
                                    form.setFieldValue('floor', member?.floor ?? null);
                                    form.setFieldValue('bed', member?.bed ?? null);
                                }
                            }}
                            leftSection={<IconKingBed />}
                            data={secondFloorSelectData}
                            required
                            key={form.key('floor')}
                            {...form.getInputProps('floor')}
                        />
                        <Select
                            label='Bed Type'
                            placeholder='Select bed type'
                            disabled={!form.values.floor}
                            clearable={!!member && form.isDirty('bed')}
                            clearButtonProps={{
                                onClick() {
                                    form.setFieldValue('floor', member?.floor ?? null);
                                    form.setFieldValue('bed', member?.bed ?? null);
                                }
                            }}
                            leftSection={<IconKingBed />}
                            data={thirdFlSelectData}
                            required
                            key={form.key('bed')}
                            {...form.getInputProps('bed')}
                        />
                    </SimpleGrid>

                    {!canEdit && (
                        <Checkbox.Card
                            className={checkboxCard.root}
                            my='xs'
                            p='sm'
                            disabled={
                                (!!member
                                    // Member floor has not changed
                                    && member.floor === formValues.floor
                                    && member.bed === formValues.bed)
                                // Floor or Bed is null
                                || !formValues.floor
                                || !formValues.bed
                            }
                            key={form.key('recalculate')}
                            {...form.getInputProps('recalculate', { type: 'checkbox' })}
                        >
                            <Group wrap='nowrap' align='flex-start'>
                                <Checkbox.Indicator radius='xl' className={checkboxCard.indicator} />

                                <div>
                                    <Text className={checkboxCard.label}>Adjust for Current Month</Text>
                                    <Text className={checkboxCard.description}>
                                        If checked, the rent and electric bills for each floor (if floor changed) will
                                        be adjusted in the current billing cycle. Leave unchecked, to add him in next
                                        month's bill.
                                    </Text>
                                </div>
                            </Group>
                        </Checkbox.Card>
                    )}
                </Stack>

                {/* Payment Summary */}
                <MyAlert title='Current Total Amount' color='indigo' iconName='payments'>
                    <Stack gap='lg'>
                        <SummaryGrid
                            items={[
                                {
                                    label: 'Monthly Rent',
                                    iconName: 'universal_currency_alt',
                                    value: toIndianLocale(summary.rent)
                                },
                                {
                                    label: 'Advance Deposit',
                                    iconName: 'universal_currency_alt',
                                    value: toIndianLocale(summary.rent)
                                },
                                {
                                    label: 'Security Deposit',
                                    iconName: 'universal_currency_alt',
                                    value: toIndianLocale(summary.securityDeposit)
                                },
                                {
                                    label: 'Total Deposit',
                                    iconName: 'payments',
                                    value: toIndianLocale(summary.rent + summary.securityDeposit),
                                    valueFw: isEditing ? 700 : undefined
                                },
                                ...(!isEditing ?
                                    [
                                        {
                                            label: 'Total Payable',
                                            iconName: 'payments' as const,
                                            value: toIndianLocale(summary.total),
                                            valueFw: 700
                                        }
                                    ]
                                :   [])
                            ]}
                        />
                        {/* If there is member */}
                        {!!member && (
                            <MyAlert color='yellow' title='Previously Agreed Deposit' iconName='money_bag'>
                                <SummaryGrid
                                    items={[
                                        {
                                            label: 'Monthly Rent',
                                            iconName: 'universal_currency_alt',
                                            value: toIndianLocale(member.rent)
                                        },
                                        {
                                            label: 'Advance Deposit',
                                            iconName: 'universal_currency_alt',
                                            value: toIndianLocale(member.advanceDeposit)
                                        },
                                        {
                                            label: 'Security Deposit',
                                            iconName: 'universal_currency_alt',
                                            value: toIndianLocale(member.securityDeposit)
                                        },
                                        {
                                            label: 'Total Deposit',
                                            iconName: 'payments',
                                            value: toIndianLocale(member.totalAgreedDeposit),
                                            valueFw: 700
                                        }
                                    ]}
                                />
                            </MyAlert>
                        )}
                    </Stack>
                </MyAlert>

                <Stack gap='lg'>
                    <NumberInputWithCurrency
                        label={isEditing ? 'Adjusted Deposit Amount' : 'Amount Paying Now'}
                        placeholder='Enter amount'
                        required
                        rightSection={isEditing && <IconEditOff />}
                        readOnly={isEditing}
                        disabled={!(formValues.bed && formValues.floor)}
                        w={200}
                        key={form.key('amountPaid')}
                        {...form.getInputProps('amountPaid')}
                        {...(!isEditing && getInputResetProps(form, 'amountPaid'))}
                    />

                    <Checkbox
                        label={
                            <>
                                Forward <q>{toIndianLocale(summary.outstanding)}</q> outstanding amount?
                            </>
                        }
                        description={
                            <>
                                If checked, any outstanding will be added to current month's expenses. Otherwise, you
                                are ensuring that the member has paid the full amount!
                            </>
                        }
                        disabled={summary.outstanding === 0}
                        key={form.key('forwardOutstanding')}
                        {...form.getInputProps('forwardOutstanding', { type: 'checkbox' })}
                    />

                    <Textarea
                        label={
                            <GroupIcon>
                                <IconNote />
                                <Text fw={500}>Notes (Optional)</Text>
                            </GroupIcon>
                        }
                        description='Note will auto-generate. Use this for any additional remarks'
                        placeholder='Any additional remarks only'
                        maxRows={3}
                        resize='block'
                        key={form.key('note')}
                        {...form.getInputProps('note')}
                        {...getInputResetProps(form, 'note')}
                    />
                </Stack>

                {/* Actions */}
                <Space h='md' />
                <Group justify='flex-end'>
                    <Button variant='default' onClick={handleFormReset} disabled={!form.isDirty()}>
                        Reset
                    </Button>
                    <Button
                        type='submit'
                        disabled={isButtonDisabled}
                        leftSection={isAdding ? <IconPersonAdd size={20} /> : <IconPersonEdit size={20} />}
                    >
                        {isAdding ?
                            'Add Member'
                        : isEditing ?
                            'Update Member'
                        : isReactivating ?
                            'Reactivate'
                        :   'Working'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
};
