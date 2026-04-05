import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import { useTransition, useState, useRef, startTransition } from 'react';
import type { Floor } from '../../../../../../data/types';
import { notifyError } from '../../../../../../shared/utils';
import type { BillsConfirmModalFormData } from '../../hooks/useBillsConfirmModal';
import type { GenerateBillsData } from '../../hooks/useBillsData';
import { computePerHeadBill, computeToggleState } from '../utils/utils';
import { fetchElectricity } from './useBillFetchElectricity';

type DerivedUIState = {
    floorBills: { [F in Floor]: number };
    additionalChargesPerHead: number;
    wifiChargesPerHead: number;
};

export interface BillFormData {
    selectedBillingMonth: string;
    secondFloorElectricityBill: number | string;
    thirdFloorElectricityBill: number | string;
    secondFloorActiveMemberCount: number;
    thirdFloorActiveMemberCount: number;
    wifiMonthlyCharge: number | string;
    wifiMemberIds: string[];
    addExpenseMemberIds: string[];
    addExpenseAmount: number | string;
    addExpenseDescription: string;
    isUpdatingBills: boolean;
}

export const useBillsForm = ({ floorIdNameMap, billingMonths, wifiCharges, membersOptions }: GenerateBillsData) => {
    const [isFetching, startFetching] = useTransition();
    const [computedBills, setDerivedState] = useState<DerivedUIState>({
        floorBills: { '2nd': 0, '3rd': 0 },
        additionalChargesPerHead: 0,
        wifiChargesPerHead: computePerHeadBill(wifiCharges.wifiMonthlyCharge, wifiCharges.wifiMemberIds.length)
    });
    const [toggleState, setToggleState] = useState<Record<Floor, boolean>>({
        '2nd': false,
        '3rd': false
    });

    // Modal state management
    const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
    const [submittedFormData, setSubmittedFormData] = useState<BillsConfirmModalFormData | null>(null);
    // Caches for monthly data
    const monthlyDataCache = useRef<Map<string, BillFormData>>(new Map());
    const monthlyInitialValuesCache = useRef<Map<string, BillFormData>>(new Map());
    // Previous month's data
    const [prevMemberOptions, setPrevMemberOptions] = useState<{ value: string; label: string }[]>([]);
    const [prevFloorIdNameMap, setPrevFloorIdNameMap] = useState(floorIdNameMap);
    const failedFetchMonth = useRef<string | null>(null);
    // Toggle State Management

    const handleDateChange = (values: BillFormData, previousValues: BillFormData) => {
        const selectedDate = values.selectedBillingMonth;
        const currentMonthKey = dayjs(billingMonths.currentBillingMonth.toDate()).format('YYYY-MM-DD');
        const nextMonthKey = dayjs(billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD');

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

            if (cachedData && failedFetchMonth.current !== dateToLoad) {
                form.setValues(cachedData);
                form.resetDirty(initialValues);
                return;
            }

            try {
                const { formData, metaData } = await fetchElectricity(dateToLoad, membersOptions, prevFloorIdNameMap);

                console.log('New member options', metaData.prevMembersOptions);

                form.setValues(formData);
                form.resetDirty(formData);
                setPrevMemberOptions(metaData.prevMembersOptions);
                setPrevFloorIdNameMap(metaData.prevFloorIdNameMap);
                failedFetchMonth.current = null;
            } catch (err) {
                failedFetchMonth.current = dateToLoad;
                monthlyDataCache.current.delete(dateToLoad);

                // Revert to previous month
                const revertMonth = monthlyDataCache.current.get(dateToSave);
                if (revertMonth) {
                    form.setValues(revertMonth);
                    form.resetDirty(monthlyInitialValuesCache.current.get(dateToSave));
                }
                notifyError((err as Error).message);
            }
        });
    };

    const form = useForm<BillFormData>({
        mode: 'uncontrolled',
        initialValues: {
            selectedBillingMonth: dayjs(billingMonths.nextBillingMonth.toDate()).format('YYYY-MM-DD'),
            wifiMonthlyCharge: wifiCharges.wifiMonthlyCharge,
            wifiMemberIds: wifiCharges.wifiMemberIds,
            secondFloorActiveMemberCount: Object.keys(floorIdNameMap['2nd']).length,
            thirdFloorActiveMemberCount: Object.keys(floorIdNameMap['3rd']).length,
            addExpenseMemberIds: [],
            addExpenseAmount: '',
            addExpenseDescription: '',
            secondFloorElectricityBill: '',
            thirdFloorElectricityBill: '',
            isUpdatingBills: false
        },
        onValuesChange: (values, previous) => {
            // Handle billing month change first
            if (values.selectedBillingMonth !== previous.selectedBillingMonth) {
                handleDateChange(values, previous);
                return;
            }

            startTransition(() => {
                setDerivedState({
                    floorBills: {
                        '2nd': computePerHeadBill(
                            values.secondFloorElectricityBill,
                            values.secondFloorActiveMemberCount
                        ),
                        '3rd': computePerHeadBill(values.thirdFloorElectricityBill, values.thirdFloorActiveMemberCount)
                    },
                    additionalChargesPerHead: computePerHeadBill(
                        values.addExpenseAmount,
                        values.addExpenseMemberIds.length
                    ),
                    wifiChargesPerHead: computePerHeadBill(values.wifiMonthlyCharge, values.wifiMemberIds.length)
                });

                setToggleState(computeToggleState(values, floorIdNameMap, prevFloorIdNameMap));
            });

            // Clear description if no expense data
            if (!values.addExpenseMemberIds.length && !values.addExpenseAmount && values.addExpenseDescription) {
                form.setFieldValue('addExpenseDescription', '');
            }
        },
        validate: {
            wifiMonthlyCharge: (value, values) => {
                if (value && values.wifiMemberIds.length === 0) {
                    return 'Please select at least one member';
                }
            },
            wifiMemberIds: (value, values) => {
                if (value.length === 0 && values.wifiMonthlyCharge) {
                    return 'Please enter a wifi monthly charge';
                }
            },

            addExpenseMemberIds: (value, values) => {
                if (value.length === 0 && values.addExpenseAmount) {
                    return 'Please enter an expense amount';
                }
            },
            addExpenseAmount: (value, values) => {
                if (value && values.addExpenseMemberIds.length === 0) {
                    return 'Please select at least one member';
                }
            },
            addExpenseDescription: (value, values) => {
                if (values.addExpenseAmount && !value) {
                    return 'Please enter an expense description';
                }
            }
        }
    });

    const toggleFloorExpense = (floor: Floor, checked: boolean) => {
        const current = new Set(form.getValues().addExpenseMemberIds);
        const idNameMap = form.getValues().isUpdatingBills ? prevFloorIdNameMap : floorIdNameMap;
        const floorMembers = Object.keys(idNameMap[floor]);
        for (const memberId of floorMembers) {
            if (checked) {
                current.add(memberId);
            } else {
                current.delete(memberId);
            }
        }

        form.setFieldValue('addExpenseMemberIds', [...current]);
    };

    const handleFormSubmit = (values: BillFormData) => {
        setSubmittedFormData({
            ...values,
            submittedMembers: {
                floorIdNameMap: values.isUpdatingBills ? prevFloorIdNameMap : floorIdNameMap
            }
        });
        openConfirmModal();
    };

    // Submit form data
    const handleConfirm = () => {
        if (submittedFormData) {
            closeConfirmModal();
        }
    };

    const segmentedControlData = Object.values(billingMonths).map((month) => ({
        label: dayjs(month.toDate()).format('MMMM YYYY'),
        value: dayjs(month.toDate()).format('YYYY-MM-DD')
    }));

    return {
        form,
        segmentedControlData,
        derivedState: computedBills,
        toggleState,
        isFetching,
        memberOptions: form.getValues().isUpdatingBills ? prevMemberOptions : membersOptions,
        floorIdNameMap: form.getValues().isUpdatingBills ? prevFloorIdNameMap : floorIdNameMap,
        actions: {
            toggleFloorExpense,
            handleFormSubmit
        },
        modalActions: {
            confirmModalOpened,
            submittedFormData,
            openConfirmModal,
            closeConfirmModal,
            handleConfirm
        }
    };
};
