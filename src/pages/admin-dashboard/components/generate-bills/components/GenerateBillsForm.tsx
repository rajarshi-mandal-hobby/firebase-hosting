import {
    Box,
    Stack,
    Group,
    Divider,
    NumberInput,
    Switch,
    MultiSelect,
    Textarea,
    Text,
    Button,
    SegmentedControl
} from '@mantine/core';
import type { Floor } from '../../../../../data/types';
import {
    MyLoadingOverlay,
    NumberInputWithCurrency,
    FormClearButton,
    MyAlert,
    MyThemeIcon
} from '../../../../../shared/components';
import { IconClose, IconInfo, IconPerson, IconUndo, IconUniversalCurrency } from '../../../../../shared/icons';
import { toIndianLocale } from '../../../../../shared/utils';
import type { GenerateBillsData } from '../hooks/useBillsData';
import { useBillsForm, type BillFormData } from './hooks/useBillsForm';
import { GenerateBillsConfirmModal } from './GenerateBillsConfirmModal';
import type { UseFormReturnType } from '@mantine/form';

export function GenerateBillsForm({ billingData }: { billingData: GenerateBillsData }) {
    const {
        form,
        segmentedControlData,
        derivedState,
        toggleState,
        isFetching,
        memberOptions,
        floorIdNameMap,
        actions: { handleFormSubmit, toggleFloorExpense },
        modalActions
    } = useBillsForm(billingData);

    const getCloseIconProps = <T,>(
        form: UseFormReturnType<T>,
        field: Parameters<UseFormReturnType<T>['isDirty']>[0]
    ) => {
        if (!field) return {};

        const initialValues = form.getInitialValues();
        const initialValue = (initialValues as any)[field];
        const isDirty = form.isDirty(field);

        return {
            rightSection:
                isDirty ?
                    initialValue ? <IconUndo />
                    :   <IconClose />
                :   undefined,
            rightSectionWidth: 34,
            rightSectionProps: {
                onClick: () => form.setFieldValue(field, initialValue),
                style: { cursor: 'pointer' }
            }
        };
    };

    console.log('🎨 Rendering GenerateBillsFormContent', form.getInitialValues());

    return (
        <>
            <Box pos='relative'>
                <MyLoadingOverlay visible={isFetching} />
                <form onSubmit={form.onSubmit(handleFormSubmit)}>
                    <Stack gap='lg'>
                        <SegmentedControl
                            data={segmentedControlData}
                            value={form.getValues().selectedBillingMonth}
                            key={form.key('selectedBillingMonth')}
                            {...form.getInputProps('selectedBillingMonth')}
                        />

                        <MyAlert
                            my='md'
                            Icon={IconInfo}
                            color={form.getValues().isUpdatingBills ? 'orange.0' : 'green.0'}
                            p='xs'
                        >
                            <Text fw={700}>
                                {form.getValues().isUpdatingBills ? 'Updating previous bills' : 'Generating new bills'}
                            </Text>
                        </MyAlert>

                        <Divider label='Electricity Charges' />

                        <Stack gap='xs'>
                            <Group align='flex-start' justify='flex-start'>
                                <NumberInputWithCurrency
                                    required
                                    label='2nd Floor'
                                    placeholder='1400'
                                    flex={2}
                                    inputWrapperOrder={['label', 'input', 'description', 'error']}
                                    key={form.key('secondFloorElectricityBill')}
                                    {...form.getInputProps('secondFloorElectricityBill')}
                                    {...getCloseIconProps(form, 'secondFloorElectricityBill')}
                                />
                                <NumberInput
                                    required
                                    label='Members'
                                    placeholder='7'
                                    flex={1}
                                    allowNegative={false}
                                    hideControls
                                    key={form.key('secondFloorActiveMemberCount')}
                                    {...form.getInputProps('secondFloorActiveMemberCount')}
                                    {...getCloseIconProps(form, 'secondFloorActiveMemberCount')}
                                />
                            </Group>

                            <DisplayMembersByFloor
                                floor='2nd'
                                activeMemberIdsByFloor={floorIdNameMap}
                                billPerMember={derivedState.floorBills['2nd']}
                            />
                        </Stack>

                        <Stack gap='xs'>
                            <Group align='flex-start' justify='flex-start'>
                                <NumberInputWithCurrency
                                    required
                                    label='3rd Floor'
                                    placeholder='1200'
                                    flex={2}
                                    allowNegative={false}
                                    hideControls
                                    key={form.key('thirdFloorElectricityBill')}
                                    {...form.getInputProps('thirdFloorElectricityBill')}
                                    {...getCloseIconProps(form, 'thirdFloorElectricityBill')}
                                />
                                <NumberInput
                                    required
                                    label='Members'
                                    placeholder='6'
                                    flex={1}
                                    allowNegative={false}
                                    hideControls
                                    key={form.key('thirdFloorActiveMemberCount')}
                                    {...form.getInputProps('thirdFloorActiveMemberCount')}
                                    {...getCloseIconProps(form, 'thirdFloorActiveMemberCount')}
                                />
                            </Group>

                            <DisplayMembersByFloor
                                floor='3rd'
                                activeMemberIdsByFloor={floorIdNameMap}
                                billPerMember={derivedState.floorBills['3rd']}
                            />
                        </Stack>

                        <Divider label='WiFi Charges' mt='lg' />

                        <Stack gap='xs'>
                            <Group align='flex-start' justify='center'>
                                <MultiSelect
                                    required={!!form.getValues().wifiMonthlyCharge}
                                    label='Members'
                                    data={memberOptions}
                                    placeholder={!form.getValues().wifiMemberIds.length ? 'Select members' : undefined}
                                    flex={2}
                                    key={form.key('wifiMemberIds')}
                                    {...form.getInputProps('wifiMemberIds')}
                                />

                                <NumberInputWithCurrency
                                    required={!!form.getValues().wifiMemberIds.length}
                                    label='Amount'
                                    placeholder='600'
                                    flex={1}
                                    step={50}
                                    hideControls
                                    allowNegative={false}
                                    key={form.key('wifiMonthlyCharge')}
                                    {...form.getInputProps('wifiMonthlyCharge')}
                                    {...getCloseIconProps(form, 'wifiMonthlyCharge')}
                                />
                            </Group>
                            <DisplayChargesPerHead chargesPerHead={derivedState.wifiChargesPerHead} />
                        </Stack>

                        <Divider label='Additional Charges' mt='lg' />

                        <Switch
                            label={`Select all ${form.getValues().secondFloorActiveMemberCount} members on 2nd floor`}
                            checked={toggleState['2nd']}
                            onChange={(event) => toggleFloorExpense('2nd', event.currentTarget.checked)}
                        />
                        <Switch
                            label={`Select all ${form.getValues().thirdFloorActiveMemberCount} members on 3rd floor`}
                            checked={toggleState['3rd']}
                            onChange={(event) => toggleFloorExpense('3rd', event.currentTarget.checked)}
                        />

                        <Stack gap='xs'>
                            <Group align='flex-start' justify='center'>
                                <MultiSelect
                                    required={!!form.getValues().addExpenseAmount}
                                    label='Members'
                                    data={memberOptions}
                                    placeholder={
                                        !form.getValues().addExpenseMemberIds.length ? 'Select members' : undefined
                                    }
                                    flex={2}
                                    key={form.key('addExpenseMemberIds')}
                                    {...form.getInputProps('addExpenseMemberIds')}
                                />
                                <NumberInputWithCurrency
                                    required={!!form.getValues().addExpenseMemberIds.length}
                                    label='Amount'
                                    placeholder='100'
                                    allowNegative={true}
                                    hideControls
                                    flex={1}
                                    key={form.key('addExpenseAmount')}
                                    {...form.getInputProps('addExpenseAmount')}
                                    {...getCloseIconProps(form, 'addExpenseAmount')}
                                />
                            </Group>
                            <DisplayChargesPerHead chargesPerHead={derivedState.additionalChargesPerHead} />
                        </Stack>

                        <Textarea
                            required={
                                !!form.getValues().addExpenseMemberIds.length || !!form.getValues().addExpenseAmount
                            }
                            label='Description'
                            placeholder='Enter expense description'
                            disabled={
                                !form.getValues().addExpenseMemberIds.length && !form.getValues().addExpenseAmount
                            }
                            autosize
                            minRows={1}
                            key={form.key('addExpenseDescription')}
                            {...form.getInputProps('addExpenseDescription')}
                            {...getCloseIconProps(form, 'addExpenseDescription')}
                        />

                        <Group justify='flex-end' align='center' mt='xl'>
                            <Group justify='flex-end'>
                                <Button variant='default' disabled={!form.isDirty()} onClick={form.reset}>
                                    Reset
                                </Button>
                                <Button type='submit' disabled={!form.isDirty() || isFetching}>
                                    {form.getValues().isUpdatingBills ? 'Update' : 'Generate'}
                                </Button>
                            </Group>
                        </Group>
                    </Stack>
                </form>
            </Box>

            {/* Confirmation modal */}
            <GenerateBillsConfirmModal
                opened={modalActions.confirmModalOpened}
                close={modalActions.closeConfirmModal}
                formData={modalActions.submittedFormData}
                onConfirm={modalActions.handleConfirm}
            />
        </>
    );
}

interface DisplayMemberByFloorProps {
    floor: Floor;
    activeMemberIdsByFloor: Record<Floor, Record<string, string>>;
    billPerMember: number;
}

function DisplayMembersByFloor({ floor, activeMemberIdsByFloor, billPerMember }: DisplayMemberByFloorProps) {
    return (
        <MyThemeIcon Icon={IconPerson} color='violet'>
            <Text fz='xs' c='dimmed'>
                {Object.values(activeMemberIdsByFloor[floor])
                    .map((name) => name.split(' ')[0])
                    .join(', ')}
                {' — '}
                <span style={{ fontWeight: 700 }}>{toIndianLocale(billPerMember) + '/member'}</span>
            </Text>
        </MyThemeIcon>
    );
}

interface DisplayChargesPerHeadProps {
    chargesPerHead: number;
}

function DisplayChargesPerHead({ chargesPerHead }: DisplayChargesPerHeadProps) {
    return (
        <MyThemeIcon Icon={IconUniversalCurrency} color='indigo'>
            <Text fz='xs' fw={700} c='dimmed'>
                {toIndianLocale(chargesPerHead)}/member
            </Text>
        </MyThemeIcon>
    );
}
