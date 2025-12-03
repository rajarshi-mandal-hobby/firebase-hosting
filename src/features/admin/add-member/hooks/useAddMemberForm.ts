import { useState, useTransition } from 'react';
import { useForm } from '@mantine/form';
import type { BedType, Floor, GlobalSettings } from '../../../../data/shemas/GlobalSettings';
import dayjs from 'dayjs';
import { notifySuccess } from '../../../../utils/notifications';
import { useDisclosure } from '@mantine/hooks';
import { getSafeDate } from '../../../../shared/utils';
import type { Member } from '../../../../shared/types/firestore-types';

const sanitizePhoneInput = (value: number | string): number => {
  const phoneStr = String(value).replace(/\D/g, '').slice(-10);
  return Number(phoneStr);
};

const isPositiveInteger = (value: number | string): boolean => {
  return Number.isInteger(Number(value)) && Number(value) > 0;
};

const calculateTotalDeposit = (rentAmount: unknown, securityDeposit: unknown, advanceDeposit: unknown): number => {
  const nums = [rentAmount, securityDeposit, advanceDeposit];
  return nums.reduce((acc: number, curr) => {
    const num = Number(curr);
    return acc + (isNaN(num) ? 0 : num);
  }, 0);
};

type UseAddMemberFormProps = {
  settings: GlobalSettings;
  member?: Member;
};

export type AddMemberFormData = {
  name: string;
  phone: string | number;
  floor: Floor | null;
  bedType: BedType | null;
  rentAmount: number | string;
  rentAtJoining?: number | string;
  securityDeposit: number | string;
  advanceDeposit: number | string;
  optedForWifi: boolean;
  moveInDate: string;
  notes: string;
  amountPaid: number | string;
};

export const useAddMemberForm = ({ settings, member }: UseAddMemberFormProps) => {
  const [isSaving, saveTransition] = useTransition();
  const [outstandingAmount, setOutstandingAmount] = useState<number>(0);
  const [isFullAmountPaid, setIsFullAmountPaid] = useState<boolean>(false);
  const [isConfirmModalOpen, confirmModalHandlers] = useDisclosure(false);

  const form = useForm<AddMemberFormData>({
    mode: 'uncontrolled',
    initialValues: {
      name: member?.name || '',
      phone: member?.phone || '',
      floor: member?.floor || null,
      bedType: member?.bedType || null,
      rentAmount: member?.currentRent || '',
      rentAtJoining: member?.rentAtJoining || '',
      securityDeposit: member?.securityDeposit || settings.securityDeposit,
      advanceDeposit: member?.advanceDeposit || '',
      optedForWifi: member?.optedForWifi || false,
      moveInDate: getSafeDate(member?.moveInDate) || dayjs().format('YYYY-MM'),
      amountPaid: member?.totalAgreedDeposit || '',
      notes: '',
    },
    onValuesChange: (values, previous) => {
        
      const previousAmount = calculateTotalDeposit(
        previous.rentAmount,
        previous.securityDeposit,
        previous.advanceDeposit
      );
      const newTotalAmount = calculateTotalDeposit(values.rentAmount, values.securityDeposit, values.advanceDeposit);

      if (values.amountPaid !== previous.amountPaid) {
        const totalDepositReference = member ? member.totalAgreedDeposit : Number(values.amountPaid || 0);
        const outStanding = newTotalAmount - totalDepositReference;
        console.log('Outstanding amount recalculated', outStanding);
        setOutstandingAmount(outStanding);
      }

      if (previous.bedType !== values.bedType) {
        form.setFieldValue('amountPaid', '');
        setIsFullAmountPaid(false);
      }

      const hasFloorChanged = values.floor !== previous.floor;
      const floor = values.floor || previous.floor;

      // Priority 1: Clear bedType and rentAmount when floor changes
      if (hasFloorChanged) {
        form.setFieldValue('bedType', null);
        form.setFieldValue('rentAmount', '');
        form.setFieldValue('advanceDeposit', '');
      }

      // Priority 3: Clear rentAmount if floor or bedType is empty
      if (floor === null || values.bedType === null) {
        form.setFieldValue('rentAmount', '');
      }

      const hasBedTypeChanged = values.bedType !== previous.bedType;
      if (hasBedTypeChanged) {
        // Priority 4: Update rent amount based on valid combinations
        const floorRents = settings.bedRents[floor as Floor];
        if (values.bedType === 'Bed') {
          form.setFieldValue('rentAmount', floorRents.Bed);
          form.setFieldValue('advanceDeposit', floorRents.Bed);
        } else if (values.bedType === 'Room') {
          form.setFieldValue('rentAmount', floorRents.Room);
          form.setFieldValue('advanceDeposit', floorRents.Room);
        } else if (floor === '2nd' && values.bedType === 'Special') {
          form.setFieldValue('rentAmount', settings.bedRents['2nd'].Special);
          form.setFieldValue('advanceDeposit', settings.bedRents['2nd'].Special);
        }
      }
    },
    validate: {
      name: (value) => {
        const nameVal = value.trim();
        if (!nameVal) {
          return 'Name is required';
        }
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!nameRegex.test(nameVal)) {
          return 'Name can only contain letters and spaces';
        }
        const words = nameVal.split(' ').filter((word) => word.length > 0);
        if (words.length < 2) {
          return 'Please enter at least first and last name';
        }
        if (words.some((word) => word.length < 2)) {
          return 'Each part of the name must be at least 2 characters long';
        }
        return null;
      },
      phone: (value) => {
        if (!value) return 'Phone number is required';
        const formattedPhone = sanitizePhoneInput(value);
        if (!/^[0-9]{10}$/.test(formattedPhone.toString())) {
          return 'Phone must be 10 digits';
        }
        return null;
      },
      floor: (value) => (!value ? 'Floor is required' : null),
      bedType: (value) => (!value ? 'Bed type is required' : null),
      rentAmount: (value) => (isPositiveInteger(value) ? null : 'Rent amount must be greater than 0'),
      securityDeposit: (value) => (isPositiveInteger(value) ? null : 'Security deposit must be 0 or greater'),
      advanceDeposit: (value) => (isPositiveInteger(value) ? null : 'Advance deposit must be 0 or greater'),
      moveInDate: (value) => (!value ? 'Move-in date is required' : null),
      notes: (value) => {
        if (!value) return null;
        const words = value.trim().split(/\s+/);
        if (words.length < 2) {
          return 'Notes must contain at least two words';
        }
        return null;
      },
      amountPaid: (value) => (isPositiveInteger(value) ? null : 'Amount paid must be greater than 0'),
    },
    transformValues: (values) => ({
      ...values,
      name: values.name
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' '),
      phone: sanitizePhoneInput(values.phone),
    }),
  });

  const calculatedTotalAmount =
    Number(form.values.rentAmount || 0) +
    Number(form.values.securityDeposit || 0) +
    Number(form.values.advanceDeposit || 0);

  const handleSave = (_values: AddMemberFormData) => {
    if (form.isValid()) {
      confirmModalHandlers.open();
    }
  };

  const handleConfirm = () => {
    confirmModalHandlers.close();
    saveTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async save operation
      notifySuccess('Member added successfully');
    });
  };

  const actions = {
    onOpenConfirm: confirmModalHandlers.open,
    onCloseConfirm: confirmModalHandlers.close,
    onConfirm: handleConfirm,
    onSave: handleSave,
    onFullAmountChange: setIsFullAmountPaid,
  };

  return {
    form,
    isSaving,
    isConfirmModalOpen,
    outstandingAmount,
    isFullAmountPaid,
    calculatedTotalAmount,
    actions,
  };
};
