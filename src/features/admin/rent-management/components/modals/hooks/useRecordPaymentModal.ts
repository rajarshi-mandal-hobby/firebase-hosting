import { useForm } from "@mantine/form";
import { useState, useEffectEvent, useEffect } from "react";
import type { PaymentStatus } from "../../../../../../data/types";
import {
	getStatusColor,
	getStatusTitle,
	notifyLoading,
	notifyUpdate,
	toNumber,
	notifyError
} from "../../../../../../shared/utils";
import { simulateNetworkDelay, simulateRandomError } from "../../../../../../data/utils/serviceUtils";
import type { RecordPaymentModalProps } from "../RecordPaymentModal";
import { useFormErrorCache } from "./useFormErrorCache";

type RecordPaymentFormData = {
	amountPaid: string | number;
	note: string;
};

export const useRecordPaymentModal = ({
	opened,
	onClose,
	onModalSuccess,
	onModalError,
	modalActions: { workingMemberName, selectedMember, handleModalWork, handleExitTransitionEnd }
}: RecordPaymentModalProps) => {
	const [status, setStatus] = useState<PaymentStatus>("Due");
	const { errorCache, removeErrorCache, addErrorCache, hasErrorCache } = useFormErrorCache<RecordPaymentFormData>();
	const { totalCharges, amountPaid, note } = selectedMember?.currentMonthRent || {
		totalCharges: 0,
		amountPaid: 0,
		note: ""
	};
	const hasError = hasErrorCache(selectedMember?.id);

	console.log("useRecordPaymentModal", workingMemberName, selectedMember?.name);

	const handleOnSuccess = async (id: string) => {
		removeErrorCache(id);
		onModalSuccess(id);

		console.log("handleOnSuccess", id, workingMemberName);
		if (workingMemberName === selectedMember?.name) {
			await simulateNetworkDelay(500);
			onClose();
		}
	};

	const handleError = (id: string, values: RecordPaymentFormData) => {
		console.log("handleError", id);
		onModalError(id);
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
		if (!selectedMember || !opened) return;
		console.log("effectEvent called");

		// If there's an error, we'll use the cached values
		if (errorCache.has(selectedMember.id)) {
			form.setValues(errorCache.get(selectedMember.id)!);
			form.resetDirty({
				amountPaid: selectedMember.currentMonthRent.amountPaid || "",
				note: selectedMember.currentMonthRent.note
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

	const handleModalExitTransitionEnd = () => {
		console.log("handleModalExitTransitionEnd called");
		form.setValues({
			amountPaid: "",
			note: ""
		});
		form.resetDirty();
		setStatus("Due");
		handleExitTransitionEnd();
	};

	const handleRecordPayment = () => {
		if (!selectedMember) {
			notifyError("Member not found");
			return;
		}

		const memberName = selectedMember.name;
		const memberId = selectedMember.id;
		const actionDone = convertedAmount === 0 ? "Removing" : "Recording";
		const message = actionDone + " payment for " + memberName;
		const loadingNotification = notifyLoading(message);
		handleModalWork(memberName, async () => {
			try {
				await simulateNetworkDelay(3000);
				simulateRandomError();
				// throw new Error("Random error");

				notifyUpdate(loadingNotification, message.replace("ing", "ed"), { type: "success" });
				handleOnSuccess(memberId);
			} catch (error) {
				notifyUpdate(loadingNotification, (error as Error).message, { type: "error" });
				handleError(memberId, form.values);
			}
		});
	};

	const resetForm = () => {
		if (!selectedMember) return;
		form.reset();
		removeErrorCache(selectedMember.id);
		onModalSuccess(selectedMember.id);
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
			handleModalExitTransitionEnd,
			handleRecordPayment,
			resetForm
		}
	};
};
