import { Button, Group, Stack, Text, TextInput, Divider, MultiSelect, NumberInput, Switch } from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { SharedModal } from '../../../../shared/components/SharedModal';
import { GlobalSettings, type Floor } from '../../../../data/shemas/GlobalSettings';
import { useGenerateBills } from './hooks/useGenerateBills';
import { useForm } from '@mantine/form';
import { RetryBox } from '../../../../shared/components/RetryBox';
import type { ElectricBill, Member } from '../../../../shared/types/firestore-types';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { notify } from '../../../../utils/notificaions';
import { useRef } from 'react';

interface GenerateBillsModalProps {
  members: Member[];
  opened: boolean;
  onClose: () => void;
}

type FormData = Omit<GlobalSettings, 'upiVpa' | 'securityDeposit' | 'bedRents'> & {
  wifiMemberIds: string[] | null;
  addExpenseMemberIds: string[] | null;
  addExpenseAmount?: number | null;
  addExpenseDescription?: string | null;
  secondFloorElectricityBill?: number | null;
  thirdFloorElectricityBill?: number | null;
};

export const GenerateBillsModal = ({ members, opened, onClose }: GenerateBillsModalProps) => {
  const { settings, loading, error, refreshSettings, fetchElectricBill } = useGenerateBills();

  console.log('🎨 Rendering GenerateBillsModal');

  return error ? (
    <RetryBox error={error as Error} handleRetry={refreshSettings} loading={loading} />
  ) : (
    <Content
      members={members}
      settings={settings}
      loading={loading}
      opened={opened}
      onClose={onClose}
      fetchElectricBill={fetchElectricBill}
      key={settings?.securityDeposit}
    />
  );
};

