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
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import type { GenerateBillsData } from './hooks/useGenerateBills';
import { useGenerateBillsForm, type GenerateBillFormData } from './hooks/useGenerateBillsForm';

export const FormContent = ({
  billData,
  onSubmit,
  onClose,
}: {
  billData: GenerateBillsData;
  onSubmit: (formData: GenerateBillFormData) => void;
  onClose: () => void;
}) => {
  const { form, derivedState, isFetching, memberOptions, toggleFloorExpense, handleSubmit } = useGenerateBillsForm(
    billData,
    onSubmit
  );

  console.log('🎨 Rendering GenerateBillsModal FormContent', form.errors);

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Box pos='relative'>
        <LoadingOverlay visible={isFetching} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

        <Stack gap='lg'>
          <Group gap='xs' align='center'>
            <Text size='sm' fw={700} flex={1}>
              {form.values.isUpdatingBills ? 'Updating Bills' : 'Generate Bills'}
            </Text>
            <MonthPickerInput
              key={form.key('selectedBillingMonth')}
              minDate={dayjs(billData.billingMonths.currentBillingMonth.toDate()).format('YYYY-MM-DD')}
              maxDate={dayjs(billData.billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD')}
              popoverProps={{
                transitionProps: { transition: 'pop', duration: 200 },
              }}
              required
              flex={2}
              allowDeselect={false}
              {...form.getInputProps('selectedBillingMonth')}
            />
          </Group>

          <Divider
            label='Electricity Charges'
            labelPosition='left'
            mt='md'
            styles={{
              label: { fontSize: '1rem', fontWeight: 700, color: 'var(--mantine-color-gray-9)' },
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
              key={form.key('secondFloorElectricityBill')}
              {...form.getInputProps('secondFloorElectricityBill')}
            />
            <NumberInput
              label='Members'
              required
              description={form.errors['activeMemberCounts.2nd'] ? undefined : 'On 2nd floor'}
              placeholder='6'
              flex={1}
              allowNegative={false}
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
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              key={form.key('activeMemberCounts.3rd')}
              {...form.getInputProps('activeMemberCounts.3rd')}
            />
          </Group>

          <Divider label='Additional Charges' labelPosition='left' mt='lg' />

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
              label='Select Members'
              data={memberOptions} // ✅ Use merged options
              placeholder={form.values.additionalExpenses.addExpenseMemberIds.length ? undefined : 'Select members'}
              hidePickedOptions
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: 'pop', duration: 200 },
                shadow: 'md',
              }}
              required={!!form.values.additionalExpenses.addExpenseAmount}
              flex={2}
              key={form.key('additionalExpenses.addExpenseMemberIds')}
              {...form.getInputProps('additionalExpenses.addExpenseMemberIds')}
            />
            <NumberInputWithCurrency
              label='Amount'
              description={`₹${derivedState.additionalChargesPerHead}/member`}
              required={!!form.values.additionalExpenses.addExpenseMemberIds.length}
              flex={1}
              placeholder='100'
              allowNegative={true}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              key={form.key('additionalExpenses.addExpenseAmount')}
              {...form.getInputProps('additionalExpenses.addExpenseAmount')}
            />
          </Group>

          <Textarea
            label='Description'
            autosize
            minRows={1}
            placeholder='Enter expense description'
            required={
              !!form.values.additionalExpenses.addExpenseMemberIds.length ||
              !!form.values.additionalExpenses.addExpenseAmount
            }
            disabled={
              !form.values.additionalExpenses.addExpenseMemberIds.length &&
              !form.values.additionalExpenses.addExpenseAmount
            }
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

          <Divider label='WiFi Charges' labelPosition='left' mt='md' />

          <Group align='flex-start' justify='center'>
            <MultiSelect
              label='WiFi Members'
              data={memberOptions} // ✅ Use merged options
              placeholder={form.values.wifiCharges.wifiMemberIds.length ? undefined : 'Select members'}
              hidePickedOptions
              maxDropdownHeight={200}
              required={!!form.values.wifiCharges.wifiMonthlyCharge}
              comboboxProps={{
                transitionProps: { transition: 'pop', duration: 200 },
                shadow: 'md',
              }}
              flex={2}
              key={form.key('wifiCharges.wifiMemberIds')}
              {...form.getInputProps('wifiCharges.wifiMemberIds')}
            />

            <NumberInputWithCurrency
              label='Amount'
              placeholder='600'
              description={`₹${derivedState.wifiChargesPerHead}/member`}
              required={!!form.values.wifiCharges.wifiMemberIds.length}
              flex={1}
              step={50}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
              key={form.key('wifiCharges.wifiMonthlyCharge')}
              {...form.getInputProps('wifiCharges.wifiMonthlyCharge')}
            />
          </Group>

          <Group justify='space-between' align='center' mt='md'>
            <Button variant='outline' onClick={onClose} disabled={isFetching}>
              Cancel
            </Button>
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
  );
};
