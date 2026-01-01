import { useForm } from "@mantine/form";
import { startTransition, useTransition } from "react";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import type { GenerateBillsData } from "./useBillsData";
import { notifyError, notifySuccess } from "../../../../shared/utils/notifications";
import { useDisclosure } from "@mantine/hooks";
import { Floors, type Floor } from "../../../../data/types";
import { computePerHeadBill } from "../utils";
import { toNumber } from "../../../../shared/utils";
import { useBillFetchElectricity } from "./useBillFetchElectricity";
import type { BillsConfirmModalFormData } from "./useBillsConfirmModal";
import { saveBillData } from "../../../../data/services/billsService";

type DerivedUIState = {
	floorBills: { [F in Floor]: number };
	additionalChargesPerHead: number;
	wifiChargesPerHead: number;
};

export type BillFormData = {
	selectedBillingMonth: string;
	secondFloorElectricityBill: number | string;
	thirdFloorElectricityBill: number | string;
	activeMemberCounts: {
		[F in Floor]: number;
	};
	wifiCharges: {
		wifiMonthlyCharge: number | string;
		wifiMemberIds: string[];
	};
	additionalExpenses: {
		addExpenseMemberIds: string[];
		addExpenseAmount: number | string;
		addExpenseDescription: string;
	};
	isUpdatingBills: boolean;
};

