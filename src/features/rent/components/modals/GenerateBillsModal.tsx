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
  const { settings, loading, error, retrySettings, fetchElectricBill, retryElectricBill } = useGenerateBills();

  console.log('🎨 Rendering GenerateBillsModal');

  return error ? (
    <RetryBox error={error as Error} handleRetry={retrySettings} loading={loading} />
  ) : (
    <Content
      members={members}
      settings={settings}
      loading={loading}
      opened={opened}
      onClose={onClose}
      fetchElectricBill={fetchElectricBill}
      retryElectricBill={retryElectricBill}
      key={settings?.securityDeposit || loading.toString()}
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
  retryElectricBill,
}: GenerateBillsModalProps & {
  settings?: GlobalSettings;
  loading: boolean;
  fetchElectricBill: (month: string) => Promise<ElectricBill>;
  retryElectricBill: (month: string) => Promise<ElectricBill>;
}) => {
  const wifiMemberIds: string[] = [];
  const activeMemberIdsByFloor = {
    '2nd': [] as string[],
    '3rd': [] as string[],
  };
  const activeMembers = members.reduce((acc: { value: string; label: string }[], member) => {
    if (member.isActive) {
      acc.push({ value: member.id, label: member.name || 'Unnamed' });
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
  const currentFormValues = useRef<FormData | null>(null); // Stores the current form values
  const initialFormValues = useRef<FormData>(form.getInitialValues()); // Stores the initial form values
  const appliedBillMonthRef = useRef<string | null>(null); // Track which bill month is currently applied

  const handleGetElectricBill = (value: string | null) => {
    if (!value || !settings) {
      notify.error('Invalid month selected.');
      return;
    }

    const monthKey = value.slice(0, 7); // YYYY-MM format
    const currentMonthKey = settings.currentBillingMonth.toDate().toISOString().slice(0, 7);

    // Skip if we're already showing data for this month
    if (appliedBillMonthRef.current === monthKey) {
      return;
    }

    const isCurrentMonth = monthKey === currentMonthKey;

    // Handle month switching logic for next month
    if (!isCurrentMonth && currentFormValues.current) {
      console.log('Creating new bill for next month', currentFormValues.current, initialFormValues.current);
      form.setValues(currentFormValues.current);
      form.resetDirty(initialFormValues.current);
      appliedBillMonthRef.current = monthKey;
      return;
    }

    // Store current form values before fetching
    currentFormValues.current = form.getValues();

    fetchElectricBill(monthKey)
      .then((bill) => {
        const newValues: FormData = {
          ...form.values,
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
          addExpenseAmount: bill.expenses.amount,
          addExpenseDescription: bill.expenses.description,
          addExpenseMemberIds: bill.expenses.members,
          wifiMemberIds: bill.wifiCharges.members,
          wifiMonthlyCharge: bill.wifiCharges.amount,
        };

        form.setValues(newValues);
        form.resetDirty(newValues);
        appliedBillMonthRef.current = monthKey;
      })
      .catch((error) => {
        // Only handle bill-not-found case here, hook handles other errors
        const err = error as Error & { cause?: string };
        if (err.cause === 'bill-not-found') {
          if (currentFormValues.current) {
            form.setValues(currentFormValues.current);
            form.resetDirty(initialFormValues.current);
          }
          appliedBillMonthRef.current = null;
        }
        // Other errors are handled by the hook's state management
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
          <Group align='center' justify='center'>
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
