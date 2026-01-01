import { useForm } from "@mantine/form";
import { useTransition, useState, useEffectEvent, useEffect } from "react";
import type { PaymentStatus } from "../../../../../../data/types";
import {
	getStatusColor,
	getStatusTitle,
	notifyLoading,
	formatNumberIndianLocale,
	notifyUpdate,
	toNumber
} from "../../../../../../shared/utils";

type RecordPaymentFormData = {
	amount: string | number;
	paymentNote: string;
};

interface UseRecordPaymentModalProps {
	opened: boolean;
	totalCharges: number;
	amountPaid: number;
	paymentNote: string;
	memberName: string;
	onClose: () => void;
	onExitTransitionEnd: () => void;
}

export const useRecordPaymentModal = ({
	opened,
	totalCharges,
	amountPaid,
	paymentNote,
	memberName,
	onClose,
	onExitTransitionEnd
}: UseRecordPaymentModalProps) => {
	const [isSaving, startTransition] = useTransition();
	const [status, setStatus] = useState<PaymentStatus>("Due");

	const form = useForm<RecordPaymentFormData>({
		initialValues: {
			amount: "",
			paymentNote: ""
		},
		onValuesChange(values) {
			const amount = toNumber(values.amount);

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
			amount: (value) => {
				if (value === "" || toNumber(value) < 0) {
					return "Please enter a valid amount";
				}
				return null;
			},
			paymentNote: (value, values) => {
				const amount = toNumber(values.amount);
				if (amount > 0 && amount < totalCharges && !value.trim()) {
					return "Payment note is required for partial payments";
				}
				return null;
			}
		}
	});

	const effectEvent = useEffectEvent(() => {
		form.setValues({
			amount: amountPaid || "",
			paymentNote: paymentNote
		});
		form.resetDirty();
	});

	useEffect(() => {
		if (opened) effectEvent();
	}, [opened]);

	const convertedAmount = toNumber(form.values.amount);
	const newOutstanding = totalCharges - convertedAmount;
	const isPaymentBelowOutstanding = convertedAmount > 0 && convertedAmount < totalCharges;

	const statusColor = getStatusColor(status);
	const statusTitle = getStatusTitle(status);

	const handleExitTransitionEnd = () => {
		form.setValues({
			amount: "",
			paymentNote: ""
		});
		form.resetDirty();
		setStatus("Due");
		onExitTransitionEnd();
	};

	const handleRecordPayment = () => {
		const loadingNotification = notifyLoading(
			`Recording payment of ${formatNumberIndianLocale(convertedAmount)} for ${memberName}`
		);
		startTransition(async () => {
			try {
				await new Promise((resolve) => setTimeout(resolve, 5000));
				const message = convertedAmount === 0 ? "removed" : "recorded";
				notifyUpdate(
					loadingNotification,
					`Payment of ${formatNumberIndianLocale(convertedAmount)} ${message} successfully for ${memberName}`,
					{ type: "success" }
				);
				onClose(); // reset will happen via onExitTransitionEnd
			} catch {
				notifyUpdate(loadingNotification, "Failed to record payment. Please try again.", { type: "error" });
			}
		});
	};

	return {
		form,
		status,
		statusColor,
		statusTitle,
		isSaving,
		convertedAmount,
		newOutstanding,
		isPaymentBelowOutstanding,
		actions: {
			handleExitTransitionEnd,
			handleRecordPayment
		}
	};
};