export const useBillsForm = ({ floorIdNameMap, billingMonths, wifiCharges, membersOptions }: GenerateBillsData) => {
	const [isFetching, startFetching] = useTransition();
	const [computedBills, setDerivedState] = useState<DerivedUIState>({
		floorBills: { "2nd": 0, "3rd": 0 },
		additionalChargesPerHead: 0,
		wifiChargesPerHead: computePerHeadBill(wifiCharges.wifiMonthlyCharge, wifiCharges.wifiMemberIds.length)
	});
	const [toggleState, setToggleState] = useState<Record<Floor, boolean>>({
		"2nd": false,
		"3rd": false
	});

	// Modal state management
	const [confirmModalOpened, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
	const [submittedFormData, setSubmittedFormData] = useState<BillsConfirmModalFormData | null>(null);
	// Caches for monthly data
	const monthlyDataCache = useRef<Map<string, BillFormData>>(new Map());
	const monthlyInitialValuesCache = useRef<Map<string, BillFormData>>(new Map());
	// Previous month's data
	const { fetchAndLoadBillData } = useBillFetchElectricity();
	const [prevMemberOptions, setPrevMemberOptions] = useState<{ value: string; label: string }[]>([]);
	const [prevFloorIdNameMap, setPrevFloorIdNameMap] = useState(floorIdNameMap);
	const failedFetchMonth = useRef<string | null>(null);
	// Toggle State Management
	const computeToggleState = (formValues: BillFormData) => {
		const isNextMonth = !formValues.isUpdatingBills;
		const expenseIdsLookUp = new Set(formValues.additionalExpenses.addExpenseMemberIds);
		const floorExpensesStatus = {} as Record<Floor, boolean>;

		for (const floor of Object.values(Floors)) {
			floorExpensesStatus[floor] = Object.keys(
				isNextMonth ? floorIdNameMap[floor] : prevFloorIdNameMap[floor]
			).every((id) => expenseIdsLookUp.has(id));
		}

		return floorExpensesStatus;
	};

	const handleDateChange = (values: BillFormData, previousValues: BillFormData) => {
		const selectedDate = values.selectedBillingMonth;
		const currentMonthKey = dayjs(billingMonths.currentBillingMonth.toDate()).format("YYYY-MM-DD");
		const nextMonthKey = dayjs(billingMonths.nextBillingMonth.toDate()).format("YYYY-MM-DD");

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

			// Fetch from server
			try {
				const prevBillData = await fetchAndLoadBillData(
					dateToLoad,
					failedFetchMonth.current,
					membersOptions,
					prevFloorIdNameMap
				);

				setPrevMemberOptions(prevBillData.prevMembersOptions);
				setPrevFloorIdNameMap(prevBillData.prevFloorIdNameMap);
				form.setValues(prevBillData);
				form.resetDirty(prevBillData);
				failedFetchMonth.current = null;
			} catch (err) {
				failedFetchMonth.current = dateToLoad;
				console.error(`Failed to fetch bill for ${dateToLoad}:`, err);
				monthlyDataCache.current.delete(dateToLoad);

				// Revert to previous month
				const revertMonth = monthlyDataCache.current.get(dateToSave);
				if (revertMonth) {
					form.setValues(revertMonth);
					form.resetDirty(monthlyInitialValuesCache.current.get(dateToSave));
				}

				console.error((err as Error).message);
				notifyError(`Failed to fetch electric bill for ${dayjs(dateToLoad).format("MMMM YYYY")}`);
			}
		});
	};

	const form = useForm<BillFormData>({
		mode: "uncontrolled",
		initialValues: {
			selectedBillingMonth: dayjs(billingMonths.nextBillingMonth.toDate()).format("YYYY-MM-DD"),
			wifiCharges: {
				wifiMonthlyCharge: wifiCharges.wifiMonthlyCharge,
				wifiMemberIds: wifiCharges.wifiMemberIds
			},
			activeMemberCounts: Object.values(Floors).reduce(
				(acc, floor) => {
					acc[floor] = Object.keys(floorIdNameMap[floor]).length;
					return acc;
				},
				{} as Record<Floor, number>
			),
			additionalExpenses: {
				addExpenseMemberIds: [],
				addExpenseAmount: "",
				addExpenseDescription: ""
			},
			secondFloorElectricityBill: "",
			thirdFloorElectricityBill: "",
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
						"2nd": computePerHeadBill(values.secondFloorElectricityBill, values.activeMemberCounts["2nd"]),
						"3rd": computePerHeadBill(values.thirdFloorElectricityBill, values.activeMemberCounts["3rd"])
					},
					additionalChargesPerHead: computePerHeadBill(
						values.additionalExpenses.addExpenseAmount,
						values.additionalExpenses.addExpenseMemberIds.length
					),
					wifiChargesPerHead: computePerHeadBill(
						values.wifiCharges.wifiMonthlyCharge,
						values.wifiCharges.wifiMemberIds.length
					)
				});

				setToggleState(computeToggleState(values));
			});

			// Clear description if no expense data
			if (
				!values.additionalExpenses.addExpenseMemberIds.length &&
				!values.additionalExpenses.addExpenseAmount &&
				values.additionalExpenses.addExpenseDescription
			) {
				form.setFieldValue("additionalExpenses.addExpenseDescription", "");
			}
		},
		validate: {
			wifiCharges: {
				wifiMonthlyCharge: (value, values) => {
					if (value && values.wifiCharges.wifiMemberIds.length === 0) {
						return "Please select at least one member";
					}
				},
				wifiMemberIds: (value, values) => {
					if (value.length === 0 && values.wifiCharges.wifiMonthlyCharge) {
						return "Please enter a wifi monthly charge";
					}
				}
			},
			additionalExpenses: {
				addExpenseMemberIds: (value, values) => {
					if (value.length === 0 && values.additionalExpenses.addExpenseAmount) {
						return "Please enter an expense amount";
					}
				},
				addExpenseAmount: (value, values) => {
					if (value && values.additionalExpenses.addExpenseMemberIds.length === 0) {
						return "Please select at least one member";
					}
				},
				addExpenseDescription: (value, values) => {
					if (values.additionalExpenses.addExpenseAmount && !value) {
						return "Please enter an expense description";
					}
				}
			}
		},
		transformValues: (values) => ({
			selectedBillingMonth: values.selectedBillingMonth,
			activeMemberCounts: {
				"2nd": toNumber(values.activeMemberCounts["2nd"]),
				"3rd": toNumber(values.activeMemberCounts["3rd"])
			},
			wifiCharges: {
				wifiMonthlyCharge: toNumber(values.wifiCharges.wifiMonthlyCharge),
				wifiMemberIds: values.wifiCharges.wifiMemberIds
			},
			additionalExpenses: {
				addExpenseMemberIds: values.additionalExpenses.addExpenseMemberIds,
				addExpenseAmount: toNumber(values.additionalExpenses.addExpenseAmount),
				addExpenseDescription: values.additionalExpenses.addExpenseDescription
			},
			secondFloorElectricityBill: toNumber(values.secondFloorElectricityBill),
			thirdFloorElectricityBill: toNumber(values.thirdFloorElectricityBill),
			isUpdatingBills: values.isUpdatingBills
		})
	});

	const toggleFloorExpense = (floor: Floor, checked: boolean) => {
		const current = new Set(form.values.additionalExpenses.addExpenseMemberIds);
		const floorMembers = Object.keys(floorIdNameMap[floor]);

		for (const memberId of floorMembers) {
			if (checked) {
				current.add(memberId);
			} else {
				current.delete(memberId);
			}
		}

		form.setFieldValue("additionalExpenses.addExpenseMemberIds", [...current]);
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
			startFetching(async () => {
				try {
					const result = await saveBillData(submittedFormData);
					if (!result.success) {
						if (result.errors.nested) {
							form.setErrors(result.errors.nested);
							if (result.errors.nested.isUpdatingBills && result.errors.nested.isUpdatingBills.length > 0) {
								notifyError("Error: " + result.errors.nested.isUpdatingBills[0]);
							} else {
								notifyError("Check form errors");
							}
						} else {
							const otherErrors = result.errors.other || result.errors.root || ["Unknown error"];
							notifyError(otherErrors.join(", "));
						}
					} else {
						notifySuccess("Bill saved successfully");
					}
				} catch (error) {
					console.error("Failed to save bill data:", error);
					notifyError("Failed to save bill data");
				}
			});
		}
	};

	const segmentedControlData = Object.values(billingMonths).map((month) => ({
		label: dayjs(month.toDate()).format("MMMM YYYY"),
		value: dayjs(month.toDate()).format("YYYY-MM-DD")
	}));

	return {
		form,
		segmentedControlData,
		derivedState: computedBills,
		toggleState,
		isFetching,
		memberOptions: form.values.isUpdatingBills ? prevMemberOptions : membersOptions,
		floorIdNameMap: form.values.isUpdatingBills ? prevFloorIdNameMap : floorIdNameMap,
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

