import {
  Box,
  LoadingOverlay,
  Stack,
  Group,
  Divider,
  NumberInput,
  Switch,
  MultiSelect,
  Textarea,
  Input,
  Button,
  Text,
  SegmentedControl,
  Paper,
  ThemeIcon,
} from '@mantine/core';
import { NumberInputWithCurrency } from '../../../shared/components/NumberInputWithCurrency';
import type { GenerateBillsData } from './hooks/useGenerateBillsData';
import { useGenerateBillsForm } from './hooks/useGenerateBillsForm';
import { IconInfo } from '../../../shared/icons';
import GenerateBillsConfirmModal from './GenerateBillsConfirmModal';

const GenerateBillsFormContent = ({
  billingData,
}: {
  billingData: GenerateBillsData;
}) => {
  const {
    form,
    segmentedControlData,
    derivedState,
    isFetching,
    memberOptions,
    toggleFloorExpense,
    handleFormSubmit,
    modalActions,
  } = useGenerateBillsForm(billingData);

  console.log('🎨 Rendering GenerateBillsModal FormContent', form.errors);

  return (
    <>
      <form onSubmit={form.onSubmit(handleFormSubmit)}>
        <Box pos='relative'>
          <LoadingOverlay visible={isFetching} zIndex={10} overlayProps={{ radius: 'sm', blur: 2 }} />

          <Stack gap='lg' align='stretch' justify='center'>
            <SegmentedControl
              data={segmentedControlData}
              value={form.values.selectedBillingMonth}
              key={form.key('selectedBillingMonth')}
              {...form.getInputProps('selectedBillingMonth')}
            />

            <Paper withBorder p='sm' mt='xs'>
              <Group gap='xs' align='center' justify='flex-start'>
                <ThemeIcon variant='filled' color={form.values.isUpdatingBills ? 'orange.7' : 'green.7'} size={16}>
                  <IconInfo size={12} />
                </ThemeIcon>
                <Text size='sm' fw={500}>
                  {form.values.isUpdatingBills ? 'Update previous bills' : 'Generate new bills'}
                </Text>
              </Group>
            </Paper>

            <Divider
              label='Electricity Charges'
              labelPosition='left'
              mt='sm'
              styles={{
                label: {
                  fontSize: 'var(--mantine-font-size-sm)',
                  fontWeight: 700,
                  color: 'var(--mantine-color-gray-9)',
                },
              }}
            />

            <Group align='center' justify='center'>
              <NumberInputWithCurrency
                required
                label='2nd Floor'
                description={
                  form.errors['secondFloorElectricityBill'] ? undefined : `₹${derivedState.floorBills['2nd']}/member`
                }
                placeholder='500'
                flex={2}
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                hideControls
                key={form.key('secondFloorElectricityBill')}
                {...form.getInputProps('secondFloorElectricityBill')}
              />
              <NumberInput
                required
                label='Members'
                description={form.errors['activeMemberCounts.2nd'] ? undefined : 'On 2nd floor'}
                placeholder='6'
                flex={1}
                allowNegative={false}
                hideControls
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                key={form.key('activeMemberCounts.2nd')}
                {...form.getInputProps('activeMemberCounts.2nd')}
              />
            </Group>

            <Group align='flex-end' justify='center'>
              <NumberInputWithCurrency
                required
                label='3rd Floor'
                description={
                  form.errors['thirdFloorElectricityBill'] ? undefined : `₹${derivedState.floorBills['3rd']}/member`
                }
                placeholder='500'
                flex={2}
                allowNegative={false}
                hideControls
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                key={form.key('thirdFloorElectricityBill')}
                {...form.getInputProps('thirdFloorElectricityBill')}
              />
              <NumberInput
                required
                label='Members'
                description={form.errors['activeMemberCounts.3rd'] ? undefined : 'On 3rd floor'}
                placeholder='6'
                flex={1}
                allowNegative={false}
                hideControls
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                key={form.key('activeMemberCounts.3rd')}
                {...form.getInputProps('activeMemberCounts.3rd')}
              />
            </Group>

            <Divider
              label='WiFi Charges'
              labelPosition='left'
              mt='md'
              styles={{
                label: {
                  fontSize: 'var(--mantine-font-size-sm)',
                  fontWeight: 700,
                  color: 'var(--mantine-color-gray-9)',
                },
              }}
            />

            <Group align='flex-start' justify='center'>
              <MultiSelect
                // required={!!form.values.wifiCharges.wifiMonthlyCharge}
                label='WiFi Members'
                data={memberOptions}
                placeholder={form.values.wifiCharges.wifiMemberIds.length ? undefined : 'Select members'}
                hidePickedOptions
                maxDropdownHeight={200}
                comboboxProps={{
                  transitionProps: { transition: 'pop', duration: 200 },
                  shadow: 'md',
                }}
                flex={2}
                key={form.key('wifiCharges.wifiMemberIds')}
                {...form.getInputProps('wifiCharges.wifiMemberIds')}
              />

              <NumberInputWithCurrency
                // required={
                //   form.errors['wifiCharges.wifiMonthlyCharge']
                //     ? undefined
                //     : !!form.values.wifiCharges.wifiMemberIds.length
                // }
                label='Amount'
                placeholder='600'
                description={`₹${derivedState.wifiChargesPerHead}/member`}
                flex={1}
                step={50}
                hideControls
                allowNegative={false}
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                key={form.key('wifiCharges.wifiMonthlyCharge')}
                {...form.getInputProps('wifiCharges.wifiMonthlyCharge')}
              />
            </Group>

            <Divider
              label='Additional Charges'
              labelPosition='left'
              mt='lg'
              styles={{
                label: {
                  fontSize: 'var(--mantine-font-size-sm)',
                  fontWeight: 700,
                  color: 'var(--mantine-color-gray-9)',
                },
              }}
            />

            <Switch
              label='Add All Members on 2nd Floor'
              checked={derivedState.toggleState['2nd']}
              onChange={(event) => toggleFloorExpense('2nd', event.currentTarget.checked)}
            />
            <Switch
              label='Add All Members on 3rd Floor'
              checked={derivedState.toggleState['3rd']}
              onChange={(event) => toggleFloorExpense('3rd', event.currentTarget.checked)}
            />

            <Group align='flex-start' justify='center'>
              <MultiSelect
                required={!!form.values.additionalExpenses.addExpenseAmount}
                label='Select Members'
                data={memberOptions} // ✅ Use merged options
                placeholder={form.values.additionalExpenses.addExpenseMemberIds.length ? undefined : 'Select members'}
                hidePickedOptions
                maxDropdownHeight={200}
                comboboxProps={{
                  transitionProps: { transition: 'pop', duration: 200 },
                  shadow: 'md',
                }}
                flex={2}
                key={form.key('additionalExpenses.addExpenseMemberIds')}
                {...form.getInputProps('additionalExpenses.addExpenseMemberIds')}
              />
              <NumberInputWithCurrency
                required={
                  form.errors['additionalExpenses.addExpenseAmount']
                    ? undefined
                    : !!form.values.additionalExpenses.addExpenseMemberIds.length
                }
                label='Amount'
                description={`₹${derivedState.additionalChargesPerHead}/member`}
                placeholder='100'
                allowNegative={true}
                hideControls
                flex={1}
                inputWrapperOrder={['label', 'input', 'description', 'error']}
                key={form.key('additionalExpenses.addExpenseAmount')}
                {...form.getInputProps('additionalExpenses.addExpenseAmount')}
              />
            </Group>

            <Textarea
              required={
                !!form.values.additionalExpenses.addExpenseMemberIds.length ||
                !!form.values.additionalExpenses.addExpenseAmount
              }
              label='Description'
              placeholder='Enter expense description'
              disabled={
                !form.values.additionalExpenses.addExpenseMemberIds.length &&
                !form.values.additionalExpenses.addExpenseAmount
              }
              autosize
              minRows={1}
              rightSection={
                form.values.additionalExpenses.addExpenseDescription ? (
                  <Input.ClearButton
                    onClick={() => form.setFieldValue('additionalExpenses.addExpenseDescription', undefined)}
                  />
                ) : undefined
              }
              rightSectionPointerEvents='auto'
              key={form.key('additionalExpenses.addExpenseDescription')}
              {...form.getInputProps('additionalExpenses.addExpenseDescription')}
            />

            <Group justify='space-between' align='center' mt='md'>
              <Group justify='flex-end'>
                <Button variant='transparent' disabled={!form.isDirty()} onClick={form.reset}>
                  Reset
                </Button>
                <Button type='submit' disabled={!form.isDirty() || isFetching}>
                  {form.values.isUpdatingBills ? 'Update' : 'Generate'}
                </Button>
              </Group>
            </Group>
          </Stack>
        </Box>
      </form>

      {/* Confirmation modal */}
      <GenerateBillsConfirmModal
        opened={modalActions.confirmModalOpened}
        close={modalActions.closeConfirmModal}
        formData={modalActions.submittedFormData}
        onConfirm={modalActions.handleConfirm}
      />
    </>
  );
};

export default GenerateBillsFormContent;
