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
  Input,
} from '@mantine/core';
import { type Floor } from '../../../../data/shemas/GlobalSettings';
import { useGenerateBills, type GenerateBillsData } from './hooks/useGenerateBills';
import { useForm } from '@mantine/form';
import type { Member } from '../../../../shared/types/firestore-types';
import { notifyError } from '../../../../utils/notifications.tsx';
import { useRef, useCallback, useMemo, useState, useDeferredValue } from 'react';
import { MonthPickerInput } from '@mantine/dates';
import { NumberInputWithCurrency } from '../../../../shared/components/NumberInputWithCurrency.tsx';
import { GenerateBillModalSkeleton } from './GenerateBillModalSkeleton.tsx';
import { fetchElectricBillByMonth } from '../../../../data/services/electricService.ts';
import { fa } from 'zod/locales';

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
      handleModalClose();
    } catch (error) {
      console.error('Error generating bills:', error);
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
      <Modal
        {...stack.register('form')}
        title='Generate Bills'
        size='md'
        onClose={handleModalClose}
        opened={opened}
        styles={{
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-3)',
          },
        }}>
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
          <Text size='sm' ff='monospace'>
            {error?.message}
          </Text>
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
}: {
  members: Member[];
  data: GenerateBillsData;
  error: unknown;
  onSubmit: (formData: FormData) => void;
  onClose: () => void;
}) => {
  if (!data.billingMonths) {
    throw new Error('Billing months data is incomplete');
  }

  const { activeMemberIdsByFloor, activeMembers } = useMemo(() => {
    const floorIds = {
      '2nd': [] as string[],
      '3rd': [] as string[],
    };
    const memberOptions = members.reduce((acc: { value: string; label: string }[], member) => {
      if (member.isActive) {
        acc.push({ value: member.id, label: member.name || 'Unnamed' });
        floorIds[member.floor].push(member.id);
      }
      return acc;
    }, []);

    return {
      activeMemberIdsByFloor: floorIds,
      activeMembers: memberOptions,
    };
  }, [members]);

  const [wifiCharges, setWifiCharges] = useState(() => {
    const wifiMonthlyCharge = data.wifiCharges.wifiMonthlyCharge || 0;
    const wifiMemberCount = data.wifiCharges.wifiMemberIds.length || 0;
    return wifiMonthlyCharge && wifiMemberCount
      ? Math.ceil(data.wifiCharges.wifiMonthlyCharge / data.wifiCharges.wifiMemberIds.length)
      : 0;
  });

  const computePerHeadBill = (totalBill: number | undefined, memberCount: number) => {
    return totalBill && memberCount ? Math.ceil(totalBill / memberCount) : 0;
  };

  const [resetExpensesGroup, setResetExpensesGroup] = useState(false);
  const [resetWifiGroup, setResetWifiGroup] = useState(false);

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
    onValuesChange: (values, previous) => {
      if (isProcessingRef.current) return;
      console.log('🎨 onValuesChange triggered with values:', values);

      setResetExpensesGroup(!!values.additionalExpenses?.addExpenseAmount);
      setResetWifiGroup(!!values.wifiCharges?.wifiMonthlyCharge || !!values.wifiCharges?.wifiMemberIds?.length);

      computeFloorBill(values, previous);

      // Compute WiFi charges per head
      const wifiMemberIds = values.wifiCharges?.wifiMemberIds?.length || 0;
      const wifiMonthlyCharge = values.wifiCharges?.wifiMonthlyCharge || 0;

      if (
        wifiMemberIds !== previous.wifiCharges?.wifiMemberIds?.length ||
        wifiMonthlyCharge !== previous.wifiCharges?.wifiMonthlyCharge
      ) {
        const newWifiCharges = computePerHeadBill(wifiMonthlyCharge, wifiMemberIds);
        setWifiCharges(newWifiCharges);
      }

      // Compute additional charges per head
      const expenseAmount = values.additionalExpenses?.addExpenseAmount || 0;
      const expenseMemberCount = values.additionalExpenses?.addExpenseMemberIds?.length || 0;
      const newPerHead = computePerHeadBill(expenseAmount, expenseMemberCount);

      if (newPerHead !== additionalChargesPerHead) {
        setAdditionalChargesPerHead(newPerHead);
      }
    },
  });

  const [floorBillAmounts, setFloorBillAmounts] = useState<{ [F in Floor]: number }>(() => {
    const currentFormValues = form.getValues();
    const secondFloorBill = computePerHeadBill(
      currentFormValues.secondFloorElectricityBill,
      currentFormValues.activeMemberCounts['2nd']
    );
    const thirdFloorBill = computePerHeadBill(
      currentFormValues.thirdFloorElectricityBill,
      currentFormValues.activeMemberCounts['3rd']
    );

    return {
      '2nd': secondFloorBill,
      '3rd': thirdFloorBill,
    };
  });

  const computeFloorBill = (values: FormData, previous: FormData) => {
    const secondFloorBill = values.secondFloorElectricityBill;
    const thirdFloorBill = values.thirdFloorElectricityBill;
    const secondFloorMembers = values.activeMemberCounts['2nd'];
    const thirdFloorMembers = values.activeMemberCounts['3rd'];

    if (
      secondFloorBill !== previous.secondFloorElectricityBill ||
      secondFloorMembers !== previous.activeMemberCounts['2nd'] ||
      thirdFloorBill !== previous.thirdFloorElectricityBill ||
      thirdFloorMembers !== previous.activeMemberCounts['3rd']
    ) {
      setFloorBillAmounts({
        '2nd': computePerHeadBill(secondFloorBill, secondFloorMembers),
        '3rd': computePerHeadBill(thirdFloorBill, thirdFloorMembers),
      });
    }
  };

  const monthlyDataCache = useRef<Map<string, FormData>>(new Map());
  const monthlyInitialValuesCache = useRef<Map<string, FormData>>(new Map());
  const isProcessingRef = useRef(false);
  const [isFetching, setIsFetching] = useState(false);

  // Add state for additional charges per head
  const [additionalChargesPerHead, setAdditionalChargesPerHead] = useState(0);

  const isUpdatingRef = useRef(false);

  // Watch for month changes
  form.watch('billingMonths.nextBillingMonth', ({ value: nextDate, previousValue: previousDate }) => {
    // Skip if we're in the middle of processing
    if (isProcessingRef.current) {
      return;
    }

    const currentMonthKey = new Date(nextDate || '').toISOString().slice(0, 7);
    const previousMonthKey = new Date(previousDate || '').toISOString().slice(0, 7);

    console.log('Detected month change:', { currentMonthKey, previousMonthKey });

    if (previousMonthKey === currentMonthKey) {
      isProcessingRef.current = true;
      form.setFieldValue('billingMonths.nextBillingMonth', previousDate);
      isProcessingRef.current = false;
      return;
    }

    // Only trigger if the month actually changed
    if (currentMonthKey !== previousMonthKey) {
      // First is always Generate, subsequent toggles are Update or Generate
      isUpdatingRef.current = !isUpdatingRef.current;

      handleMonthChange(currentMonthKey, previousMonthKey);
    }
  });

  // Extracted month change handler
  const handleMonthChange = useCallback(
    async (currentMonthKey: string, previousMonthKey: string) => {
      // Prevent re-entry
      if (isProcessingRef.current) {
        return;
      }

      console.log(`Month changed from ${previousMonthKey} to ${currentMonthKey}`);

      // Set processing flag immediately
      isProcessingRef.current = true;

      try {
        const previousValues = form.getValues();

        // Step 1: Always save previous month's data (with correct date)
        console.log(`Saving data for ${previousMonthKey}`);
        const dataToCache = {
          ...previousValues,
          billingMonths: {
            ...previousValues.billingMonths,
            // Store with the actual month key date
            nextBillingMonth: new Date(previousMonthKey + '-01'),
          },
        };
        monthlyDataCache.current.set(previousMonthKey, dataToCache);

        // Cache initial values for previous month if not already cached
        if (!monthlyInitialValuesCache.current.has(previousMonthKey)) {
          monthlyInitialValuesCache.current.set(previousMonthKey, form.getInitialValues());
        }

        // Step 2: Check for cached data for the new month
        const cachedData = monthlyDataCache.current.get(currentMonthKey);
        const cachedInitialValues = monthlyInitialValuesCache.current.get(currentMonthKey);

        if (cachedData) {
          console.log(`Restoring cached data for ${currentMonthKey}`);

          // Restore with the correct date for the current month
          const dataToRestore = {
            ...cachedData,
            billingMonths: {
              ...cachedData.billingMonths,
              nextBillingMonth: new Date(currentMonthKey + '-01'),
            },
          };

          form.setValues(dataToRestore);
          form.resetDirty(cachedInitialValues);
          //   setSelectedExpenseMembers(cachedData.additionalExpenses?.addExpenseMemberIds || []);

          // Update additionalChargesPerHead from cached data
          const expenseAmount = cachedData.additionalExpenses?.addExpenseAmount || 0;
          const expenseMemberCount = cachedData.additionalExpenses?.addExpenseMemberIds?.length || 0;
          setAdditionalChargesPerHead(computePerHeadBill(expenseAmount, expenseMemberCount));

          return;
        }

        // Step 3: Fetch data for new month
        console.log(`Fetching electric bill for ${currentMonthKey}`);
        setIsFetching(true);

        try {
          const bill = await fetchElectricBillByMonth(currentMonthKey);

          const billData: FormData = {
            billingMonths: {
              currentBillingMonth: data.billingMonths.currentBillingMonth.toDate(),
              nextBillingMonth: new Date(currentMonthKey + '-01'), // Use the month key to create correct date
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

          // Cache data
          monthlyDataCache.current.set(currentMonthKey, billData);
          monthlyInitialValuesCache.current.set(currentMonthKey, billData);

          // Update currentMonthRef BEFORE setting values
          //   currentMonthRef.current = currentMonthKey;

          if (
            activeMembers.length !== bill.expenses.members.length ||
            activeMembers.length !== bill.wifiCharges.members.length
          ) {
            console.log(
              `Warning: Active members count (${activeMembers.length}) does not match bill expense members count (${
                bill.expenses.members?.length || 0
              })`
            );
            const allBillMembers = new Set([...(bill.expenses.members || []), ...(bill.wifiCharges.members || [])]);
            const missingMembers = Array.from(allBillMembers).filter(
              (mId) => !activeMembers.some((am) => am.value === mId)
            );

            if (missingMembers.length > 0) {
              console.log(`Missing members in active list: ${missingMembers.join(', ')}`);
              activeMembers.push(
                ...missingMembers.map((mId) => ({ value: mId, label: 'Deleted member', disabled: true }))
              );
            }
          }

          form.setValues(billData);
          form.resetDirty(billData);
          //   setSelectedExpenseMembers(billData.additionalExpenses?.addExpenseMemberIds || []);

          // Update additionalChargesPerHead from cached data
          const expenseAmount = billData.additionalExpenses?.addExpenseAmount || 0;
          const expenseMemberCount = billData.additionalExpenses?.addExpenseMemberIds?.length || 0;
          setAdditionalChargesPerHead(computePerHeadBill(expenseAmount, expenseMemberCount));

          console.log(`Successfully loaded bill data for ${currentMonthKey}`);
        } catch (fetchError) {
          console.error(`Failed to fetch bill for ${currentMonthKey}:`, fetchError);

          // Revert to previous month
          const previousData = monthlyDataCache.current.get(previousMonthKey);
          const previousInitialValues = monthlyInitialValuesCache.current.get(previousMonthKey);

          if (previousData) {
            // Update currentMonthRef back to previous month
            // currentMonthRef.current = previousMonthKey;

            // Restore with correct date for previous month
            const dataToRestore = {
              ...previousData,
              billingMonths: {
                ...previousData.billingMonths,
                nextBillingMonth: new Date(previousMonthKey + '-01'),
              },
            };

            form.setValues(dataToRestore);
            form.resetDirty(previousInitialValues);
            // setSelectedExpenseMembers(previousData.additionalExpenses?.addExpenseMemberIds || []);

            // Update additionalChargesPerHead from cached data
            const expenseAmount = previousData.additionalExpenses?.addExpenseAmount || 0;
            const expenseMemberCount = previousData.additionalExpenses?.addExpenseMemberIds?.length || 0;
            setAdditionalChargesPerHead(computePerHeadBill(expenseAmount, expenseMemberCount));
          }

          notifyError(
            fetchError instanceof Error ? fetchError.message : `Failed to fetch electric bill for ${currentMonthKey}`
          );
        } finally {
          setIsFetching(false);
        }
      } finally {
        // Always reset processing flag
        isProcessingRef.current = false;
      }
    },
    [data.billingMonths, form, activeMembers]
  );

  // Derive floor selection state from selectedExpenseMembers (no ref needed)
  const floorSelectionState = (floor: Floor) =>
    activeMemberIdsByFloor[floor].every((id) => form.values.additionalExpenses?.addExpenseMemberIds?.includes(id));

  const toggleFloorExpense = (floor: Floor, checked: boolean) => {
    const current = new Set(form.values.additionalExpenses?.addExpenseMemberIds || []);
    const floorIds = activeMemberIdsByFloor[floor];

    if (checked) {
      floorIds.forEach((id) => current.add(id));
    } else {
      floorIds.forEach((id) => current.delete(id));
    }

    const newSelection = Array.from(current);
    form.setFieldValue('additionalExpenses.addExpenseMemberIds', newSelection);
    //   setSelectedExpenseMembers(newSelection);
  };

  const handleReset = () => {
    form.reset();
    // setSelectedExpenseMembers([]);
    setAdditionalChargesPerHead(0);
  };

  console.log('Rendering FormContent');
  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Box pos='relative'>
        <LoadingOverlay visible={isFetching} />

        <Stack gap='lg' mt='xl'>
          <Group gap='xs' align='center'>
            <Text size='sm' fw={500} flex={1}>
              Billing Month:
            </Text>
            <MonthPickerInput
              key={form.key('billingMonths.nextBillingMonth')}
              defaultValue={data.billingMonths.nextBillingMonth.toDate()}
              minDate={data.billingMonths.currentBillingMonth.toDate()}
              maxDate={data.billingMonths.nextBillingMonth.toDate()}
              popoverProps={{
                transitionProps: { transition: 'pop', duration: 200 },
              }}
              required
              flex={2}
              disabled={isFetching}
              {...form.getInputProps('billingMonths.nextBillingMonth')}
            />
          </Group>

          <Divider label='Electricity Charges' labelPosition='left' mt='md' />

          <Group align='flex-end' justify='center'>
            <NumberInputWithCurrency
              required
              label='2nd Floor'
              description={`₹${floorBillAmounts['2nd']}/member`}
              placeholder='500'
              flex={2}
              inputWrapperOrder={['label', 'input', 'description', 'error']}
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

          <Group align='flex-end' justify='center' key={`reset-expenses-group-${resetExpensesGroup}`}>
            <NumberInputWithCurrency
              required
              label='3rd Floor'
              description={`₹${floorBillAmounts['3rd']}/member`}
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
            checked={floorSelectionState('2nd')}
            onChange={(event) => toggleFloorExpense('2nd', event.currentTarget.checked)}
          />
          <Switch
            label='Add All Members on 3rd Floor'
            checked={floorSelectionState('3rd')}
            onChange={(event) => toggleFloorExpense('3rd', event.currentTarget.checked)}
          />

          <Group align='center' justify='center'>
            <MultiSelect
              label='Select Members'
              data={activeMembers}
              placeholder={form.values.additionalExpenses?.addExpenseMemberIds?.length ? '' : 'Select members'}
              required={
                !!form.values.additionalExpenses?.addExpenseAmount ||
                !!form.values.additionalExpenses?.addExpenseDescription
              } // Required if amount is filled
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
              label='Amount'
              description={additionalChargesPerHead ? `₹${additionalChargesPerHead}/member` : undefined}
              required={
                !!form.values.additionalExpenses?.addExpenseMemberIds?.length ||
                !!form.values.additionalExpenses?.addExpenseDescription
              } // Required if members are selected
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
            placeholder='Enter expense description'
            required={
              !!form.values.additionalExpenses?.addExpenseAmount ||
              !!form.values.additionalExpenses?.addExpenseMemberIds?.length
            } // Required if either amount or members are filled
            rightSection={
              form.values.additionalExpenses?.addExpenseDescription ? (
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

          <Group align='center' justify='center' key={`wifi-group-${resetWifiGroup}`}>
            <MultiSelect
              label='WiFi Members'
              data={activeMembers}
              required={!!form.getValues().wifiCharges?.wifiMonthlyCharge}
              placeholder={form.getValues().wifiCharges?.wifiMemberIds?.length ? undefined : 'Select members'}
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
              label='Amount'
              placeholder='600'
              required={!!form.getValues().wifiCharges?.wifiMemberIds?.length}
              description={wifiCharges ? `₹${wifiCharges}/member` : undefined}
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
              <Button variant='outline' disabled={!form.isDirty() || isFetching} onClick={handleReset}>
                Reset
              </Button>
              <Button type='submit' loading={isFetching} disabled={!form.isDirty()}>
                {isUpdatingRef.current ? 'Update' : 'Generate'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Box>
    </form>
  );
};
