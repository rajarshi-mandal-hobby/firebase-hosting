import { schemaResolver, useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import { calculateTotalDeposit, getInitialValues, MemberFormSchema, normalizeNameInput } from '../utils/utils';
import { useState, startTransition, type ChangeEvent, type FocusEvent, useEffect, useEffectEvent } from 'react';
import { BedTypes, type Floor, type BedType, Floors } from '../../../../../data/types';
import {
    formatPhoneNumber,
    getSafeDate,
    normalizePhoneInput,
    setFields,
    toIndianLocale
} from '../../../../../shared/utils';
import type { MemberDetailsFormProps } from '../components/MemberForm';
import { useGlobalFormStore, useMembers } from '../../../../../contexts';
import type { MemberAction } from '../../../../../shared/hooks';
import { parse } from 'valibot';

export type MemberDetailsFormData = {
    id?: string;
    moveInDate: string;
    isPreviousMonth: boolean;
    name: string;
    phone: string;
    floor: Floor | null;
    bedType: BedType | null;
    rentAmount: number | string;
    rentAtJoining: number;
    securityDeposit: number | string;
    advanceDeposit: number | string;
    isOptedForWifi: boolean;
    note: string;
    amountPaid: number | string;
    shouldForwardOutstanding: boolean;
    outstandingAmount: number;
    memberAction: MemberAction;
};

interface UseMemberDetailsFormProps extends MemberDetailsFormProps {
    currentDefaultRent: number;
}

export const useMemberDetailsForm = ({
    defaultRents,
    member,
    currentDefaultRent,
    memberAction,
    handleResetBoundary
}: UseMemberDetailsFormProps) => {
    const { members } = useMembers('all');
    const initialValues = getInitialValues({
        defaultRents,
        member,
        memberAction,
        currentDefaultRent,
        handleResetBoundary
    });
    const isAddAction = memberAction === 'add-member';
    const isEditAction = member && memberAction === 'edit-member';
    const isReactivateAction = member && memberAction === 'reactivate-member';

    // Single source of truth for the summary UI to avoid multiple re-renders
    const [summary, setSummary] = useState(() => ({
        total: member ? member.totalAgreedDeposit : 0,
        outstanding: 0
    }));
    const [formValues, setFormValues] = useState<MemberDetailsFormData>(initialValues);
    const {
        state: { saveResult, isPending, values, error },
        dispatcher,
        onResetState
    } = useGlobalFormStore<MemberDetailsFormData>(memberAction);
    const [isConfirmModalOpen, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);
    const [rootError, setRootError] = useState<string | null>();

    const form = useForm<MemberDetailsFormData>({
        mode: 'uncontrolled',
        initialValues,
        onValuesChange(values, previous) {
            startTransition(() => {
                const { floor, bedType, rentAmount, securityDeposit, advanceDeposit, amountPaid } = values;

                // Handle Floor Change
                if (floor !== previous.floor) {
                    setFields(form, {
                        bedType: null,
                        rentAmount: '',
                        advanceDeposit: '',
                        amountPaid: ''
                    });
                }

                // Set Default Rent Amount and Advance Deposit when BedType and Floor changed
                if (!!floor && bedType !== previous.bedType) {
                    console.log('Bed type changed');
                    const floorRents = defaultRents.bedRents[floor] as Record<BedType, number>;
                    // Safe lookup: check if key exists on the specific floor record
                    const newRent = bedType && bedType in floorRents ? floorRents[bedType] : '';

                    const sum = calculateTotalDeposit(newRent, securityDeposit, newRent);
                    const out = isEditAction && bedType ? sum - member.totalAgreedDeposit : 0;

                    setFields(form, {
                        rentAmount: newRent,
                        advanceDeposit: newRent,
                        amountPaid: isEditAction ? sum : '',
                        outstandingAmount: out,
                        shouldForwardOutstanding: out !== 0
                    });

                    setSummary({
                        total: sum,
                        outstanding: out
                    });
                }

                if ((isAddAction || isReactivateAction) && amountPaid !== previous.amountPaid) {
                    console.log('Amount paid changed');
                    const sum = calculateTotalDeposit(rentAmount, securityDeposit, advanceDeposit);
                    const out = typeof amountPaid !== 'number' ? 0 : sum - amountPaid;
                    setFields(form, {
                        outstandingAmount: out,
                        shouldForwardOutstanding: out !== 0
                    });

                    setSummary({
                        total: sum,
                        outstanding: out
                    });
                }

                if (securityDeposit !== previous.securityDeposit) {
                    if (!securityDeposit) {
                        setFields(form, {
                            amountPaid: '',
                            outstandingAmount: 0,
                            shouldForwardOutstanding: false
                        });
                        setSummary({
                            total: 0,
                            outstanding: 0
                        });
                        return;
                    }

                    const sum = calculateTotalDeposit(rentAmount, securityDeposit, advanceDeposit);
                    const out = typeof amountPaid !== 'number' ? 0 : sum - amountPaid;
                    setFields(form, {
                        outstandingAmount: out,
                        shouldForwardOutstanding: out !== 0
                    });
                    setSummary({
                        total: sum,
                        outstanding: out
                    });
                }
            });
        },
        // validate: schemaResolver(MemberFormSchema(member, members, memberAction)),
        // transformValues: (values) => parse(MemberFormSchema(member, members, memberAction), values),
        enhanceGetInputProps: (payload) => {
            if (payload.field === 'phone') {
                const originalOnChange = payload.inputProps.onChange;
                return {
                    onChange: (event: ChangeEvent<HTMLInputElement, Element>) => {
                        const val = event.currentTarget.value;
                        const numericOnly = val.replaceAll(/\D/g, '');
                        const formattedValue = formatPhoneNumber(numericOnly);
                        event.currentTarget.value = formattedValue;
                        originalOnChange?.(event);
                    }
                };
            }

            if (payload.field === 'name') {
                const originalOnBlur = payload.inputProps.onBlur;
                const originalOnchange = payload.inputProps.onChange;
                return {
                    onBlur: (event: FocusEvent<HTMLInputElement, Element>) => {
                        const val = event.currentTarget.value;
                        const formattedValue = normalizeNameInput(val);
                        event.currentTarget.value = formattedValue;
                        originalOnBlur?.(event);
                        originalOnchange?.(event);
                    }
                };
            }

            return {};
        }
    });

    form.watch('moveInDate', ({ value }) => {
        const dateToCompare =
            member && memberAction !== 'reactivate-member' ? member.moveInDate : defaultRents.currentBillingMonth;
        const isSame = dayjs(value).isSame(dayjs(getSafeDate(dateToCompare)));
        form.setFieldValue('isPreviousMonth', !isSame);
    });

    // Disable move in date if the member's move in date is not same as current billing month
    const isMoveInDateDisabled =
        !!member?.moveInDate &&
        memberAction !== 'reactivate-member' &&
        !dayjs(getSafeDate(member.moveInDate)).isSame(dayjs(getSafeDate(defaultRents.currentBillingMonth)), 'month');

    const saveEvent = useEffectEvent(() => {
        if (!values) return;

        const formValues = form.getTransformedValues();

        const isDifferent = JSON.stringify(formValues) !== JSON.stringify(values);

        if (isDifferent) {
            form.setValues(values);
            if (saveResult?.success === false || !!error) form.setInitialValues(form.getInitialValues());
        }

        if (saveResult?.success === true) {
            console.log('Result success');
            form.resetDirty();
            onResetState();
            setRootError(null);
        } else {
            console.log('Result failed', saveResult);
            if (saveResult?.errors.nested) {
                form.setErrors(saveResult.errors.nested);
            } else if (saveResult?.errors.root || saveResult?.errors.other) {
                setRootError(saveResult.errors.root?.[0] || saveResult.errors.other?.[0] || null);
            }
        }
    });

    useEffect(() => {
        saveEvent();
    }, [saveResult, error]);

    const isRentMismatch = member ? member.currentRent !== currentDefaultRent : false;
    const isSecurityDepositMismatch = member ? member.securityDeposit !== defaultRents.securityDeposit : false;
    const shouldDisplayMismatchAlert = isRentMismatch || isSecurityDepositMismatch;
    const isButtonDisabled = (!form.isDirty() && (isAddAction || isEditAction)) || isPending;

    const generateNote = (values: MemberDetailsFormData) => {
        const dateText = '#' + dayjs().format('DD-MM-YYYY') + ' — ';
        let note = dateText;
        note +=
            memberAction === 'edit-member' ? 'Updated'
            : memberAction === 'reactivate-member' ? 'Reactivated'
            : 'Added';

        if (form.isDirty() && memberAction !== 'add-member') {
            Object.entries(form.getDirty()).forEach(([key, value]) => {
                const field = key as keyof MemberDetailsFormData;
                if (
                    value &&
                    field !== 'rentAmount' &&
                    field !== 'securityDeposit' &&
                    field !== 'advanceDeposit' &&
                    field !== 'shouldForwardOutstanding' &&
                    field !== 'outstandingAmount' &&
                    field !== 'note' &&
                    field !== 'memberAction' &&
                    field !== 'isPreviousMonth'
                ) {
                    const memberKey =
                        field === 'amountPaid' ? 'totalAgreedDeposit'
                        : field === 'isOptedForWifi' ? 'optedForWifi'
                        : field === 'moveInDate' ? 'moveInDate'
                        : field;
                    note += `\n- ${key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^[a-z]/, (match) =>
                            match.toUpperCase()
                        )} changed from ${field === 'moveInDate' ? getSafeDate(member?.[memberKey]) : member?.[memberKey]} to ${values[field]}`;
                }
            });
        }

        if (memberAction === 'add-member') {
            console.log('outstanding amount', values.outstandingAmount);
            const defaultNote = `\n- Rent and Advance Deposit - ${toIndianLocale(values.rentAmount)} each. Security Deposit - ${toIndianLocale(values.securityDeposit)}. Total Deposit Amount - ${toIndianLocale(summary.total)}.`;
            const rentNote =
                values.outstandingAmount ?
                    `${defaultNote}\n- However, ${toIndianLocale(values.amountPaid)} has been paid creating an Outstanding of ${toIndianLocale(values.outstandingAmount)}. This amount will be ${values.shouldForwardOutstanding ? "added to the current month's bill to the current month's bill and will be forwarded to the next month's bill." : "NOT be added to the current month's bill!"}`
                :   defaultNote;
            note += rentNote;
        }

        const addDashIfNeeded = (prevNote: string) => (prevNote.startsWith('#') ? '\n' + prevNote : '\n- ' + prevNote);

        const previouNote = values.note;

        return previouNote ? `${note}${addDashIfNeeded(previouNote)}` : note;
    };

    const handleOnSave = (values: MemberDetailsFormData) => {
        console.log('values', values);
        const note = generateNote(values);
        setFormValues({ ...values, note });
        openConfirmModal();
    };

    const handleConfirm = (values: MemberDetailsFormData) => {
        console.log('values', values);
        closeConfirmModal();
        // startTransition(async () => await dispatcher(values));
    };

    const handleFormReset = () => {
        form.reset();
        setSummary({
            total: member ? member.totalAgreedDeposit : 0,
            outstanding: 0
        });
    };

    const actions = {
        onSave: handleOnSave,
        onModalOpen: openConfirmModal,
        onCloseConfirm: closeConfirmModal,
        onConfirm: handleConfirm,
        onHandleReset: handleFormReset
    };

    const currentBillingMonth = defaultRents.currentBillingMonth.toDate();

    return {
        form,
        summary,
        members,
        formValues,
        isPending,
        isMoveInDateDisabled,
        isConfirmModalOpen,
        isRentMismatch,
        isSecurityDepositMismatch,
        shouldDisplayMismatchAlert,
        isButtonDisabled,
        isAddAction,
        isEditAction,
        isReactivateAction,
        rootError,
        defaultFormValues: {
            secondFloorSelectData: Object.entries(Floors).map(([_, value]) => ({
                value,
                label: `${value} Floor`
            })),
            thirdFlSelectData: Object.entries(BedTypes).map(([_, value]) => ({
                value,
                label: value,
                disabled: form.getValues().floor === Floors.third && value === BedTypes.special
            })),
            minDate: dayjs(currentBillingMonth).subtract(1, 'month').toDate(),
            maxDate: dayjs(currentBillingMonth).toDate()
        },
        actions
    };
};
