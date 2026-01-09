import { useForm } from "@mantine/form";
import { useState, useEffectEvent, useEffect, type TransitionStartFunction } from "react";
import type { Member, PaymentStatus } from "../../../../../../data/types";
import {
	getStatusColor,
	getStatusTitle,
	notifyLoading,
	notifyUpdate,
	toNumber,
	notifyError
} from "../../../../../../shared/utils";
import { simulateNetworkDelay, simulateRandomError } from "../../../../../../data/utils/serviceUtils";

type RecordPaymentFormData = {
	amountPaid: string | number;
	note: string;
};

interface UseRecordPaymentModalProps {
	opened: boolean;
	member: Member | null;
	onClose: () => void;
	onExitTransitionEnd: () => void;
	onModalWorking: TransitionStartFunction;
	onError: (id: string) => void;
	onSuccess: (id: string) => void;
}

const useFormErrorCache = <T>() => {
	const [errorCache, setErrorCache] = useState<Map<string, T>>(new Map());

	const hasErrorCache = (memberId?: string): boolean => {
		if (!memberId) return false;
		return errorCache.size > 0 && errorCache.has(memberId);
	};

	const removeErrorCache = (memberId: string) => {
		setErrorCache((prev) => {
			const prevMap = new Map(prev);
			prevMap.delete(memberId);
			return prevMap;
		});
	};

	const addErrorCache = (memberId: string, values: T) => {
		setErrorCache((prev) => {
			const prevMap = new Map(prev);
			prevMap.set(memberId, values);
			return prevMap;
		});
	};

	return {
		errorCache,
		removeErrorCache,
		addErrorCache,
		hasErrorCache
	};
};

export const useRecordPaymentModal = ({
	opened,
	member,
	onClose,
	onSuccess,
	onError,
	onExitTransitionEnd,
	onModalWorking
}: UseRecordPaymentModalProps) => {
	const [status, setStatus] = useState<PaymentStatus>("Due");
	const { errorCache, removeErrorCache, addErrorCache, hasErrorCache } = useFormErrorCache<RecordPaymentFormData>();
	const { totalCharges, amountPaid, note } = member?.currentMonthRent || {
		totalCharges: 0,
		amountPaid: 0,
		note: ""
	};
	const hasError = hasErrorCache(member?.id);

	const handleOnSuccess = (id: string) => {
		removeErrorCache(id);
		onSuccess(id);
		onClose();
	};

	const handleError = (id: string, values: RecordPaymentFormData) => {
		onError(id);
		addErrorCache(id, values);
	};

	const form = useForm<RecordPaymentFormData>({
		initialValues: {
			amountPaid: "",
			note: ""
		},
		onValuesChange(values) {
			const amount = toNumber(values.amountPaid);

			setStatus(() => {
				if (amount === 0) {
					return "Due";
				} else if (amount === totalCharges) {
					return "Paid";
				} else if (amount > 0 && amount < totalCharges) {
					return "Partial";
				} else if (amountPaid > totalCharges || amount > totalCharges) {
					return "Overpaid";
				}
				return "Paid";
			});
		},
		validate: {
			amountPaid: (value) => {
				if (value === "" || toNumber(value) < 0) {
					return "Please enter a valid amount";
				}
				return null;
			},
			note: (value, values) => {
				const amount = toNumber(values.amountPaid);
				if (amount > 0 && amount < totalCharges && !value) {
					return "Note is required for partial payments";
				}
				return null;
			}
		}
	});

	const effectEvent = useEffectEvent(() => {
		if (!member) return;
		// If there's an error, we'll use the cached values
		if (errorCache.has(member.id)) {
			form.setValues(errorCache.get(member.id)!);
			form.resetDirty({
				amountPaid: member.currentMonthRent.amountPaid || "",
				note: member.currentMonthRent.note
			});
			return;
		}
		// If there's no error, we'll use the current values
		form.setValues({
			amountPaid: amountPaid || "",
			note
		});
		form.resetDirty();
	});

	useEffect(() => {
		effectEvent();
	}, [opened]);

	const convertedAmount = toNumber(form.values.amountPaid);
	const newOutstanding = totalCharges - convertedAmount;
	const isPaymentBelowOutstanding = convertedAmount > 0 && convertedAmount < totalCharges;

	const statusColor = getStatusColor(status);
	const statusTitle = getStatusTitle(status);

	const handleExitTransitionEnd = () => {
		form.setValues({
			amountPaid: "",
			note: ""
		});
		form.resetDirty();
		setStatus("Due");
		onExitTransitionEnd();
	};

	const handleRecordPayment = () => {
		if (!member) {
			notifyError("Member not found");
			return;
		}

		const actionDone = convertedAmount === 0 ? "Removing" : "Recording";
		const message = actionDone + " payment for " + member.name;
		const loadingNotification = notifyLoading(message);
		onModalWorking(async () => {
			try {
				await simulateNetworkDelay(3000);
				simulateRandomError();
            throw new Error("Random error");

				notifyUpdate(loadingNotification, message.replace("ing", "ed"), { type: "success" });
				handleOnSuccess(member.id);
			} catch (error) {
				notifyUpdate(loadingNotification, (error as Error).message, { type: "error" });
				handleError(member.id, form.values);
			}
		});
	};

	const resetForm = () => {
		if (!member) return;
		form.reset();
		removeErrorCache(member.id);
		onSuccess(member.id);
	};

	return {
		form,
		status,
		statusColor,
		statusTitle,
		convertedAmount,
		newOutstanding,
		isPaymentBelowOutstanding,
		hasError,
		actions: {
			handleExitTransitionEnd,
			handleRecordPayment,
			resetForm
		}
	};
};
