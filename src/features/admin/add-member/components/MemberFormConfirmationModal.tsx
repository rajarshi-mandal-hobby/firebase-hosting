import { Modal, SimpleGrid, Group, Button, Text, Alert } from '@mantine/core';
import {
  IconBed,
  IconCalendarMonth,
  IconCall,
  IconInfo,
  IconMoneyBag,
  IconNote,
  IconPayments,
  IconPerson,
  IconUniversalCurrency,
  IconWifi,
} from '../../../../shared/icons';
import { displayPhoneNumber, formatNumberIndianLocale, toNumber } from '../../../../shared/utils';
import dayjs from 'dayjs';
import { calculateTotalDeposit } from '../utils/utils';
import type { MemberDetailsFormData } from './MemberDetailsForm';

type ConfirmationModalProps = {
  opened: boolean;
  formValues: MemberDetailsFormData;
  dirtyFields?: Partial<Record<keyof MemberDetailsFormData, boolean>>;
  actions: {
    onClose: () => void;
    onConfirm: (formValues: MemberDetailsFormData) => void;
  };
};
type Label =
  | 'Name'
  | 'Joining Date'
  | 'Opted for Wifi'
  | 'Phone Number'
  | 'Floor & Bed'
  | 'Monthly Rent'
  | 'Advance Deposit'
  | 'Security Deposit'
  | 'Total Amount'
  | 'Amount Paid'
  | 'Outstanding Amount'
  | 'Notes';

type DataRowProps = {
  label: Label;
  value: string;
  icon: React.ReactNode;
  fw: number;
};

type DataRowConfig = {
  label: Label;
  value: string;
  icon: React.ReactNode;
  fw: number;
};

export default function MemberFormConfirmationModal({
  opened,
  actions,
  formValues,
  dirtyFields,
}: ConfirmationModalProps) {
  const getFw = (key: keyof MemberDetailsFormData) => {
    return dirtyFields?.[key] ? 700 : 500;
  };
  const data: DataRowConfig[] = [
    {
      label: 'Name',
      value: formValues.name,
      icon: <IconPerson />,
      fw: getFw('name'),
    },
    {
      label: 'Joining Date',
      value: dayjs(formValues.moveInDate).format('MMMM YYYY'),
      icon: <IconCalendarMonth />,
      fw: getFw('moveInDate'),
    },
    {
      label: 'Phone Number',
      value: displayPhoneNumber(formValues.phone).toString(),
      icon: <IconCall />,
      fw: getFw('phone'),
    },
    {
      label: 'Opted for Wifi',
      value: formValues.isOptedForWifi ? 'Yes' : 'No',
      icon: <IconWifi />,
      fw: getFw('isOptedForWifi'),
    },
    {
      label: 'Floor & Bed',
      value:
        formValues.floor && formValues.bedType ? `${formValues.floor} Floor - ${formValues.bedType}` : 'Not selected',
      icon: <IconBed />,
      fw: getFw('floor'),
    },
    {
      label: 'Monthly Rent',
      value: formatNumberIndianLocale(formValues.rentAmount),
      icon: <IconUniversalCurrency />,
      fw: getFw('rentAmount'),
    },
    {
      label: 'Advance Deposit',
      value: formatNumberIndianLocale(formValues.advanceDeposit),
      icon: <IconUniversalCurrency />,
      fw: getFw('advanceDeposit'),
    },
    {
      label: 'Security Deposit',
      value: formatNumberIndianLocale(formValues.securityDeposit),
      icon: <IconUniversalCurrency />,
      fw: getFw('securityDeposit'),
    },
    {
      label: 'Total Amount',
      value: formatNumberIndianLocale(
        calculateTotalDeposit(formValues.rentAmount, formValues.securityDeposit, formValues.advanceDeposit)
      ),
      icon: <IconMoneyBag />,
      fw: getFw('rentAmount'),
    },
    {
      label: 'Amount Paid',
      value: formatNumberIndianLocale(formValues.amountPaid),
      icon: <IconPayments />,
      fw: 700, // Always bold
    },
    {
      label: 'Notes',
      value: formValues.notes,
      icon: <IconNote />,
      fw: getFw('notes'),
    },
  ];

  const isOutstandingBalance = toNumber(formValues.outstandingAmount) !== 0;

  return (
    <Modal opened={opened} onClose={actions.onClose} title='Confirmation' style={{}}>
      <SimpleGrid cols={2} spacing='xs' verticalSpacing='md'>
        {data.map((memberDetail) => {
          const isNotValid = memberDetail.value.trim() === '' || memberDetail.value === '₹0';
          if (isNotValid) return null;

          return <DisplayDataValues key={memberDetail.label} {...memberDetail} />;
        })}
      </SimpleGrid>

      {isOutstandingBalance && (
        <Alert color={formValues.shouldForwardOutstanding ? 'indigo' : 'red'} mt='md' icon={<IconInfo />}>
          The outstanding amount of <strong>{formatNumberIndianLocale(formValues.outstandingAmount)}</strong> will{' '}
          <strong>{formValues.shouldForwardOutstanding ? '' : 'not'}</strong> be added to current month&apos;s bill.
        </Alert>
      )}

      <Group justify='flex-end' mt='xl'>
        <Button variant='default' onClick={actions.onClose}>
          Cancel
        </Button>
        <Button onClick={() => actions.onConfirm(formValues)}>Confirm</Button>
      </Group>
    </Modal>
  );
}

function DisplayDataValues({ label, value, icon, fw }: DataRowProps) {
  return (
    <>
      <Group gap='xs' wrap='nowrap'>
        <span aria-hidden='true'>{icon}</span>
        <Text>{label}:</Text>
      </Group>
      <Text fw={fw}>{value}</Text>
    </>
  );
}
