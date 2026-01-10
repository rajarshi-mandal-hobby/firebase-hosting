import { useForm } from "@mantine/form";
import { useState, useEffectEvent, useEffect, useRef } from "react";
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
	// onModalSuccess,
	// onModalError,
	onModalError,
	modalActions: { isModalWorking, workingMemberName, selectedMember, handleModalWork }
}: RecordPaymentModalProps) => {
	const [status, setStatus] = useState<PaymentStatus>("Due");
	const { errorCache, removeErrorCache, addErrorCache, hasErrorCache } = useFormErrorCache<RecordPaymentFormData>();
	const isSuccessRef = useRef(false);
	const { totalCharges, amountPaid, note } = selectedMember?.currentMonthRent || {
		totalCharges: 0,
		amountPaid: 0,
		note: ""
	};
	const hasError = hasErrorCache(selectedMember?.id);

	const handleOnSuccess = async (id: string) => {
		// removeErrorCache(id);
		// onModalSuccess(id);
		onModalError<RecordPaymentFormData>({memberId: id, formValues: form.values, type: "recordPayment", isError: false });
	};

	const handleError = (id: string, values: RecordPaymentFormData) => {
		// onModalError(id);
		// addErrorCache(id, values);
		onModalError<RecordPaymentFormData>({memberId: id, formValues: values, type: "recordPayment", isError: true });
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

	// This event is used to set the form values when the modal is opened
	const setFormValuesEvent = useEffectEvent(() => {
		if (!selectedMember || !opened) return;
		// Reset the success flag
		isSuccessRef.current = false;
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
		setFormValuesEvent();
	}, [opened]);

	// Use useEffect to close the modal if it is open for the same working member
	// isModalWorking is the key to run the useEffect
	useEffect(() => {
		// Guard clause
		if (!opened || !isSuccessRef.current || workingMemberName !== selectedMember?.name) return;
		// Set a timeout of 250ms to close the modal
		const timeoutId = setTimeout(() => {
			console.log("useEffect called to close modal");
			if (opened && isSuccessRef.current && workingMemberName === selectedMember?.name) {
				onClose();
			}
		}, 250);
		// Always clear the timeout
		return () => clearTimeout(timeoutId);
	}, [onClose, opened, selectedMember, workingMemberName, isModalWorking]);

	const convertedAmount = toNumber(form.values.amountPaid);
	const newOutstanding = totalCharges - convertedAmount;
	const isPaymentBelowOutstanding = convertedAmount > 0 && convertedAmount < totalCharges;

	const statusColor = getStatusColor(status);
	const statusTitle = getStatusTitle(status);

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
				throw new Error("Random error");

				notifyUpdate(loadingNotification, message.replace("ing", "ed"), { type: "success" });
				handleOnSuccess(memberId);
				isSuccessRef.current = true;
			} catch (error) {
				notifyUpdate(loadingNotification, (error as Error).message, { type: "error" });
				handleError(memberId, form.values);
				isSuccessRef.current = false;
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
			handleRecordPayment,
			resetForm
		}
	};
};
