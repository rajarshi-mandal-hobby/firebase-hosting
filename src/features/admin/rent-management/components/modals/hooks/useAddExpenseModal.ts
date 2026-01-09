import { useForm } from "@mantine/form";
import { useTransition, useState, startTransition, useEffectEvent, useEffect } from "react";
import { simulateNetworkDelay } from "../../../../../../data/utils/serviceUtils";
import { notifyLoading, notifyUpdate, toNumber } from "../../../../../../shared/utils";

interface FormExpenses {
	expenses: {
		description: string;
		amount: number | string;
	}[];
}

export const useAddExpenseModal = ({
	memberName,
	memberId,
	previousExpenses,
	opened,
	onSuccess,
	onClose,
	onError,
	onModalWorking
}: {
	memberName: string;
	memberId: string;
	previousExpenses: FormExpenses["expenses"];
	opened: boolean;
	onSuccess: (memberId: string) => void;
	onClose: () => void;
	onError: (error: string) => void;
	onModalWorking: (working: boolean) => void;
}) => {
	const [isSaving, startSaving] = useTransition();
	const [refreshKey, setRefreshKey] = useState(0);
	const [totalAmount, setTotalAmount] = useState(0);
	const [expenseFormCache, setExpenseFormCache] = useState<Map<string, FormExpenses["expenses"]>>(new Map());
	const [previousExpensesCache, setPreviousExpensesCache] = useState<FormExpenses["expenses"]>(previousExpenses);
	const hasPreviousExpenses = previousExpenses.length > 0;
	const hasError = expenseFormCache.has(memberId) ?? false;

	const clearCache = () => {
		setExpenseFormCache((prev) => {
			const newMap = new Map(prev);
			newMap.delete(memberId);
			return newMap;
		});
		onSuccess(memberId);
	};

	// ========== Form Setup ==========
	const form = useForm<FormExpenses>({
		mode: "uncontrolled",
		initialValues: {
			expenses: [
				{
					description: "",
					amount: ""
				}
			]
		},
		validate: {
			expenses: {
				description: (value, values, fieldName) => {
					const index = toNumber(fieldName.match(/\d+/)?.[0] ?? -1);
					const trimmed = value.trim();
					const rawAmount = values.expenses[index]?.amount ?? "";
					const amountNum = toNumber(rawAmount.toString().trim());

					const originalDescription = previousExpenses[index]?.description;

					// If there were initial expenses:
					// - fully empty row is allowed (meaning "I will remove this expense")
					// - but if amount is non-zero, description must be present
					if (hasPreviousExpenses && originalDescription) {
						const bothEmpty = !trimmed && (rawAmount === "" || amountNum === 0);
						if (bothEmpty) return null;

						if (amountNum !== 0 && !trimmed) {
							return "Description is required";
						}
						// If description is present, we'll validate amount in amount validator
						return null;
					}

					// If there were NO initial expenses:
					// both fields are required
					if (!trimmed) {
						return "Description is required";
					}

					return null;
				},
				amount: (value, values, fieldName) => {
					const index = toNumber(fieldName.match(/\d+/)?.[0] ?? -1);
					const raw = value.toString().trim();
					const num = toNumber(raw);
					const desc = values.expenses[index]?.description.trim() ?? "";

					const originalAmount = previousExpenses[index]?.amount;

					// If there were initial expenses:
					// - fully empty row is allowed (meaning "I will remove this expense")
					// - if description is present, amount must be non-zero
					// - if amount is non-zero, description must be present (handled in description validator)
					if (hasPreviousExpenses && originalAmount) {
						const bothEmpty = (!raw || num === 0) && !desc;
						if (bothEmpty) return null;

						// if description is present, amount must be non-empty
						if (desc && !raw) {
							return "Amount is required";
						}

						// Also forbid explicit 0 when something is entered
						if (raw && num === 0) {
							return "Amount cannot be zero";
						}

						// Positive or negative is allowed
						return null;
					}

					// If there were NO initial expenses:
					// both fields required and amount must be non-zero
					if (!raw) {
						return "Amount is required";
					}
					if (num === 0) {
						return "Amount cannot be zero";
					}

					return null;
				}
			}
		},
		validateInputOnBlur: true,
		transformValues: (values) => ({
			expenses: values.expenses.map((expense) => ({
				description: expense.description.trim(),
				amount: toNumber(expense.amount)
			}))
		}),
		onValuesChange(values, _previous) {
			startTransition(() => {
				const totalAmount = values.expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
				setTotalAmount(totalAmount);
			});
		}
	});

	// Use useEffectEvent to avoid dependency issues
	const addDefaultFormValuesEvent = useEffectEvent(() => {
		if (!opened || isSaving) return;
		if (hasError) {
			form.setValues({ expenses: expenseFormCache.get(memberId) });
			return;
		}
		setPreviousExpensesCache(previousExpenses);
		form.setValues({ expenses: hasPreviousExpenses ? previousExpenses : [{ description: "", amount: "" }] });
		form.resetDirty();
	});

	useEffect(() => {
		addDefaultFormValuesEvent();
	}, [opened]);

	// ========== State Getters ==========
	const currentExpenses = form.getValues().expenses;

	// Count how many *initial* expenses have been effectively removed
	const removedCount =
		opened && hasPreviousExpenses ?
			previousExpenses.reduce((count, _initial, index) => {
				const current = currentExpenses[index];
				// If current is undefined, it means the row was removed
				if (!current) {
					return count + 1;
				}
				const descEmpty = current.description.trim() !== previousExpenses[index].description.trim();
				const amountEmpty = current.amount.toString().trim() !== previousExpenses[index].amount.toString().trim();

				// Both fields empty -> treated as "removed"
				if (descEmpty && amountEmpty) {
					return count + 1;
				}

				return count;
			}, 0)
		:	0;
    console.log("removedCount", removedCount);

	const isRemoved = removedCount > 0;

	const isRemovedOrModified = isRemoved || form.isDirty();

	const isLastExpenseEntry = (expense: FormExpenses["expenses"][number], index: number): boolean => {
		if (!opened) return false;
		const expensesLength = currentExpenses.length;
		return (
			expensesLength >= 5 ||
			index !== expensesLength - 1 ||
			expense.description.trim() === "" ||
			toNumber(expense.amount) === 0
		);
	};

	const addExpenseItem = (): void => {
		form.insertListItem("expenses", { description: "", amount: "" });
		setRefreshKey((prev) => prev + 1);
	};

	const removeExpenseItem = (index: number): void => {
		if (currentExpenses.length > 1) {
			form.removeListItem("expenses", index);
			setPreviousExpensesCache((prev) => prev.filter((_, i) => i !== index));
			setRefreshKey((prev) => prev + 1);
		} else {
			form.replaceListItem("expenses", 0, { description: "", amount: "" });
			setPreviousExpensesCache((prev) => prev.filter((_, i) => i !== 0));
			setRefreshKey((prev) => prev + 1);
		}
		clearCache();
	};

	const resetExpenses = (index: number): void => {
		const original = previousExpensesCache[index];
		if (!original) return;

		form.replaceListItem("expenses", index, original);
		clearCache();
	};

	const handleOnSubmit = async (values: FormExpenses) => {
		onModalWorking(true);
		console.log("Expenses: ", values);

		const loadingNotificationId = notifyLoading(
			`${isRemovedOrModified ? "Updating" : "Adding"} expenses for ${memberName.split(" ")[0]}`
		);

		startSaving(async () => {
			try {
				// Mock API call - replace with actual Firebase function call
				await simulateNetworkDelay(3000);
				throw new Error("Simulated error"); // Uncomment to test error state

				notifyUpdate(
					loadingNotificationId,
					`${currentExpenses.length} expense(s) ${isRemovedOrModified ? "updated" : "added"}.`,
					{ type: "success" }
				);

				// On success, we clear the cache
				clearCache();
				onClose();
			} catch (error) {
				// On error, save current state to cache
				setExpenseFormCache((prev) => {
					const newMap = new Map(prev);
					newMap.set(memberId, [...currentExpenses]);
					return newMap;
				});
				onError(memberId);

				notifyUpdate(loadingNotificationId, (error as Error).message, { type: "error" });
			} finally {
				onModalWorking(false);
			}
		});
	};

    const resetRemoved = () => {
        // Get the previous values and filter out the previous expenses
        const prevValues = form.getValues().expenses;
        const initialValues = form.getInitialValues().expenses;
        const resultMap = [...initialValues, ...prevValues].reduce((acc, item) => {
            if (item.amount === "" && item.description === "") return acc;
            acc.set(item.amount, item);
            return acc;
        }, new Map<FormExpenses["expenses"][number]["amount"], FormExpenses["expenses"][number]>());
        const filteredValues = [...resultMap.values()]
        
        form.setValues({ expenses: filteredValues });
        setPreviousExpensesCache(previousExpenses);
        setRefreshKey((prev) => prev + 1);
    }

    const resetForm = () => {
        form.reset();
        setPreviousExpensesCache(previousExpenses);
        clearCache();
        setRefreshKey((prev) => prev + 1);
    }

	const actions = {
		handleOnSubmit,
		removeExpenseItem,
		resetExpenses,
		addExpenseItem,
		isLastExpenseEntry,
		resetRemoved,
        resetForm
	};

	return {
		form,
		totalAmount,
		currentExpenses,
		previousExpensesCache,
		removedCount,
		refreshKey,
		isSaving,
		isRemoved,
		isRemovedOrModified,
		hasError,
		hasPreviousExpenses,
		actions
	};
};
