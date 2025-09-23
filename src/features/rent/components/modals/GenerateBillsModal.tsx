import {
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Divider,
  MultiSelect,
  NumberInput,
  Switch,
  Modal,
  useModalsStack,
  Paper,
  LoadingOverlay,
  Box,
} from '@mantine/core';
import { MonthPickerInput } from '@mantine/dates';
import { GlobalSettings, type Floor } from '../../../../data/shemas/GlobalSettings';
import { useGenerateBills } from './hooks/useGenerateBills';
import { useForm } from '@mantine/form';
import type { ElectricBill, Member } from '../../../../shared/types/firestore-types';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency';
import { notify } from '../../../../utils/notificaions';
import { useRef, useCallback, useMemo } from 'react';

interface GenerateBillsModalProps {
  members: Member[];
  opened: boolean;
  onClose: () => void;
}

type FormData = {
  billingMonths: {
    currentBillingMonth?: Date;
    nextBillingMonth?: Date;
  };
  secondFloorElectricityBill?: number;
  thirdFloorElectricityBill?: number;
  activeMemberCounts: {
    [F in Floor]: number;
  };
  wifiCharges?: {
    wifiMonthlyCharge?: number;
    wifiMemberIds?: string[];
  };
  additionalExpenses?: {
    addExpenseMemberIds?: string[];
    addExpenseAmount?: number;
    addExpenseDescription?: string;
  };
};

export const GenerateBillsModal = ({ members, opened, onClose }: GenerateBillsModalProps) => {
  // Only call the hook when modal is opened to prevent unnecessary DB calls
  const { settings, loading, error, retrySettings, fetchElectricBill, retryElectricBill } = useGenerateBills(opened);

  // Modal Stack with 3 modals: form, error, confirm
  const stack = useModalsStack(['form', 'error', 'confirm']);

  const formDataRef = useRef<FormData | null>(null);

  // Handle form submission - open confirm modal
  const handleFormSubmit = useCallback(
    (formData: FormData) => {
      formDataRef.current = formData;
      stack.toggle('confirm');
    },
    [stack]
  );

  // Handle comprehensive modal close - reset everything
  const handleModalClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle bill generation
  const handleConfirmGenerate = useCallback(async () => {
    if (!formDataRef.current) return;

    try {
      // TODO: Implement actual bill generation API call
      console.log('Generating bills with data:', formDataRef.current);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      stack.closeAll();
      notify.success('Bills generated successfully!');
      handleModalClose();
    } catch (error) {
      console.error('Error generating bills:', error);
      notify.error('Failed to generate bills');
    }
  }, [stack, handleModalClose]);

  // Handle error modal retry
  const handleRetry = useCallback(() => {
    console.log('Retrying operation for error:', error);
    if (!error) return;

    stack.close('error');

    if (error.from === 'settings') {
      retrySettings();
    } else if (error.retryData?.month) {
      retryElectricBill(error.retryData.month);
    }
  }, [error, retrySettings, retryElectricBill, stack]);

  // Do NOT early-return on !opened; we keep stack mounted to allow exit transitions
  return (
    <Modal.Stack>
      {/* Form Modal */}
      <Modal {...stack.register('form')} title='Generate Bills' size='md' onClose={handleModalClose} opened={opened}>
        <FormContent
          key={`form-${settings ? 'with' : 'without'}-settings`} // Force remount when settings change
          members={members}
          settings={settings}
          loading={loading}
          fetchElectricBill={fetchElectricBill}
          onSubmit={handleFormSubmit}
          onClose={handleModalClose}
          onError={() => stack.open('error')}
        />
      </Modal>

      {/* Error Modal */}
      <Modal
        {...stack.register('error')}
        title={error?.from === 'settings' ? 'Settings Error' : 'Electric Bill Error'}
        size='sm'>
        <Stack>
          <Text>{error?.error.message}</Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={() => stack.close('error')}>
              Cancel
            </Button>
            <Button onClick={handleRetry}>
              {error?.from === 'settings' ? 'Retry Settings' : 'Retry Electric Bill'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Confirm Modal */}
      <Modal {...stack.register('confirm')} title='Confirm Bill Generation' size='md'>
        <Stack>
          <Text fw={500}>The following operations will be performed:</Text>

          {formDataRef.current && (
            <Paper p='md' withBorder>
              <Stack gap='xs'>
                <Group gap='xs'>
                  <Text size='sm' fw={500} c='green'>
                    CREATE
                  </Text>
                  <Text size='sm' c='dimmed'>
                    bills:
                  </Text>
                  <Text size='sm'>
                    Bills for{' '}
                    {(formDataRef.current.activeMemberCounts['2nd'] || 0) +
                      (formDataRef.current.activeMemberCounts['3rd'] || 0)}{' '}
                    members
                  </Text>
                </Group>
                <Group gap='xs'>
                  <Text size='sm' fw={500} c='blue'>
                    UPDATE
                  </Text>
                  <Text size='sm' c='dimmed'>
                    settings:
                  </Text>
                  <Text size='sm'>Update current billing month</Text>
                </Group>
                {formDataRef.current.additionalExpenses && (
                  <Group gap='xs'>
                    <Text size='sm' fw={500} c='green'>
                      CREATE
                    </Text>
                    <Text size='sm' c='dimmed'>
                      expenses:
                    </Text>
                    <Text size='sm'>
                      {formDataRef.current.additionalExpenses.addExpenseDescription} - ₹
                      {formDataRef.current.additionalExpenses.addExpenseAmount}
                    </Text>
                  </Group>
                )}
                {formDataRef.current.wifiCharges && (
                  <Group gap='xs'>
                    <Text size='sm' fw={500} c='green'>
                      CREATE
                    </Text>
                    <Text size='sm' c='dimmed'>
                      charges:
                    </Text>
                    <Text size='sm'>
                      WiFi charges for {formDataRef.current.wifiCharges.wifiMemberIds?.length || 0} members - ₹
                      {formDataRef.current.wifiCharges.wifiMonthlyCharge}
                    </Text>
                  </Group>
                )}
              </Stack>
            </Paper>
          )}

          <Text size='sm' c='dimmed'>
            This action cannot be undone. Are you sure you want to proceed?
          </Text>

          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={() => stack.close('confirm')}>
              Cancel
            </Button>
            <Button color='green' onClick={handleConfirmGenerate}>
              Generate Bills
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Modal.Stack>
  );
};

