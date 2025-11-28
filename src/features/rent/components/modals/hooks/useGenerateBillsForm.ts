import { useForm, type UseFormReturnType } from '@mantine/form';
import { useTransition, startTransition } from 'react';
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import type { GenerateBillsData } from './useGenerateBills';
import type { Floor } from '../../../../../data/shemas/GlobalSettings';
import { notifyError } from '../../../../../utils/notifications';
import { computePerHeadBill } from '../../../../../utils/utils';
import { formValidator, zInteger, zStringTrimmed, zThreeToFourDigit } from '../../../../../utils/validators';
import { fetchElectricBillByMonth } from '../../../../../data/services/electricService';

type DerivedUIState = {
  floorBills: { [F in Floor]: number };
  additionalChargesPerHead: number;
  wifiChargesPerHead: number;
  toggleState: Record<Floor, boolean>;
};

export type GenerateBillFormData = {
  selectedBillingMonth: string;
  secondFloorElectricityBill?: number;
  thirdFloorElectricityBill?: number;
  activeMemberCounts: {
    [F in Floor]: number;
  };
  wifiCharges: {
    wifiMonthlyCharge?: number;
    wifiMemberIds: string[];
  };
  additionalExpenses: {
    addExpenseMemberIds: string[];
    addExpenseAmount?: number;
    addExpenseDescription?: string;
  };
  isUpdatingBills: boolean;
  submittedMembers?: {
    memberOptions: { value: string; label: string }[];
    activeMembersIdsByFloor: Record<Floor, string[]>;
  };
};

type UseGenerateBillsFormReturn = {
  form: UseFormReturnType<GenerateBillFormData>;
  derivedState: DerivedUIState;
  deletedMembers: { value: string; label: string }[];
  isFetching: boolean;
  memberOptions: { value: string; label: string }[];
  toggleFloorExpense: (floor: Floor, checked: boolean) => void;
  handleSubmit: (values: GenerateBillFormData) => void;
};

