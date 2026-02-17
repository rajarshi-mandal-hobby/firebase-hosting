import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import { useState, useTransition, startTransition } from 'react';
import { BedTypes, Floors, type BedType, type Floor } from '../../../../data/types';
import { normalizePhoneInput, formatPhoneNumber, toNumber, toIndianLocale } from '../../../../shared/utils';
import { notifyError, notifySuccess } from '../../../../shared/utils/notifications';
import type { MemberDetailsFormProps } from '../components/MemberDetailsForm';
import {
    calculateSummary,
    getInitialValues,
    validateName,
    validatePhoneNumber,
    validatePositiveInteger,
    validateSentence
} from '../utils/utils';
import { memberOperations } from '../../../../data/services/membersService';

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
    defaultRents,
    member,
    currentSettingsRent,
    memberAction: action
}: MemberDetailsFormProps & { currentSettingsRent: number }) => {
    const initialValues = getInitialValues({ defaultRents, member, memberAction: action });

    // Single source of truth for the summary UI to avoid multiple re-renders
    const [summary, setSummary] = useState(() => calculateSummary(initialValues, member, action));
    const [formValues, setFormValues] = useState<MemberDetailsFormData>(initialValues);
    const [isSaving, saveTransition] = useTransition();
    const [isConfirmModalOpen, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
    // Floor Select Values
    const secondFloorSelectData = Object.entries(Floors).map(([_, value]) => ({
        value,
        label: `${value} Floor`
    }));
    // Change 3rd floor select data
    const [thirdFlSelectData, setThirdFlSelectData] = useState(
        Object.entries(BedTypes).map(([_, value]) => ({
            value,
            label: value,
            disabled: value === BedTypes.special
        }))
    );

    const form = useForm<MemberDetailsFormData>({
        mode: 'uncontrolled',
        initialValues,
        onValuesChange(values, previous) {
            const { floor, bedType, rentAmount, securityDeposit, advanceDeposit, amountPaid, outstandingAmount } =
                values;
            // Handle Floor Change
            if (floor !== previous.floor) {
                form.setValues({ bedType: null, rentAmount: '', advanceDeposit: '' });

                setThirdFlSelectData((prev) =>
                    prev.map((item) =>
                        item.value === BedTypes.special ? { ...item, disabled: floor === Floors.third } : item
                    )
                );
            }

            // Clear Rent if missing basic selections
            if (!bedType && (rentAmount !== '' || advanceDeposit !== '')) {
                form.setValues({ rentAmount: '', advanceDeposit: '' });
            }

            // Set Default Rent Amount and Advance Deposit when BedType and Floor changed
            if (bedType && bedType !== previous.bedType && floor) {
                const floorRents = defaultRents.bedRents[floor as Floor];
                // Safe lookup: check if key exists on the specific floor record
                const newRent = bedType in floorRents ? (floorRents as Record<string, number>)[bedType] : 0;

                form.setValues({
                    rentAmount: newRent,
                    advanceDeposit: newRent
                });
            }

            // Recalculate Summary on any payment field change
            const hasPaymentUpdates =
                rentAmount !== previous.rentAmount ||
                securityDeposit !== previous.securityDeposit ||
                advanceDeposit !== previous.advanceDeposit ||
                amountPaid !== previous.amountPaid;

            if (hasPaymentUpdates) {
                startTransition(() => {
                    const summ = calculateSummary(values, member, action);

                    if (member && action === 'edit') form.setFieldValue('amountPaid', summ.total);

                    if (outstandingAmount !== summ.outstanding) {
                        form.setValues({
                            outstandingAmount: summ.outstanding,
                            shouldForwardOutstanding: summ.outstanding !== 0
                        });
                    }

                    setSummary(summ);
                });
            }
        },
        validate: {
            name: validateName,
            phone: validatePhoneNumber,
            floor: (value) => (!value ? 'Floor is required' : null),
            bedType: (value) => (!value ? 'Bed type is required' : null),
            securityDeposit: (value) => validatePositiveInteger(value, defaultRents.securityDeposit),
            rentAmount: (value, values) => {
                if (!values.floor || !values.bedType) return 'Floor and bed type are required';
                const baseRent = defaultRents.bedRents[values.floor][values.bedType] as number;
                if (baseRent === undefined) return 'Invalid bed type for selected floor';
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
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' '),
            phone: normalizePhoneInput(values.phone),
            note: values.note.trim()
        }),
        enhanceGetInputProps: (payload) => {
            if (payload.field === 'phone') {
                const originalOnBlur = payload.inputProps.onBlur;
                return {
                    ...payload,
                    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                        const formattedValue = formatPhoneNumber(event.currentTarget.value);
                        payload.form.setFieldValue('phone', formattedValue);
                        originalOnBlur?.(event);
                    }
                };
            }

            return {};
        }
    });

    const isRentMismatch = member ? member.currentRent !== currentSettingsRent : false;
    const isSecurityDepositMismatch = member ? member.securityDeposit !== defaultRents.securityDeposit : false;
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
                    notifySuccess('Member saved successfully');
                    form.resetDirty();
                } else {
                    const fieldErrors = result.errors.nested;
                    const otherErrors = result.errors.other;
                    const rootErrors = result.errors.root;
                    if (fieldErrors) {
                        console.log(fieldErrors);
                        form.setErrors(fieldErrors);
                        notifyError('Check the form for errors');
                    } else if (otherErrors) {
                        console.log(otherErrors);
                        notifyError(otherErrors[0]);
                    } else if (rootErrors) {
                        notifyError(rootErrors[0]);
                    } else {
                        notifyError('Something went wrong');
                    }
                }
            } catch (error) {
                console.error('Error in memberOperations:', error);
                notifyError(error instanceof Error ? error.message : 'Something went wrong');
            }
        });
    };

    const handleFormReset = () => {
        form.reset();
        setSummary(calculateSummary(initialValues, member, action));
    };

    const generateNote = (values: MemberDetailsFormData) => {
        const dateText = '#' + dayjs().format('DD-MM-YYYY') + ' — ';
        let note = dateText;
        note +=
            action === 'edit' ? 'Updated'
            : action === 'reactivate' ? 'Reactivated'
            : 'Added';

        if (form.isDirty() && action !== 'add') {
            Object.entries(form.getDirty()).forEach(([key, value]) => {
                if (
                    value &&
                    key !== 'rentAmount' &&
                    key !== 'securityDeposit' &&
                    key !== 'advanceDeposit' &&
                    key !== 'shouldForwardOutstanding' &&
                    key !== 'outstandingAmount'
                ) {
                    note += `\r\n- ${key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^[a-z]/, (match) =>
                            match.toUpperCase()
                        )} changed from ${formValues[key as keyof MemberDetailsFormData]}`;
                }
            });
        }

        if (action === 'add') {
            const defaultNote = `\n- At the time of joining, ${toIndianLocale(summary.total)} has been charged, that includes ${toIndianLocale(summary.rentAmount)} as Rent for the current month, ${toIndianLocale(summary.advanceDeposit)} as Advance Deposit and ${toIndianLocale(summary.securityDeposit)} as Security Deposit.`;
            // Get rent note
            const rentNote =
                values.shouldForwardOutstanding ?
                    `${defaultNote}\n- However, ${toIndianLocale(values.amountPaid)} has been paid creating an Outstanding of ${toIndianLocale(values.outstandingAmount)}. This amount will be added to the current month's bill and will be forwarded to the next month's bill.`
                :   defaultNote;
            note += rentNote;
        }

        const addDashIfNeeded = (prevNote: string) => (prevNote.startsWith('#') ? '\n' + prevNote : '\n- ' + prevNote);

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
        defaultFormValues: {
            secondFloorSelectData,
            thirdFlSelectData,
            minDate: dayjs(initialValues.moveInDate).subtract(1, 'month').toDate(),
            maxDate: dayjs(initialValues.moveInDate).add(1, 'month').toDate()
        },
        actions
    };
};
