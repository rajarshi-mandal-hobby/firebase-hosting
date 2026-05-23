import {
    Box,
    Button,
    Group,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Textarea,
    TextInput,
    Text,
    Checkbox,
    List,
    Divider,
    Paper,
    Space,
    Collapse
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { type DefaultRents, type Member, type BedType } from '../../../../../data/types';
import {
    MyLoadingOverlay,
    NumberInputWithCurrency,
    GroupIcon,
    MyAlert,
    formCloseIconProps
} from '../../../../../shared/components';
import type { MemberAction } from '../../../../../shared/hooks';
import {
    IconUndo,
    IconClose,
    IconCalendarMonth,
    IconBed,
    IconEditOff,
    IconUniversalCurrency,
    IconPayments,
    IconMoneyBag,
    IconNote,
    IconPriorityHigh,
    IconInfo
} from '../../../../../shared/icons';
import { toIndianLocale, notifyError, getSafeDate, formatPhoneNumber } from '../../../../../shared/utils';
import { useMemberDetailsForm } from '../hooks/useMemberDetailsForm';
import { MemberFormConfirmationModal } from './modals/MemberFormConfirmationModal';

export interface MemberDetailsFormProps {
    defaultRents: DefaultRents;
    memberAction: MemberAction;
    member: Member | null;
    handleResetBoundary: () => void;
}

export const MemberForm = ({ defaultRents, member, memberAction, handleResetBoundary }: MemberDetailsFormProps) => {
    const currentDefaultRent =
        member ? (defaultRents.bedRents[member.floor] as Record<BedType, number>)[member.bedType] : 0;
    if (currentDefaultRent === undefined) {
        throw new Error(`Invalid bed type ${member?.bedType} for floor ${member?.floor}`);
    }

    const {
        form,
        members,
        formValues,
        isPending,
        rootError,
        isMoveInDateDisabled,
        isConfirmModalOpen,
        shouldDisplayMismatchAlert,
        isRentMismatch,
        isSecurityDepositMismatch,
        isButtonDisabled,
        isAddAction,
        isEditAction,
        isReactivateAction,
        summary,
        defaultFormValues: { secondFloorSelectData, thirdFlSelectData, minDate, maxDate },
        actions
    } = useMemberDetailsForm({ defaultRents, member, currentDefaultRent, memberAction, handleResetBoundary });

    console.log('Rendering MemberDetailsForm');

    return (
        <Box pos='relative'>
            <MyLoadingOverlay visible={isPending} />

            {member && shouldDisplayMismatchAlert && (
                <MyAlert title='Rent Mismatch Detected' color='orange' mb='md' Icon={IconInfo}>
                    <List size='sm' spacing='xs'>
                        {isRentMismatch && (
                            <List.Item fw={500}>
                                Settings: {toIndianLocale(currentDefaultRent)} &mdash; Member:{' '}
                                {toIndianLocale(member.currentRent)}
                            </List.Item>
                        )}
                        {isSecurityDepositMismatch && (
                            <List.Item fw={500}>
                                Settings: {toIndianLocale(defaultRents.securityDeposit)} &mdash; Member:{' '}
                                {toIndianLocale(member.securityDeposit)}
                            </List.Item>
                        )}
                    </List>
                </MyAlert>
            )}

            {rootError && (
                <MyAlert title='There are form errors' Icon={IconPriorityHigh} mb='xl'>
                    {rootError}
                </MyAlert>
            )}

            <form
                onSubmit={form.onSubmit(actions.onSave, (e) => {
                    console.log(e);
                    notifyError('Please fix the validation errors before submitting the form.');
                })}
            >
                <Stack gap='lg'>
                    {/* Personal Information */}
                    <Divider label='Personal Information' />
                    <TextInput
                        label='Full Name'
                        pattern='[A-Za-z0-9\s]+'
                        placeholder={member ? member.name : 'Enter full name'}
                        autoCapitalize='words'
                        list='name-list'
                        required
                        key={form.key('name')}
                        {...form.getInputProps('name')}
                        {...formCloseIconProps(form, 'name')}
                    />

                    <datalist id='name-list'>
                        {members.map((member) => (
                            <option key={member.id} value={member.name} />
                        ))}
                    </datalist>

                    <Group align='flex-start'>
                        <MonthPickerInput
                            readOnly={isMoveInDateDisabled}
                            valueFormat='MMM YYYY'
                            label='Join Month'
                            placeholder='Pick date'
                            minDate={minDate}
                            maxDate={maxDate}
                            required
                            leftSection={<IconCalendarMonth />}
                            flex={1}
                            miw={150}
                            key={form.key('moveInDate')}
                            {...form.getInputProps('moveInDate')}
                            {...(isMoveInDateDisabled ?
                                { rightSection: <IconEditOff />, rightSectionWidth: 34 }
                            :   formCloseIconProps(form, 'moveInDate'))}
                        />
                        <TextInput
                            label='Phone Number'
                            type='tel'
                            placeholder='10-digit number'
                            inputMode='numeric'
                            leftSection={<Text fz='sm'>+91</Text>}
                            required
                            list='phone-list'
                            flex={2}
                            key={form.key('phone')}
                            {...form.getInputProps('phone')}
                            {...formCloseIconProps(form, 'phone')}
                        />
                        <datalist id='phone-list'>
                            {members.map((member) => (
                                <option key={member.id} value={member.phone.replaceAll(/(\+91)(\d{5})(\d{5})/g, '$1 $2 $3')} />
                            ))}
                        </datalist>
                    </Group>

                    {form.getValues().isPreviousMonth && (
                        <MyAlert Icon={IconPriorityHigh} color='orange'>
                            Previous month has been selected which is an expensive database operation.{' '}
                            <strong>Please verify the details.</strong>
                        </MyAlert>
                    )}

                    {/* Additional Details */}
                    {/* <Space h="xs" /> */}
                    <Paper withBorder p='sm' mt='xs'>
                        <Switch
                            label='WiFi Opt-in'
                            size='sm'
                            description={
                                member ?
                                    member.optedForWifi ?
                                        'Member has opted for WiFi'
                                    :   'Member has not opted for WiFi'
                                :   'Toggle if the member is opting for WiFi'
                            }
                            key={form.key('isOptedForWifi')}
                            {...form.getInputProps('isOptedForWifi', { type: 'checkbox' })}
                        />
                    </Paper>

                    {/* Accommodation Details */}
                    <Space h='xs' />
                    <Divider label='Accommodation Details' />
                    <SimpleGrid cols={2} spacing='xs' verticalSpacing='lg'>
                        <Select
                            label='Floor'
                            placeholder='Select floor'
                            clearable={!!member && form.isDirty('floor')}
                            clearButtonProps={{
                                onClick: () => {
                                    form.setFieldValue('floor', member?.floor ?? null);
                                    form.setFieldValue('bedType', member?.bedType ?? null);
                                }
                            }}
                            leftSection={<IconBed />}
                            data={secondFloorSelectData}
                            required
                            key={form.key('floor')}
                            {...form.getInputProps('floor')}
                        />
                        <Select
                            label='Bed Type'
                            placeholder='Select bed type'
                            disabled={!form.values.floor}
                            clearable={!!member && form.isDirty('bedType')}
                            clearButtonProps={{
                                onClick: () => {
                                    form.setFieldValue('floor', member?.floor ?? null);
                                    form.setFieldValue('bedType', member?.bedType ?? null);
                                }
                            }}
                            leftSection={<IconBed />}
                            data={thirdFlSelectData}
                            required
                            key={form.key('bedType')}
                            {...form.getInputProps('bedType')}
                        />

                        <NumberInputWithCurrency
                            label='Monthly Rent'
                            placeholder='Select bed type'
                            required
                            readOnly
                            rightSection={<IconEditOff />}
                            rightSectionWidth={34}
                            key={form.key('rentAmount')}
                            {...form.getInputProps('rentAmount')}
                        />
                        <NumberInputWithCurrency
                            label='Advance Deposit'
                            placeholder={form.values.rentAmount.toString() || 'Enter advance deposit'}
                            rightSection={<IconEditOff />}
                            rightSectionWidth={34}
                            readOnly
                            required
                            key={form.key('advanceDeposit')}
                            {...form.getInputProps('advanceDeposit')}
                        />
                        <NumberInputWithCurrency
                            label='Security Deposit'
                            placeholder={defaultRents.securityDeposit.toString()}
                            required
                            key={form.key('securityDeposit')}
                            {...form.getInputProps('securityDeposit')}
                            {...formCloseIconProps(form, 'securityDeposit')}
                        />

                        {!!member && (
                            <NumberInputWithCurrency
                                label='Rent at Joining'
                                required
                                key={form.key('rentAtJoining')}
                                {...form.getInputProps('rentAtJoining')}
                                {...formCloseIconProps(form, 'rentAtJoining')}
                            />
                        )}
                    </SimpleGrid>

                    {/* Payment Summary */}
                    <Space h='xs' />
                    <MyAlert color='indigo' title={`Total ${toIndianLocale(summary.total)}`} Icon={IconPayments}>
                        <Stack gap='lg'>
                            {/* If there is member */}
                            {!!member && (
                                <MyAlert color='indigo' title='Previously Agreed Deposit' Icon={IconMoneyBag}>
                                    <SimpleGrid cols={2} spacing='xs' verticalSpacing='xs'>
                                        <Group gap='xs'>
                                            <IconUniversalCurrency />
                                            <Text>Monthly Rent</Text>
                                        </Group>
                                        <Text fw={500}>{toIndianLocale(member.currentRent)}</Text>
                                        <Group gap='xs'>
                                            <IconUniversalCurrency />
                                            <Text>Advance Deposit</Text>
                                        </Group>
                                        <Text fw={500}>{toIndianLocale(member.advanceDeposit)}</Text>
                                        <Group gap='xs'>
                                            <IconUniversalCurrency />
                                            <Text>Security Deposit</Text>
                                        </Group>
                                        <Text fw={500}>{toIndianLocale(member.securityDeposit)}</Text>
                                        <Group gap='xs'>
                                            <IconPayments />
                                            <Text fw={700}>Total</Text>
                                        </Group>
                                        <Text fw={700}>{toIndianLocale(member.totalAgreedDeposit)}</Text>
                                    </SimpleGrid>
                                </MyAlert>
                            )}

                            <Paper p='md'>
                                <Stack gap='lg'>
                                    <SimpleGrid cols={2}>
                                        <NumberInputWithCurrency
                                            label='Amount Paying Now'
                                            placeholder={summary.total.toString()}
                                            required
                                            disabled={!form.values.advanceDeposit || !form.values.securityDeposit}
                                            key={form.key('amountPaid')}
                                            {...form.getInputProps('amountPaid')}
                                            {...formCloseIconProps(form, 'amountPaid')}
                                        />
                                    </SimpleGrid>
                                    <Checkbox
                                        label={
                                            <Text>
                                                Forward <strong>{toIndianLocale(summary.outstanding)}</strong>{' '}
                                                outstanding amount?
                                            </Text>
                                        }
                                        description="This amount will be added to current month's expenses"
                                        disabled={summary.outstanding === 0}
                                        key={form.key('shouldForwardOutstanding')}
                                        {...form.getInputProps('shouldForwardOutstanding', { type: 'checkbox' })}
                                    />

                                    <Textarea
                                        label={
                                            <GroupIcon>
                                                <IconNote />
                                                <Text fw={500}>Notes (Optional)</Text>
                                            </GroupIcon>
                                        }
                                        placeholder='Any additional notes or remarks'
                                        rightSection={
                                            form.isDirty('note') ?
                                                member ?
                                                    <IconUndo />
                                                :   <IconClose />
                                            :   null
                                        }
                                        rightSectionProps={{
                                            onClick: () =>
                                                member ?
                                                    form.setFieldValue('note', member.note)
                                                :   form.setFieldValue('note', ''),
                                            style: { cursor: 'pointer' }
                                        }}
                                        maxRows={3}
                                        resize='block'
                                        key={form.key('note')}
                                        {...form.getInputProps('note')}
                                    />
                                </Stack>
                            </Paper>
                        </Stack>
                    </MyAlert>

                    {/* <VisuallyHidden> */}
                    <NumberInput
                        label='Outstanding Amount'
                        hidden
                        readOnly
                        key={form.key('outstandingAmount')}
                        {...form.getInputProps('outstandingAmount')}
                    />
                    <Checkbox
                        label='Has Date Changed'
                        hidden
                        readOnly
                        key={form.key('isPreviousMonth')}
                        {...form.getInputProps('isPreviousMonth', { type: 'checkbox' })}
                    />
                    {/* </VisuallyHidden> */}

                    {/* Actions */}
                    <Group justify='flex-end' mt='xl'>
                        <Button variant='default' onClick={actions.onHandleReset} disabled={!form.isDirty()}>
                            Reset
                        </Button>
                        <Button type='submit' disabled={isButtonDisabled}>
                            {isAddAction ?
                                'Add Member'
                            : isEditAction ?
                                'Update Member'
                            : isReactivateAction ?
                                'Reactivate'
                            :   'Working'}
                        </Button>
                    </Group>
                </Stack>

                <MemberFormConfirmationModal
                    opened={isConfirmModalOpen}
                    actions={{ onClose: actions.onCloseConfirm, onConfirm: actions.onConfirm }}
                    formValues={formValues}
                    dirtyFields={member ? form.getDirty() : undefined}
                />
            </form>
        </Box>
    );
};