const FormContent = ({
  members,
  settings,
  loading,
  fetchElectricBill,
  onSubmit,
  onClose,
  onError,
}: {
  members: Member[];
  settings?: GlobalSettings;
  loading: boolean;
  fetchElectricBill: (month: string) => Promise<ElectricBill>;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
  onError: () => void;
}) => {
  const { wifiMemberIds, activeMemberIdsByFloor, activeMembers } = useMemo(() => {
    const wifiIds: string[] = [];
    const floorIds = {
      '2nd': [] as string[],
      '3rd': [] as string[],
    };
    const memberOptions = members.reduce((acc: { value: string; label: string }[], member) => {
      if (member.isActive) {
        acc.push({ value: member.id, label: member.name || 'Unnamed' });
        if (member.optedForWifi) {
          wifiIds.push(member.id);
        }
        if (member.floor === '2nd') {
          floorIds['2nd'].push(member.id);
        } else {
          floorIds['3rd'].push(member.id);
        }
      }
      return acc;
    }, [] as { value: string; label: string }[]);

    return {
      wifiMemberIds: wifiIds,
      activeMemberIdsByFloor: floorIds,
      activeMembers: memberOptions,
    };
  }, [members]);

  const form = useForm<FormData>({
    mode: 'uncontrolled',
    initialValues: settings
      ? {
          billingMonths: {
            currentBillingMonth: settings.currentBillingMonth.toDate(),
            nextBillingMonth: settings.nextBillingMonth.toDate(),
          },
          activeMemberCounts: settings.activeMemberCounts,
          wifiCharges: {
            wifiMonthlyCharge: settings.wifiMonthlyCharge,
            wifiMemberIds,
          },
          additionalExpenses: {
            addExpenseMemberIds: [],
            addExpenseAmount: undefined,
            addExpenseDescription: undefined,
          },
          secondFloorElectricityBill: undefined,
          thirdFloorElectricityBill: undefined,
        }
      : ({} as FormData),
    onValuesChange: handleValuesChange,
  });

  const toggleFloorExpense = (floor: Floor, checked: boolean) => {
    const current = new Set(form.values.additionalExpenses?.addExpenseMemberIds || []);
    const floorIds = activeMemberIdsByFloor[floor];
    if (checked) {
      floorIds.forEach((id) => current.add(id));
    } else {
      floorIds.forEach((id) => current.delete(id));
    }
    form.setFieldValue('additionalExpenses.addExpenseMemberIds', Array.from(current));
  };

  const isFloorSelected = (floor: Floor) => {
    const sel = form.values.additionalExpenses?.addExpenseMemberIds || [];
    const floorIds = activeMemberIdsByFloor[floor];
    return floorIds.length > 0 && floorIds.every((id) => sel.includes(id));
  };

  const initialValuesRef = useRef<Map<string, FormData>>(new Map());
// Replace all the current refs with just one Map
  const monthlyDataCache = useRef<Map<string, FormData>>(new Map());

  const failedMonths = useRef<Set<string>>(new Set());
  // Set true initial values once when settings are available
  if (settings && !initialValuesRef.current.has(settings.nextBillingMonth.toDate().toISOString().slice(0, 7))) {
    initialValuesRef.current.set(settings.nextBillingMonth.toDate().toISOString().slice(0, 7), form.getInitialValues());
  }

  

  function handleValuesChange(values: FormData, previous: FormData) {
    const nextBillingMonth = new Date(values.billingMonths.nextBillingMonth || '');
    const prevBillingMonth = new Date(previous.billingMonths.nextBillingMonth || '');

    const currentMonthKey = nextBillingMonth.toISOString().slice(0, 7);
    const previousMonthKey = prevBillingMonth.toISOString().slice(0, 7);

    // Only process if the month actually changed OR if this month previously failed
    const monthChanged = nextBillingMonth?.getTime() !== prevBillingMonth?.getTime();
    const monthPreviouslyFailed = failedMonths.current.has(currentMonthKey);

    if (!nextBillingMonth || !prevBillingMonth || (!monthChanged && !monthPreviouslyFailed)) {
      return;
    }

    // Store the previous month's data before switching
    if (previousMonthKey && previousMonthKey !== currentMonthKey) {
      monthlyDataCache.current.set(previousMonthKey, previous);
    }

    // Check if we have cached data for the selected month
    if (monthlyDataCache.current.has(currentMonthKey)) {
      const cachedData = monthlyDataCache.current.get(currentMonthKey)!;
      form.setValues(cachedData);
      form.resetDirty(initialValuesRef.current.get(currentMonthKey));
      return;
    }

    // If it's the next billing month (August), use initial values
    if (settings && currentMonthKey === settings.nextBillingMonth.toDate().toISOString().slice(0, 7)) {
      form.setValues(initialValuesRef.current.get(currentMonthKey) || form.getInitialValues());
      form.resetDirty(initialValuesRef.current.get(currentMonthKey) || form.getInitialValues());
      return;
    }

    // For other months, fetch from API
    fetchElectricBillData(currentMonthKey);
  }

  const fetchElectricBillData = useCallback(
    (monthKey: string) => {
      if (!settings) return;

      console.log(`🔄 Attempting to fetch electric bill for ${monthKey}`);

      fetchElectricBill(monthKey)
        .then((bill) => {
          console.log(`✅ Successfully fetched bill for ${monthKey}`);
          // Clear error tracking for this month on success
          failedMonths.current.delete(monthKey);
          const billData: FormData = {
            billingMonths: {
              currentBillingMonth: settings.currentBillingMonth.toDate(),
              nextBillingMonth: new Date(monthKey + '-01'), // Convert back to Date
            },
            secondFloorElectricityBill: bill.floorCosts['2nd'].bill,
            thirdFloorElectricityBill: bill.floorCosts['3rd'].bill,
            activeMemberCounts: {
              '2nd': bill.floorCosts['2nd'].totalMembers,
              '3rd': bill.floorCosts['3rd'].totalMembers,
            },
            additionalExpenses: {
              addExpenseMemberIds: bill.expenses.members,
              addExpenseAmount: bill.expenses.amount,
              addExpenseDescription: bill.expenses.description,
            },
            wifiCharges: {
              wifiMonthlyCharge: bill.wifiCharges.amount,
              wifiMemberIds: bill.wifiCharges.members,
            },
          };

          // Cache the fetched data
          monthlyDataCache.current.set(monthKey, billData);
          initialValuesRef.current.set(monthKey, billData);

          // Apply to form
          form.setValues(billData);
          form.resetDirty(billData);
        })
        .catch((error) => {
          console.error('Error fetching electric bill:', error);
          // Mark this month as failed
          failedMonths.current.add(monthKey);
          const err = error as Error & { cause?: string };
          if (err.cause === 'bill-not-found') {
            notify.error(`No electric bill found for the month ${monthKey}.`);
          } else {
            onError();
          }
          form.setValues(form.getInitialValues());
          form.resetDirty(form.getInitialValues());
          form.reset();
          monthlyDataCache.current.delete(monthKey);
        });
    },
    [settings, fetchElectricBill, form, onError]
  );

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
      <Stack gap='lg'>
        <Group gap='xs' align='center'>
          <Text size='sm' fw={500} flex={1}>
            Billing Month:
          </Text>
          <MonthPickerInput
            key={form.key('billingMonths.nextBillingMonth')}
            defaultValue={settings?.nextBillingMonth.toDate()}
            minDate={settings?.currentBillingMonth.toDate()}
            maxDate={settings?.nextBillingMonth.toDate()}
            required
            flex={2}
            disabled={!settings}
            {...form.getInputProps('billingMonths.nextBillingMonth')}
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

        <Group key={form.key('activeMemberCounts')} grow>
          <NumberInput
            required
            label='2nd Floor'
            placeholder='Number of members'
            key={form.key('activeMemberCounts.2nd')}
            {...form.getInputProps('activeMemberCounts.2nd')}
          />
          <NumberInput
            required
            label='3rd Floor'
            placeholder='Number of members'
            key={form.key('activeMemberCounts.3rd')}
            {...form.getInputProps('activeMemberCounts.3rd')}
          />
        </Group>

        <Divider label='Additional Charges' labelPosition='left' mt='lg' />

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
            key={form.key('additionalExpenses.addExpenseMemberIds')}
            {...form.getInputProps('additionalExpenses.addExpenseMemberIds')}
          />
          <NumberInputWithCurrency
            label='Amount'
            flex={1}
            placeholder='100'
            key={form.key('additionalExpenses.addExpenseAmount')}
            {...form.getInputProps('additionalExpenses.addExpenseAmount')}
          />
        </Group>
        <TextInput
          label='Description'
          placeholder='Enter expense description'
          key={form.key('additionalExpenses.addExpenseDescription')}
          {...form.getInputProps('additionalExpenses.addExpenseDescription')}
        />

        <Divider label='WiFi Charges' labelPosition='left' mt='md' />

        <Group align='center' justify='center'>
          <MultiSelect
            label='WiFi Members'
            data={activeMembers}
            placeholder='Select members'
            hidePickedOptions
            maxDropdownHeight={200}
            comboboxProps={{
              transitionProps: { transition: 'scale', duration: 200 },
              shadow: 'md',
            }}
            flex={2}
            key={form.key('wifiCharges.wifiMemberIds')}
            {...form.getInputProps('wifiCharges.wifiMemberIds')}
          />

          <NumberInputWithCurrency
            label='Amount'
            placeholder='600'
            flex={1}
            step={50}
            key={form.key('wifiCharges.wifiMonthlyCharge')}
            {...form.getInputProps('wifiCharges.wifiMonthlyCharge')}
          />
        </Group>

        <Box
          style={{
            padding: 'md',
            borderTop: `1px solid (var(--mantine-color-gray-3, #dee2e6))`,
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
          <Group justify='space-between' align='center' mt='md'>
            <Button variant='transparent' onClick={onClose}>
              Cancel
            </Button>
            <Group justify='flex-end'>
              <Button
                variant='outline'
                disabled={loading || !form.isDirty()}
                onClick={() => {
                  form.reset();
                }}>
                Reset
              </Button>
              <Button type='submit' loading={loading} disabled={loading || !form.isDirty()}>
                Generate
              </Button>
            </Group>
          </Group>
        </Box>
      </Stack>
    </form>
  );
};
