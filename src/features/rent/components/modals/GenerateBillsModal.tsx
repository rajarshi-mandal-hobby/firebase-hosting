import {
  Button,
  Group,
  Stack,
  Text,
  Divider,
  MultiSelect,
  NumberInput,
  Switch,
  Modal,
  useModalsStack,
  Paper,
  LoadingOverlay,
  Box,
  Textarea,
} from '@mantine/core';
import { type Floor } from '../../../../data/shemas/GlobalSettings';
import { useGenerateBills, type GenerateBillsData } from './hooks/useGenerateBills';
import { useForm } from '@mantine/form';
import type { Member } from '../../../../shared/types/firestore-types';
import { notify, notifyError } from '../../../../utils/notifications.tsx';
import { useRef, useCallback, useMemo, useTransition, useState } from 'react';
import { MonthPickerInput } from '@mantine/dates';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency.tsx';
import { GenerateBillModalSkeleton } from './GenerateBillModalSkeleton.tsx';
import { fetchElectricBillByMonth } from '../../../../data/services/electricService.ts';
import { fa, is, no } from 'zod/locales';

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
  const { billingData, loading, error, actions } = useGenerateBills(opened, members);

  console.log('🎨 Rendering GenerateBillsModal');

  // Modal Stack with 3 modals: form, error, confirm
  const stack = useModalsStack(['form', 'error', 'confirm']);

  const errorModalOpened = !!error && opened;

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
    stack.closeAll();
    onClose();
  }, [onClose, stack]);

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
  const handleRetry = () => {
    actions.handleReset();
  };

  // Do NOT early-return on !opened; we keep stack mounted to allow exit transitions
  return (
    <Modal.Stack>
      {/* Form Modal */}
      <Modal {...stack.register('form')} title='Generate Bills' size='md' onClose={handleModalClose} opened={opened}>
        {!billingData || loading ? (
          <GenerateBillModalSkeleton />
        ) : (
          <FormContent
            key={loading ? 'loading' : 'loaded'} // Force remount when settings change
            members={members}
            data={billingData}
            error={error}
            onSubmit={handleFormSubmit}
            onClose={handleModalClose}
            onError={() => stack.toggle('error')}
          />
        )}
      </Modal>

      {/* Error Modal */}
      <Modal
        {...stack.register('error')}
        title={'Oops!'}
        opened={errorModalOpened}
        size='sm'
        onClose={handleModalClose}>
        <Stack>
          <Text>{error?.message}</Text>
          <Group justify='flex-end' mt='md'>
            <Button variant='outline' onClick={handleModalClose}>
              Cancel
            </Button>
            <Button onClick={handleRetry}>Retry</Button>
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
  data,
  error,
  onSubmit,
  onClose,
  onError,
}: {
  members: Member[];
  data: GenerateBillsData;
  error: unknown;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
  onError: (from: string) => void;
}) => {
  if (!data.billingMonths) {
    throw new Error('Billing months data is incomplete');
  }

  const { wifiMemberIds, activeMemberIdsByFloor, activeMembers } = useMemo(() => {
    const wifiIds: string[] = [];
    const floorIds = {
      '2nd': [] as string[],
      '3rd': [] as string[],
    };
    const memberOptions = members.reduce((acc: { value: string; label: string }[], member) => {
      if (member.isActive) {
        acc.push({ value: member.id, label: member.name || 'Unnamed' });
        if (member.optedForWifi) wifiIds.push(member.id);
        floorIds[member.floor].push(member.id);
      }
      return acc;
    }, []);

    return {
      wifiMemberIds: wifiIds,
      activeMemberIdsByFloor: floorIds,
      activeMembers: memberOptions,
    };
  }, [members]);

  const [floorBillAmounts, setFloorBillAmounts] = useState<{ [F in Floor]: number | '0' }>({
    '2nd': '0',
    '3rd': '0',
  });

  // State to track selected expense members for reactive switch updates
  const [selectedExpenseMembers, setSelectedExpenseMembers] = useState<string[]>([]);

  const computeFloorBill = useCallback((values: FormData) => {
    const secondFloorBill = values.secondFloorElectricityBill;
    const thirdFloorBill = values.thirdFloorElectricityBill;
    const secondFloorMembers = values.activeMemberCounts?.['2nd'] || 0;
    const thirdFloorMembers = values.activeMemberCounts?.['3rd'] || 0;

    setFloorBillAmounts({
      '2nd': secondFloorBill && secondFloorMembers ? Math.ceil(secondFloorBill / secondFloorMembers) : '0',
      '3rd': thirdFloorBill && thirdFloorMembers ? Math.ceil(thirdFloorBill / thirdFloorMembers) : '0',
    });
  }, []);

  const monthlyDataCache = useRef<Map<string, FormData>>(new Map());
  const monthlyInitialValuesCache = useRef<Map<string, FormData>>(new Map());
  const isProcessingRef = useRef(false);
  const [isFetching, setIsFetching] = useState(false);

  const form = useForm<FormData>({
    mode: 'uncontrolled',
    initialValues: {
      billingMonths: {
        currentBillingMonth: data.billingMonths.currentBillingMonth.toDate(),
        nextBillingMonth: data.billingMonths.nextBillingMonth.toDate(),
      },
      activeMemberCounts: data.activeMembersCounts,
      wifiCharges: data.wifiCharges,
      additionalExpenses: {
        addExpenseMemberIds: [],
        addExpenseAmount: undefined,
        addExpenseDescription: undefined,
      },
      secondFloorElectricityBill: undefined,
      thirdFloorElectricityBill: undefined,
    },
    onValuesChange(values, previous) {
    //   // Prevent processing during programmatic updates
    //   if (isProcessingRef.current) return;

    //   console.log('Form values changed:', { values, previous });
    //   const currentMonthKey = new Date(values.billingMonths.nextBillingMonth || '').toISOString().slice(0, 7);
    //   const previousMonthKey = new Date(previous.billingMonths.nextBillingMonth || '').toISOString().slice(0, 7);

    //   // Compute floor bills on relevant field changes
    //   if (
    //     previous.secondFloorElectricityBill !== values.secondFloorElectricityBill ||
    //     previous.thirdFloorElectricityBill !== values.thirdFloorElectricityBill ||
    //     previous.activeMemberCounts?.['2nd'] !== values.activeMemberCounts?.['2nd'] ||
    //     previous.activeMemberCounts?.['3rd'] !== values.activeMemberCounts?.['3rd']
    //   ) {
    //     computeFloorBill(values);
    //   }

    //   // Update selected expense members state when it changes
    //   if (previous.additionalExpenses?.addExpenseMemberIds !== values.additionalExpenses?.addExpenseMemberIds) {
    //     setSelectedExpenseMembers(values.additionalExpenses?.addExpenseMemberIds || []);
    //   }

    //   // Handle month changes
    //   if (currentMonthKey && previousMonthKey && currentMonthKey !== previousMonthKey) {
    //     handleMonthChange(currentMonthKey, previousMonthKey, values, previous);
    //   }
    },
  });

  form.watch('billingMonths.nextBillingMonth', ({ value: nextDate, previousValue: previousDate }) => {
      const currentMonthKey = new Date(nextDate || '').toISOString().slice(0, 7);
      const previousMonthKey = new Date(previousDate || '').toISOString().slice(0, 7);

      handleMonthChange(currentMonthKey, previousMonthKey, form.getValues(), form.getInitialValues());
  });

  // Extracted month change handler for clarity
  const handleMonthChange = useCallback(
    async (currentMonthKey: string, previousMonthKey: string, values: FormData, previous: FormData) => {
      console.log(`Month changed from ${previousMonthKey} to ${currentMonthKey}`);

      // Step 1: Always save previous month's data
      monthlyDataCache.current.set(previousMonthKey, { ...previous });
      // Also cache initial values for the month if not already cached
      if (!monthlyInitialValuesCache.current.has(previousMonthKey)) {
        monthlyInitialValuesCache.current.set(previousMonthKey, form.getInitialValues());
      }

      // Step 2: Check for cached data
      const cachedData = monthlyDataCache.current.get(currentMonthKey);
      const cachedInitialValues = monthlyInitialValuesCache.current.get(currentMonthKey);

      if (cachedData) {
        console.log(`Restoring cached data for ${currentMonthKey}`);
        isProcessingRef.current = true;
        form.setValues(cachedData);
        form.resetDirty(cachedInitialValues);
        // Update selected expense members from cached data
        setSelectedExpenseMembers(cachedData.additionalExpenses?.addExpenseMemberIds || []);
        isProcessingRef.current = false;
        return;
      }

      // Step 3: Fetch data for new month
      console.log(`Fetching electric bill for ${currentMonthKey}`);
      setIsFetching(true);

      try {
        const bill = await fetchElectricBillByMonth(currentMonthKey);

        // CRITICAL FIX: Preserve the user's exact Date object to prevent re-triggering onValuesChange
        const billData: FormData = {
          billingMonths: {
            currentBillingMonth: data.billingMonths.currentBillingMonth.toDate(),
            nextBillingMonth: values.billingMonths.nextBillingMonth, // Use existing Date object
          },
          secondFloorElectricityBill: bill.floorCosts['2nd'].bill,
          thirdFloorElectricityBill: bill.floorCosts['3rd'].bill,
          activeMemberCounts: {
            '2nd': bill.floorCosts['2nd'].totalMembers,
            '3rd': bill.floorCosts['3rd'].totalMembers,
          },
          additionalExpenses: {
            addExpenseMemberIds: bill.expenses.members || [],
            addExpenseAmount: bill.expenses.amount,
            addExpenseDescription: bill.expenses.description,
          },
          wifiCharges: {
            wifiMonthlyCharge: bill.wifiCharges.amount,
            wifiMemberIds: bill.wifiCharges.members || [],
          },
        };

        // Cache and apply
        monthlyDataCache.current.set(currentMonthKey, billData);
        monthlyInitialValuesCache.current.set(currentMonthKey, billData);

        isProcessingRef.current = true;
        form.setValues(billData);
        form.resetDirty(billData);
        // Update selected expense members from fetched data
        setSelectedExpenseMembers(billData.additionalExpenses?.addExpenseMemberIds || []);
        isProcessingRef.current = false;

        console.log(`Successfully loaded bill data for ${currentMonthKey}`);
      } catch (fetchError) {
        console.error(`Failed to fetch bill for ${currentMonthKey}:`, fetchError);

        // Revert to previous month on error
        const previousData = monthlyDataCache.current.get(previousMonthKey);
        const previousInitialValues = monthlyInitialValuesCache.current.get(previousMonthKey);
        if (previousData) {
          isProcessingRef.current = true;
          form.setValues(previousData);
          form.resetDirty(previousInitialValues);
          // Restore selected expense members from previous data
          setSelectedExpenseMembers(previousData.additionalExpenses?.addExpenseMemberIds || []);
          isProcessingRef.current = false;
        }

        notifyError(
          fetchError instanceof Error ? fetchError.message : `Failed to fetch electric bill for ${currentMonthKey}`
        );
        onError('bill');
      } finally {
        setIsFetching(false);
      }
    },
    [data.billingMonths, form, onError]
  );

  // Calculate floor selection state based on reactive state
  const floorSelectionState = useMemo(() => {
    return {
      '2nd':
        activeMemberIdsByFloor['2nd'].length > 0 &&
        activeMemberIdsByFloor['2nd'].every((id) => selectedExpenseMembers.includes(id)),
      '3rd':
        activeMemberIdsByFloor['3rd'].length > 0 &&
        activeMemberIdsByFloor['3rd'].every((id) => selectedExpenseMembers.includes(id)),
    };
  }, [selectedExpenseMembers, activeMemberIdsByFloor]);

  const toggleFloorExpense = useCallback(
    (floor: Floor, checked: boolean) => {
      const current = new Set(selectedExpenseMembers);
      const floorIds = activeMemberIdsByFloor[floor];

      if (checked) {
        floorIds.forEach((id) => current.add(id));
      } else {
        floorIds.forEach((id) => current.delete(id));
      }

      const newSelection = Array.from(current);
      form.setFieldValue('additionalExpenses.addExpenseMemberIds', newSelection);
      setSelectedExpenseMembers(newSelection);
    },
    [selectedExpenseMembers, activeMemberIdsByFloor, form]
  );

  const isCurrentMonth = useMemo(() => {
    const selectedMonthKey = new Date(form.values.billingMonths?.nextBillingMonth || '').toISOString().slice(0, 7);
    const currentMonthKey = data.billingMonths.currentBillingMonth.toDate().toISOString().slice(0, 7);
    return selectedMonthKey === currentMonthKey;
  }, [form.values.billingMonths?.nextBillingMonth, data.billingMonths.currentBillingMonth]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Box pos='relative'>
        <LoadingOverlay visible={isFetching} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

        <Stack gap='lg'>
          <Group gap='xs' align='center'>
            <Text size='sm' fw={500} flex={1}>
              Billing Month:
            </Text>
            <MonthPickerInput
              key={form.key('billingMonths.nextBillingMonth')}
              defaultValue={data.billingMonths.nextBillingMonth.toDate()}
              minDate={data.billingMonths.currentBillingMonth.toDate()}
              maxDate={data.billingMonths.nextBillingMonth.toDate()}
              required
              flex={2}
              disabled={isFetching}
              {...form.getInputProps('billingMonths.nextBillingMonth')}
            />
          </Group>

          <Divider label='Electricity Charges' labelPosition='left' mt='md' />

          <Group align='flex-end'>
            <NumberInputWithCurrency
              required
              label='2nd Floor'
              description={`₹${floorBillAmounts['2nd']} per member`}
              placeholder='500'
              min={0}
              flex={2}
              key={form.key('secondFloorElectricityBill')}
              {...form.getInputProps('secondFloorElectricityBill')}
            />
            <NumberInput
              required
              description='Number of members'
              placeholder='6'
              flex={1}
              min={0}
              key={form.key('activeMemberCounts.2nd')}
              {...form.getInputProps('activeMemberCounts.2nd')}
            />
          </Group>

          <Group align='flex-end'>
            <NumberInputWithCurrency
              required
              label='3rd Floor'
              description={`₹${floorBillAmounts['3rd']} per member`}
              placeholder='500'
              min={0}
              flex={2}
              key={form.key('thirdFloorElectricityBill')}
              {...form.getInputProps('thirdFloorElectricityBill')}
            />
            <NumberInput
              required
              description='Number of members'
              placeholder='6'
              flex={1}
              min={0}
              key={form.key('activeMemberCounts.3rd')}
              {...form.getInputProps('activeMemberCounts.3rd')}
            />
          </Group>

          <Divider label='Additional Charges' labelPosition='left' mt='lg' />

          <Switch
            label='Add All Members on 2nd Floor'
            checked={floorSelectionState['2nd']}
            onChange={(event) => toggleFloorExpense('2nd', event.currentTarget.checked)}
          />
          <Switch
            label='Add All Members on 3rd Floor'
            checked={floorSelectionState['3rd']}
            onChange={(event) => toggleFloorExpense('3rd', event.currentTarget.checked)}
          />

          <Group align='center' justify='center'>
            <MultiSelect
              label='Select Members'
              data={activeMembers}
              placeholder={form.values.additionalExpenses?.addExpenseMemberIds?.length ? '' : 'Select members'}
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
          <Textarea
            label='Description'
            autosize
            minRows={1}
            bdrs='xl'
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

          <Group justify='space-between' align='center' mt='md'>
            <Button variant='transparent' onClick={onClose} disabled={isFetching}>
              Cancel
            </Button>
            <Group justify='flex-end'>
              <Button variant='outline' disabled={!form.isDirty() || isFetching} onClick={() => form.reset()}>
                Reset
              </Button>
              <Button type='submit' loading={isFetching} disabled={!form.isDirty()}>
                {isCurrentMonth ? 'Generate' : 'Update'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Box>
    </form>
  );
};
