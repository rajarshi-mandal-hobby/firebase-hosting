import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useState, useTransition, startTransition } from 'react';
import type { Floor } from '../../../../data/shemas/GlobalSettings';
import { normalizePhoneInput, formatPhoneNumber, toNumber } from '../../../../shared/utils';
import { notifySuccess } from '../../../../utils/notifications';
import type { MemberDetailsFormData, MemberDetailsFormProps } from '../components/MemberDetailsForm';
import {
  calculateTotalDeposit,
  getInitialValues,
  validateName,
  validatePhoneNumber,
  validatePositiveInteger,
  validateSentence,
} from '../utils/utils';

export const useMemberDetailsForm = ({
  settings,
  member,
  currentSettingsRent,
}: MemberDetailsFormProps & { currentSettingsRent: number }) => {
  // Helper to calculate summary state
  const calculateSummary = (
    values: Pick<MemberDetailsFormData, 'rentAmount' | 'securityDeposit' | 'advanceDeposit' | 'amountPaid'>
  ) => {
    const rent = toNumber(values.rentAmount);
    const security = toNumber(values.securityDeposit);
    const advance = toNumber(values.advanceDeposit);
    const paid = toNumber(values.amountPaid);

    const total = calculateTotalDeposit(rent, security, advance);

    // Logic: If editing existing member, outstanding is based on agreed deposit.
    // If new member, it's based on current form totals.
    const outstanding = values.amountPaid ? (member ? paid - member.totalAgreedDeposit : total - paid) : 0;

    return {
      rentAmount: rent,
      securityDeposit: security,
      advanceDeposit: advance,
      total,
      outstanding,
    };
  };

  const initialValues = getInitialValues(settings, member);

  // Single source of truth for the summary UI to avoid multiple re-renders
  const [summary, setSummary] = useState(() => calculateSummary(initialValues));
  const [formValues, setFormValues] = useState<MemberDetailsFormData>(initialValues);
  const [isSaving, saveTransition] = useTransition();
  const [isConfirmModalOpen, { open: openConfirmModal, close: closeConfirmModal }] = useDisclosure(false);

  const form = useForm<MemberDetailsFormData>({
    mode: 'uncontrolled',
    initialValues,
    onValuesChange(values, previous) {
      const floor = values.floor || previous.floor;

      // If floor has changed, reset bed type and rent amount
      const hasFloorChanged = values.floor !== previous.floor;
      if (hasFloorChanged) {
        form.setFieldValue('bedType', null);
        form.setFieldValue('rentAmount', '');
        return;
      }

      // If floor or bed type is null, clear rent amount
      if (floor === null || values.bedType === null) {
        // Only clear if it wasn't already empty to avoid loops
        if (values.rentAmount !== '') {
          form.setFieldValue('rentAmount', '');
          return;
        }
      }

      // If bed type has changed, update rent amount based on settings
      const hasBedTypeChanged = values.bedType !== previous.bedType;
      if (hasBedTypeChanged && floor && values.bedType) {
        const floorRents = settings.bedRents[floor as Floor];
        let newRent = 0;

        if (values.bedType === 'Bed') newRent = floorRents.Bed;
        else if (values.bedType === 'Room') newRent = floorRents.Room;
        else if (floor === '2nd' && values.bedType === 'Special') newRent = settings.bedRents['2nd'].Special || 0;

        form.setFieldValue('rentAmount', newRent);
        form.setFieldValue('advanceDeposit', newRent);
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

          if (member) form.setFieldValue('amountPaid', newSummary.total);
          // Sync calculated outstanding back to form for submission
          // We check equality to avoid infinite loops
          if (values.outstandingAmount !== newSummary.outstanding) {
            form.setFieldValue('outstandingAmount', newSummary.outstanding);
            form.setFieldValue('shouldForwardOutstanding', newSummary.outstanding !== 0);
          }
        });
      }
    },
    validate: {
      name: validateName,
      phone: validatePhoneNumber,
      floor: (value) => (!value ? 'Floor is required' : null),
      bedType: (value) => (!value ? 'Bed type is required' : null),
      securityDeposit: (value) => validatePositiveInteger(value, settings.securityDeposit),
      rentAmount: (value, values) => {
        if (!values.floor || !values.bedType) return 'Floor and bed type are required';
        const baseRent = settings.bedRents[values.floor][values.bedType];
        if (baseRent === undefined) return 'Invalid bed type for selected floor';
        return validatePositiveInteger(value, baseRent);
      },
      notes: (value) => validateSentence(value),
      amountPaid: (value) => {
        if (!!member && !value) return null;
        return validatePositiveInteger(value, 1000);
      },
    },
    transformValues: (values) => ({
      ...values,
      name: values.name
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '),
      phone: normalizePhoneInput(values.phone),
      notes: values.notes.trim(),
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
          },
        };
      }

      return {};
    },
  });

  const isRentMismatch = member ? member.currentRent !== currentSettingsRent : false;
  const isSecurityDepositMismatch = member ? member.securityDeposit !== settings.securityDeposit : false;
  const shouldDisplayMismatchAlert = isRentMismatch || isSecurityDepositMismatch;
  const isButtonDisabled = !form.isDirty() || isSaving;

  const handleConfirm = (values: MemberDetailsFormData) => {
    closeConfirmModal();
    saveTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulate async save operation
      notifySuccess(`Member ${member ? 'updated' : 'added'} successfully`);
      console.log('Submitted Member Details:', values);
    });
  };

  const handleFormReset = () => {
    form.reset();
    setSummary(calculateSummary(initialValues));
  };

  const actions = {
    onSave: (values: MemberDetailsFormData) => {
    //   if (form.isValid()) {
        setFormValues(values);
        openConfirmModal();
    
    },
    onCloseConfirm: closeConfirmModal,
    onConfirm: handleConfirm,
    onHandleReset: handleFormReset,
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
    actions,
  };
};