const Content = ({
  members,
  settings,
  loading,
  opened,
  onClose,
  fetchElectricBill,
}: GenerateBillsModalProps & {
  settings?: GlobalSettings;
  loading: boolean;
  fetchElectricBill: (month: string) => Promise<ElectricBill>;
}) => {
  const wifiMemberIds: string[] = [];
  const activeMemberIdsByFloor = {
    '2nd': [] as string[],
    '3rd': [] as string[],
  };
  const activeMembers = members.reduce((acc: { value: string; label: string }[], member) => {
    if (member.isActive) {
      acc.push({ value: member.id, label: member.name });
      if (member.optedForWifi) {
        wifiMemberIds.push(member.id);
      }
      if (member.floor === '2nd') {
        activeMemberIdsByFloor['2nd'].push(member.id);
      } else {
        activeMemberIdsByFloor['3rd'].push(member.id);
      }
    }
    return acc;
  }, [] as { value: string; label: string }[]);

  const form = useForm<FormData>({
    mode: 'uncontrolled',
    initialValues: settings
      ? {
          currentBillingMonth: settings.currentBillingMonth,
          nextBillingMonth: settings.nextBillingMonth,
          activeMemberCounts: settings.activeMemberCounts,
          wifiMonthlyCharge: settings.wifiMonthlyCharge,
          wifiMemberIds,
          addExpenseMemberIds: [],
          addExpenseAmount: undefined,
          addExpenseDescription: undefined,
          secondFloorElectricityBill: undefined,
          thirdFloorElectricityBill: undefined,
        }
      : ({} as FormData),
  });

  const toggleFloorExpense = (floor: Floor, checked: boolean) => {
    const current = new Set(form.values.addExpenseMemberIds || []);
    const floorIds = activeMemberIdsByFloor[floor];
    if (checked) {
      floorIds.forEach((id) => current.add(id));
    } else {
      floorIds.forEach((id) => current.delete(id));
    }
    form.setFieldValue('addExpenseMemberIds', Array.from(current));
  };

  const isFloorSelected = (floor: Floor) => {
    const sel = form.values.addExpenseMemberIds || [];
    const floorIds = activeMemberIdsByFloor[floor];
    return floorIds.length > 0 && floorIds.every((id) => sel.includes(id));
  };

  // Refs to track state across month changes
  const initialFormValues = useRef<FormData | null>(null); // Stores the initial form values

  const handleGetElectricBill = (value: string | null) => {
    if (!value || !settings) {
      notify.error('Wrong date provided.');
      return;
    }

    // Convert string to Date to get month info
    const selectedDate = new Date(value);
    const currentDate = settings.currentBillingMonth.toDate();

    // Check if selected month is current month or previous month
    const isCurrentMonth =
      selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();

    // Creating new bill for next month
    if (!isCurrentMonth && initialFormValues.current) {
      form.setValues(initialFormValues.current);
      return;
    }

    // Updating the previous month's bill
    initialFormValues.current = form.getValues();

    fetchElectricBill(value)
      .then((bill) => {
        console.log(bill);

        const newValues: Partial<FormData> = {
          secondFloorElectricityBill: bill.floorCosts['2nd'].bill,
          thirdFloorElectricityBill: bill.floorCosts['3rd'].bill,
          activeMemberCounts: {
            ...form.values.activeMemberCounts,
            byFloor: {
              ...form.values.activeMemberCounts.byFloor,
              '2nd': bill.floorCosts['2nd'].totalMembers,
              '3rd': bill.floorCosts['3rd'].totalMembers,
            },
          },
          addExpenseAmount: bill.appliedBulkExpenses[0]?.amount || undefined,
          addExpenseDescription: bill.appliedBulkExpenses[0]?.description || undefined,
          addExpenseMemberIds: bill.appliedBulkExpenses[0]?.members || undefined,
        };

        form.setValues(newValues);
      })
      .catch((error) => {
        const err = error as Error & { cause?: string };
        if (err.cause === 'bill-not-found') {
          console.log('No bill found for the selected month.');
          // For previous months with no bill, reset to initial values
          if (initialFormValues.current) {
            form.setValues(initialFormValues.current);
            form.resetDirty(initialFormValues.current);
          }
          return;
        }
        notify.error(err.message);
      });
  };

  return (
    <SharedModal
      opened={opened}
      onClose={onClose}
      title='Generate Bills'
      loading={loading}
      showActions={false}
      size='md'>
      <form onSubmit={form.onSubmit(() => {})}>
        <Stack gap='lg'>
          <Group gap='xs' align='center'>
            <Text size='sm' fw={500} flex={1}>
              Billing Month:
            </Text>
            <MonthPickerInput
              defaultValue={settings?.nextBillingMonth.toDate()}
              minDate={settings?.currentBillingMonth.toDate()}
              maxDate={settings?.nextBillingMonth.toDate()}
              required
              flex={2}
              onChange={handleGetElectricBill}
            />
          </Group>

          <Group grow>
            <NumberInputWithCurrency
              label='2nd Floor'
              description='Electricity bill'
              placeholder='Electricity bill'
              step={50}
              min={100}
              key={form.key('secondFloorElectricityBill')}
              {...form.getInputProps('secondFloorElectricityBill')}
            />
            <NumberInputWithCurrency
              label='3rd Floor'
              description='Electricity bill'
              placeholder='Electricity bill'
              step={50}
              min={100}
              key={form.key('thirdFloorElectricityBill')}
              {...form.getInputProps('thirdFloorElectricityBill')}
            />
          </Group>

          <Divider label='Member Counts' labelPosition='left' mt='md' />

          <Group grow>
            <NumberInput
              required
              label='2nd Floor'
              placeholder='Number of members'
              key={form.key('activeMemberCounts.byFloor.2nd')}
              {...form.getInputProps('activeMemberCounts.byFloor.2nd')}
            />
            <NumberInput
              required
              label='3rd Floor'
              placeholder='Number of members'
              key={form.key('activeMemberCounts.byFloor.3rd')}
              {...form.getInputProps('activeMemberCounts.byFloor.3rd')}
            />
          </Group>

          <Button variant='light' size='xs' onClick={() => form.resetField('activeMemberCounts.byFloor')}>
            Reset
          </Button>

          <Divider label='Additional Charges' labelPosition='left' mt='lg' />

          {/* Single Expense Section - Always Visible */}
          <Switch
            label='Add Expense for 2nd Floor'
            checked={isFloorSelected('2nd')}
            onChange={(event) => toggleFloorExpense('2nd', event.currentTarget.checked)}
          />
          <Switch
            label='Add Expense for 3rd Floor'
            checked={isFloorSelected('3rd')}
            onChange={(event) => toggleFloorExpense('3rd', event.currentTarget.checked)}
          />

          <Group align='center' justify='center'>
            <MultiSelect
              label='Select Members'
              data={activeMembers}
              placeholder='Select members'
              hidePickedOptions
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: 'scale', duration: 200 },
                shadow: 'md',
              }}
              flex={2}
              required={
                form.getInputProps('addExpenseAmount').value ||
                form.getInputProps('addExpenseDescription').value?.length ||
                false
              }
              key={form.key('addExpenseMemberIds')}
              {...form.getInputProps('addExpenseMemberIds')}
            />
            <NumberInputWithCurrency
              label='Amount'
              flex={1}
              placeholder='100'
              required={form.getInputProps('addExpenseMemberIds').value?.length || false}
              key={form.key('addExpenseAmount')}
              {...form.getInputProps('addExpenseAmount')}
            />
          </Group>
          <TextInput
            label='Description'
            placeholder='Enter expense description'
            required={form.getInputProps('addExpenseMemberIds').value?.length || false}
            key={form.key('addExpenseDescription')}
            {...form.getInputProps('addExpenseDescription')}
          />

          <Divider label='WiFi Charges' labelPosition='left' mt='md' />
          {/* Single WiFi Charge Section - Always Visible */}
          <Group>
            <MultiSelect
              label='WiFi Members'
              defaultChecked={true}
              data={activeMembers}
              placeholder='Select members'
              hidePickedOptions
              maxDropdownHeight={200}
              comboboxProps={{
                transitionProps: { transition: 'scale', duration: 200 },
                shadow: 'md',
              }}
              flex={2}
              required={form.getInputProps('wifiMonthlyCharge').value > 0}
              key={form.key('wifiMemberIds')}
              {...form.getInputProps('wifiMemberIds')}
            />

            <NumberInputWithCurrency
              label='Amount'
              placeholder='600'
              flex={1}
              step={50}
              required={form.getInputProps('wifiMemberIds').value?.length > 0}
              key={form.key('wifiMonthlyCharge')}
              {...form.getInputProps('wifiMonthlyCharge')}
            />
          </Group>

          <Group justify='space-between' mt='md'>
            <Button variant='transparent' onClick={onClose} disabled={loading} justify='flex-start'>
              Cancel
            </Button>
            <Group>
              <Button variant='outline' onClick={form.reset}>
                Reset
              </Button>
              <Button type='submit' loading={loading} disabled={loading}>
                Generate
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </SharedModal>
  );
};
