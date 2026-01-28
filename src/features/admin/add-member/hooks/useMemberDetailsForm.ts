import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState, useTransition, startTransition } from "react";
import type { BedType, Floor } from "../../../../data/types";
import { normalizePhoneInput, formatPhoneNumber, toNumber, toIndianLocale } from "../../../../shared/utils";
import { notifyError, notifySuccess } from "../../../../shared/utils/notifications";
import type { MemberDetailsFormProps } from "../components/MemberDetailsForm";
import {
	calculateTotalDeposit,
	getInitialValues,
	validateName,
	validatePhoneNumber,
	validatePositiveInteger,
	validateSentence
} from "../utils/utils";
import { memberOperations } from "../../../../data/services/membersService";

export type MemberDetailsFormData = {
	name: string;
	phone: string;
	floor: Floor | null;
	bedType: BedType | null;
	rentAmount: number | string;
	rentAtJoining?: number | string;
	securityDeposit: number | string;
	advanceDeposit: number | string;
	isOptedForWifi: boolean;
	moveInDate: string;
	note: string;
	amountPaid: number | string;
	shouldForwardOutstanding: boolean;
	outstandingAmount: number | string;
};

export const useMemberDetailsForm = ({
	defaultValues,
	member,
	currentSettingsRent,
	action
}: MemberDetailsFormProps & { currentSettingsRent: number }) => {
	// Helper to calculate summary state
	const calculateSummary = (
		values: Pick<MemberDetailsFormData, "rentAmount" | "securityDeposit" | "advanceDeposit" | "amountPaid">
	) => {
		const rent = toNumber(values.rentAmount);
		const security = toNumber(values.securityDeposit);
		const advance = toNumber(values.advanceDeposit);
		const paid = toNumber(values.amountPaid);

		const total = calculateTotalDeposit(rent, security, advance);

		// Logic: If editing existing member, outstanding is based on agreed deposit.
		// If new member, it's based on current form totals.
		const outstanding =
			values.amountPaid ?
				member && action === "edit" ?
					paid - member.totalAgreedDeposit
				:	total - paid
			:	0;

		return {
			rentAmount: rent,
			securityDeposit: security,
			advanceDeposit: advance,
			total,
			outstanding
		};
	};

	const initialValues = getInitialValues({ defaultValues, member, action });

	// Single source of truth for the summary UI to avoid multiple re-renders
	const [summary, setSummary] = useState(() => calculateSummary(initialValues));
	const [formValues, setFormValues] = useState<MemberDetailsFormData>(initialValues);
	const [isSaving, saveTransition] = useTransition();
	const [isConfirmModalOpen, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);

	const form = useForm<MemberDetailsFormData>({
		mode: "uncontrolled",
		initialValues,
		onValuesChange(values, previous) {
			const floor = values.floor || previous.floor;

			// If floor has changed, reset bed type and rent amount
			const hasFloorChanged = values.floor !== previous.floor;
			if (hasFloorChanged) {
				form.setFieldValue("bedType", null);
				form.setFieldValue("rentAmount", "");
				return;
			}

			// If floor or bed type is null, clear rent amount
			if (floor === null || values.bedType === null) {
				// Only clear if it wasn't already empty to avoid loops
				if (values.rentAmount !== "") {
					form.setFieldValue("rentAmount", "");
					return;
				}
			}

			// If bed type has changed, update rent amount based on settings
			const hasBedTypeChanged = values.bedType !== previous.bedType;
			if (hasBedTypeChanged && floor && values.bedType) {
				const floorRents = defaultValues.bedRents[floor as Floor];
				let newRent = 0;

				if (values.bedType === "Bed") newRent = floorRents.Bed;
				else if (values.bedType === "Room") newRent = floorRents.Room;
				else if (floor === "2nd" && values.bedType === "Special")
					newRent = defaultValues.bedRents["2nd"].Special || 0;

				form.setFieldValue("rentAmount", newRent);
				form.setFieldValue("advanceDeposit", newRent);
				return;
			}

			// Check if any payment-related fields have changed to recalculate summary and set form values
			const hasPaymentFieldUpdates =
				values.rentAmount !== previous.rentAmount ||
				values.securityDeposit !== previous.securityDeposit ||
				values.advanceDeposit !== previous.advanceDeposit ||
				values.amountPaid !== previous.amountPaid;

			if (hasPaymentFieldUpdates) {
				// Use startTransition to avoid blocking UI updates
				startTransition(() => {
					const newSummary = calculateSummary(values);
					setSummary(newSummary);

					if (member && action === "edit") form.setFieldValue("amountPaid", newSummary.total);
					// Sync calculated outstanding back to form for submission
					// We check equality to avoid infinite loops
					if (values.outstandingAmount !== newSummary.outstanding) {
						form.setFieldValue("outstandingAmount", newSummary.outstanding);
						form.setFieldValue("shouldForwardOutstanding", newSummary.outstanding !== 0);
					}
				});
			}
		},
		validate: {
			name: validateName,
			phone: validatePhoneNumber,
			floor: (value) => (!value ? "Floor is required" : null),
			bedType: (value) => (!value ? "Bed type is required" : null),
			securityDeposit: (value) => validatePositiveInteger(value, defaultValues.securityDeposit),
			rentAmount: (value, values) => {
				if (!values.floor || !values.bedType) return "Floor and bed type are required";
				const baseRent = defaultValues.bedRents[values.floor][values.bedType];
				if (baseRent === undefined) return "Invalid bed type for selected floor";
				return validatePositiveInteger(value, baseRent);
			},
			note: (value) => validateSentence(value),
			amountPaid: (value) => {
				if (!!member && !value) return null;
				return validatePositiveInteger(value, 1000);
			}
		},
		transformValues: (values) => ({
			...values,
			name: values.name
				.trim()
				.split(" ")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
				.join(" "),
			phone: normalizePhoneInput(values.phone),
			note: values.note.trim()
		}),
		enhanceGetInputProps: (payload) => {
			if (payload.field === "phone") {
				const originalOnBlur = payload.inputProps.onBlur;
				return {
					...payload,
					onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
						const formattedValue = formatPhoneNumber(event.currentTarget.value);
						payload.form.setFieldValue("phone", formattedValue);
						originalOnBlur?.(event);
					}
				};
			}

			return {};
		}
	});

	const isRentMismatch = member ? member.currentRent !== currentSettingsRent : false;
	const isSecurityDepositMismatch = member ? member.securityDeposit !== defaultValues.securityDeposit : false;
	const shouldDisplayMismatchAlert = isRentMismatch || isSecurityDepositMismatch;
	const isButtonDisabled = !form.isDirty() || isSaving;

	const handleConfirm = (values: MemberDetailsFormData) => {
		console.log(values);
		closeConfirmModal();
		saveTransition(async () => {
			try {
				const result = await memberOperations({
					...values,
					id: member?.id,
					floor: values.floor!,
					bedType: values.bedType!,
					rentAmount: toNumber(values.rentAmount),
					rentAtJoining: values.rentAtJoining ? toNumber(values.rentAtJoining) : undefined,
					securityDeposit: toNumber(values.securityDeposit),
					advanceDeposit: toNumber(values.advanceDeposit),
					moveInDate: new Date(values.moveInDate),
					amountPaid: toNumber(values.amountPaid),
					outstandingAmount: toNumber(values.outstandingAmount),
					action
				});

				if (result.success) {
					notifySuccess("Member saved successfully");
					form.resetDirty();
				} else {
					const fieldErrors = result.errors.nested;
					const otherErrors = result.errors.other;
					const rootErrors = result.errors.root;
					if (fieldErrors) {
						console.log(fieldErrors);
						form.setErrors(fieldErrors);
						notifyError("Check the form for errors");
					} else if (otherErrors) {
						console.log(otherErrors);
						notifyError(otherErrors[0]);
					} else if (rootErrors) {
						notifyError(rootErrors[0]);
					} else {
						notifyError("Something went wrong");
					}
				}
			} catch (error) {
				console.error("Error in memberOperations:", error);
				notifyError(error instanceof Error ? error.message : "Something went wrong");
			}
		});
	};

	const handleFormReset = () => {
		form.reset();
		setSummary(calculateSummary(initialValues));
	};

	const generateNote = (values: MemberDetailsFormData) => {
		const dateText = "#" + dayjs().format("DD-MM-YYYY") + " — ";
		let note = dateText;
		note +=
			action === "edit" ? "Updated"
			: action === "reactivate" ? "Reactivated"
			: "Added";

		if (form.isDirty() && action !== "add") {
			Object.entries(form.getDirty()).forEach(([key, value]) => {
				if (
					value &&
					key !== "rentAmount" &&
					key !== "securityDeposit" &&
					key !== "advanceDeposit" &&
					key !== "shouldForwardOutstanding" &&
					key !== "outstandingAmount"
				) {
					note += `\r\n- ${key
						.replace(/([A-Z])/g, " $1")
						.replace(/^[a-z]/, (match) =>
							match.toUpperCase()
						)} changed from ${formValues[key as keyof MemberDetailsFormData]}`;
				}
			});
		}

		if (action === "add") {
			const defaultNote = `\n- At the time of joining, ${summary.total.toIndianLocale()} has been charged, that includes ${toIndianLocale(summary.rentAmount)} as Rent for the current month, ${toIndianLocale(summary.advanceDeposit)} as Advance Deposit and ${toIndianLocale(summary.securityDeposit)} as Security Deposit.`;
			// Get rent note
			const rentNote =
				values.shouldForwardOutstanding ?
					`${defaultNote}\n- However, ${toIndianLocale(values.amountPaid)} has been paid creating an Outstanding of ${toIndianLocale(values.outstandingAmount)}. This amount will be added to the current month's bill and will be forwarded to the next month's bill.`
				:	defaultNote;
			note += rentNote;
		}

		const addDashIfNeeded = (prevNote: string) => (prevNote.startsWith("#") ? "\n" + prevNote : "\n- " + prevNote);

		const previouNote = values.note;

		return previouNote ? `${note}${addDashIfNeeded(previouNote)}` : note;
	};

	const handleOnSave = (values: MemberDetailsFormData) => {
		const note = generateNote(values);
		setFormValues({ ...values, note });
		openConfirmModal();
	};

	const actions = {
		onSave: handleOnSave,
		onCloseConfirm: closeConfirmModal,
		onConfirm: handleConfirm,
		onHandleReset: handleFormReset
	};

	return {
		form,
		summary,
		formValues,
		isSaving,
		isConfirmModalOpen,
		isRentMismatch,
		isSecurityDepositMismatch,
		shouldDisplayMismatchAlert,
		isButtonDisabled,
		actions
	};
};