export const useGenerateBillsForm = (
  billData: GenerateBillsData,
  onSubmit: (formData: GenerateBillFormData) => void,
): UseGenerateBillsFormReturn => {

  const [isFetching, startFetching] = useTransition();
  const [derivedState, setDerivedState] = useState<DerivedUIState>(() => ({
    floorBills: { '2nd': 0, '3rd': 0 },
    additionalChargesPerHead: 0,
    wifiChargesPerHead: 0,
    toggleState: { '2nd': false, '3rd': false },
  }));

  const monthlyDataCache = useRef<Map<string, GenerateBillFormData>>(new Map());
  const monthlyInitialValuesCache = useRef<Map<string, GenerateBillFormData>>(new Map());
  const [deletedMembers, setDeletedMembers] = useState<{ value: string; label: string }[]>([]);

  const computeDerivedState = (formValues: GenerateBillFormData): DerivedUIState => {
    return {
      floorBills: {
        '2nd': computePerHeadBill(formValues.secondFloorElectricityBill, formValues.activeMemberCounts['2nd']),
        '3rd': computePerHeadBill(formValues.thirdFloorElectricityBill, formValues.activeMemberCounts['3rd']),
      },
      additionalChargesPerHead: computePerHeadBill(
        formValues.additionalExpenses.addExpenseAmount,
        formValues.additionalExpenses.addExpenseMemberIds.length
      ),
      wifiChargesPerHead: computePerHeadBill(
        formValues.wifiCharges.wifiMonthlyCharge,
        formValues.wifiCharges.wifiMemberIds.length
      ),
      toggleState: (['2nd', '3rd'] as Floor[]).reduce((acc, floor) => {
        acc[floor] = billData.activeMembersIdsByFloor[floor].every((id) =>
          formValues.additionalExpenses.addExpenseMemberIds.includes(id)
        );
        return acc;
      }, {} as Record<Floor, boolean>),
    };
  };

  // ✅ Extract state comparison logic
  const hasStateChanged = (oldState: DerivedUIState, newState: DerivedUIState): boolean => {
    return (
      oldState.floorBills['2nd'] !== newState.floorBills['2nd'] ||
      oldState.floorBills['3rd'] !== newState.floorBills['3rd'] ||
      oldState.additionalChargesPerHead !== newState.additionalChargesPerHead ||
      oldState.wifiChargesPerHead !== newState.wifiChargesPerHead ||
      oldState.toggleState['2nd'] !== newState.toggleState['2nd'] ||
      oldState.toggleState['3rd'] !== newState.toggleState['3rd']
    );
  };

  // ✅ Extract deleted members calculation
  const calculateDeletedMembers = (prevMembers: Record<string, string>) => {
    return Object.keys(prevMembers)
      .filter((memberId) => !billData.membersOptions.some((opt) => opt.value === memberId))
      .map((memberId) => ({ value: memberId, label: prevMembers[memberId] }));
  };

  // ✅ Create form with all logic encapsulated
  const form = useForm<GenerateBillFormData>({
    mode: 'uncontrolled',
    initialValues: {
      selectedBillingMonth: dayjs(billData.billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD'),
      activeMemberCounts: billData.activeMembersCounts,
      wifiCharges: billData.wifiCharges,
      additionalExpenses: {
        addExpenseMemberIds: [],
        addExpenseAmount: undefined,
        addExpenseDescription: undefined,
      },
      secondFloorElectricityBill: undefined,
      thirdFloorElectricityBill: undefined,
      isUpdatingBills: false,
    },
    onValuesChange: (values, previous) => {
      // Handle billing month change first
      if (values.selectedBillingMonth !== previous.selectedBillingMonth) {
        handleDateChange(values, previous);
        return;
      }

      // Update derived state only if actual values changed
      startTransition(() => {
        setDerivedState((prev) => {
          const newState = computeDerivedState(values);
          return hasStateChanged(prev, newState) ? newState : prev;
        });
      });

      // Clear description if no expense data
      if (
        !values.additionalExpenses.addExpenseMemberIds.length &&
        !values.additionalExpenses.addExpenseAmount &&
        values.additionalExpenses.addExpenseDescription
      ) {
        form.setFieldValue('additionalExpenses.addExpenseDescription', undefined);
      }
    },
    validate: {
      selectedBillingMonth: formValidator.stringTrimmed,
      secondFloorElectricityBill: formValidator.threeToFourDigit,
      thirdFloorElectricityBill: formValidator.threeToFourDigit,
      activeMemberCounts: {
        '2nd': formValidator.activeMemberCount,
        '3rd': formValidator.activeMemberCount,
      },
      wifiCharges: {
        wifiMonthlyCharge: (value) => {
          if (!value && form.getValues().wifiCharges.wifiMemberIds.length === 0) {
            return null;
          }
          return formValidator.threeToFourDigit(value);
        },
        wifiMemberIds: (value) => {
          if (value.length === 0 && !form.values.wifiCharges.wifiMonthlyCharge) {
            return null;
          }
          return formValidator.arrayOfString(value);
        },
      },
      additionalExpenses: {
        addExpenseMemberIds: (value) => {
          if (value.length === 0 && !form.values.additionalExpenses.addExpenseAmount) {
            return null;
          }
          return formValidator.arrayOfString(value);
        },
        addExpenseAmount: (value) => {
          if (!value && form.values.additionalExpenses.addExpenseMemberIds.length === 0) {
            return null;
          }
          return formValidator.nonZero(value);
        },
        addExpenseDescription: (value) => {
          if (
            !value &&
            (!form.values.additionalExpenses.addExpenseMemberIds.length ||
              !form.values.additionalExpenses.addExpenseAmount)
          ) {
            return null;
          }
          return formValidator.stringTrimmed(value);
        },
      },
    },
    transformValues(values) {
      return {
        selectedBillingMonth: zStringTrimmed.parse(values.selectedBillingMonth),
        activeMemberCounts: {
          '2nd': zInteger.parse(values.activeMemberCounts['2nd']),
          '3rd': zInteger.parse(values.activeMemberCounts['3rd']),
        },
        wifiCharges: {
          wifiMonthlyCharge: zThreeToFourDigit.optional().parse(values.wifiCharges.wifiMonthlyCharge),
          wifiMemberIds: values.wifiCharges.wifiMemberIds,
        },
        additionalExpenses: {
          addExpenseMemberIds: values.additionalExpenses.addExpenseMemberIds,
          addExpenseAmount: zInteger.optional().parse(values.additionalExpenses.addExpenseAmount),
          addExpenseDescription: zStringTrimmed.optional().parse(values.additionalExpenses.addExpenseDescription),
        },
        secondFloorElectricityBill: zThreeToFourDigit.parse(values.secondFloorElectricityBill),
        thirdFloorElectricityBill: zThreeToFourDigit.parse(values.thirdFloorElectricityBill),
        isUpdatingBills: values.isUpdatingBills,
      };
    },
    enhanceGetInputProps: (payload) => {
      // Convert empty strings to undefined for all fields to aid Reset functionality
      const { inputProps } = payload;
      const originalOnChange = inputProps.onChange;
      return {
        ...inputProps,
        onChange: (val: unknown) => {
          originalOnChange(typeof val === 'string' && val.trim() === '' ? undefined : val);
        },
      };
    },
  });

  const fetchAndLoadBillData = async (dateToLoad: string) => {
    const bill = await fetchElectricBillByMonth(dateToLoad.slice(0, 7));

    const billExpenseIds = bill.expenses.members;
    const billWifiIds = bill.wifiCharges.members;

    const prevBillData: GenerateBillFormData = {
      selectedBillingMonth: dayjs(bill.billingMonth.toDate()).format('YYYY-MM-DD'),
      secondFloorElectricityBill: bill.floorCosts['2nd'].bill,
      thirdFloorElectricityBill: bill.floorCosts['3rd'].bill,
      activeMemberCounts: {
        '2nd': bill.floorCosts['2nd'].totalMembers,
        '3rd': bill.floorCosts['3rd'].totalMembers,
      },
      wifiCharges: {
        wifiMonthlyCharge: bill.wifiCharges.amount,
        wifiMemberIds: billWifiIds,
      },
      additionalExpenses: {
        addExpenseMemberIds: billExpenseIds,
        addExpenseAmount: bill.expenses.amount,
        addExpenseDescription: bill.expenses.description,
      },
      isUpdatingBills: true,
    };

    return { prevBillData, prevMembers: bill.memberMap };
  };

  function handleDateChange(values: GenerateBillFormData, previousValues: GenerateBillFormData) {
    const selectedDate = values.selectedBillingMonth;
    const currentMonthKey = dayjs(billData.billingMonths.currentBillingMonth.toDate()).format('YYYY-MM-DD');
    const nextMonthKey = dayjs(billData.billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD');

    const dateToSave = selectedDate === nextMonthKey ? currentMonthKey : nextMonthKey;
    const dateToLoad = selectedDate === currentMonthKey ? currentMonthKey : nextMonthKey;

    startFetching(async () => {
      // Cache current data
      monthlyDataCache.current.set(dateToSave, previousValues);
      if (!monthlyInitialValuesCache.current.has(dateToSave)) {
        monthlyInitialValuesCache.current.set(dateToSave, form.getInitialValues());
      }

      // Check cache first
      const cachedData = monthlyDataCache.current.get(dateToLoad);
      const initialValues = monthlyInitialValuesCache.current.get(dateToLoad);

      if (cachedData) {
        form.setValues(cachedData);
        form.resetDirty(initialValues);
        return;
      }

      // Fetch from server
      try {
        const { prevBillData, prevMembers } = await fetchAndLoadBillData(dateToLoad);

        const newDeletedMembers = calculateDeletedMembers(prevMembers);
        setDeletedMembers(newDeletedMembers);
        form.setValues(prevBillData);
        form.resetDirty(prevBillData);
      } catch (fetchError) {
        console.error(`Failed to fetch bill for ${dateToLoad}:`, fetchError);
        monthlyDataCache.current.delete(dateToLoad);

        // Revert to previous month
        const revertMonth = monthlyDataCache.current.get(dateToSave);
        if (revertMonth) {
          form.setValues(revertMonth);
          form.resetDirty(monthlyInitialValuesCache.current.get(dateToSave));
        }

        notifyError(
          fetchError instanceof Error ? fetchError.message : `Failed to fetch electric bill for ${dateToLoad}`
        );
      }
    });
  }

  const toggleFloorExpense = (floor: Floor, checked: boolean) => {
    const current = new Set(form.values.additionalExpenses.addExpenseMemberIds);
    const floorMembers = billData.activeMembersIdsByFloor[floor];

    floorMembers.forEach((memberId) => {
      if (checked) {
        current.add(memberId);
      } else {
        current.delete(memberId);
      }
    });

    form.setFieldValue('additionalExpenses.addExpenseMemberIds', Array.from(current));
  };

  const handleFormSubmit = (values: GenerateBillFormData) => {
    if (form.isValid()) {
      const isNextMonth =
        values.selectedBillingMonth === dayjs(billData.billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD');
      const memberOptions = isNextMonth ? billData.membersOptions : [...billData.membersOptions, ...deletedMembers];

      onSubmit({ ...values, submittedMembers: { memberOptions, activeMembersIdsByFloor: billData.activeMembersIdsByFloor } });
    }
  };

  const isNextMonth =
    form.values.selectedBillingMonth === dayjs(billData.billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD');
  const memberOptions = isNextMonth ? billData.membersOptions : [...billData.membersOptions, ...deletedMembers];

  return {
    form,
    derivedState,
    deletedMembers,
    isFetching,
    memberOptions,
    toggleFloorExpense,
    handleSubmit: handleFormSubmit,
  };
};
