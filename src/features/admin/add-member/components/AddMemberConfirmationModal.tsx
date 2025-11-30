import { Modal, SimpleGrid, Group, Button, Text } from '@mantine/core';
import type { AddMemberFormData } from './AddMemberForm';
import {
  IconBed,
  IconCall,
  IconMoneyBag,
  IconNote,
  IconPayments,
  IconPerson,
  IconRupee,
  IconUniversalCurrency,
  IconWifi,
} from '../../../../shared/icons';
import { formatNumberIndianLocale } from '../../../../shared/utils';

interface ConfirmationModalProps {
  opened: boolean;
  formValues: AddMemberFormData;
  outstandingAmount: number;
  actions: {
    onClose: () => void;
    onConfirm: () => void;
  };
}

export const AddMemberConfirmationModal = ({
  opened,
  actions,
  formValues,
  outstandingAmount,
}: ConfirmationModalProps) => {
  const data = [
    {
      label: 'Name',
      value: formValues.name,
      icon: <IconPerson size={14} color='gray' />,
    },
    {
      label: 'Phone Number',
      value: `+91 ${String(formValues.phone)
        .match(/.{1,5}/g)
        ?.join(' ')}`,
      icon: <IconCall size={14} color='gray.6' />,
    },
    {
      label: 'Floor & Bed',
      value: `${formValues.floor} Floor - ${formValues.bedType}`,
      icon: <IconBed size={14} />,
    },
    {
      label: 'Opted for Wifi',
      value: formValues.optedForWifi ? 'Yes' : 'No',
      icon: <IconWifi size={14} />,
    },
    {
      label: 'Monthly Rent',
      value: formatNumberIndianLocale(Number(formValues.rentAmount)),
      icon: <IconUniversalCurrency size={14} />,
    },
    {
      label: 'Security Deposit',
      value: formatNumberIndianLocale(Number(formValues.securityDeposit)),
      icon: <IconUniversalCurrency size={14} />,
    },
    {
      label: 'Advance Deposit',
      value: formatNumberIndianLocale(Number(formValues.advanceDeposit)),
      icon: <IconUniversalCurrency size={14} />,
    },
    {
      label: 'Total Amount',
      value: formatNumberIndianLocale(
        Number(formValues.rentAmount) + Number(formValues.securityDeposit) + Number(formValues.advanceDeposit)
      ),
      icon: <IconMoneyBag size={14} />,
    },
    {
      label: 'Amount Paid',
      value: formatNumberIndianLocale(Number(formValues.amountPaid)),
      fw: 700,
      icon: <IconPayments size={14} />,
    },
    {
      label: 'Outstanding Amount',
      value: formatNumberIndianLocale(outstandingAmount),
      fw: 700,
      icon: <IconRupee size={14} />,
    },
    {
      label: 'Notes',
      value: formValues.notes,
      icon: <IconNote size={14} />,
    },
  ];

  return (
    <Modal opened={opened} onClose={actions.onClose} title='Confirmation' style={{}}>
      <SimpleGrid cols={2} spacing='xs' verticalSpacing='md'>
        {data.map(DisplayDataValues)}
      </SimpleGrid>

      <Group justify='flex-end' mt='xl'>
        <Button variant='default' onClick={actions.onClose}>
          Cancel
        </Button>
        <Button onClick={actions.onConfirm}>Confirm</Button>
      </Group>
    </Modal>
  );
};

type DataRowProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  fw?: number;
};

function DisplayDataValues(items: DataRowProps) {
  if (!items.value || items.value === '₹0') {
    return null; // Skip rendering this row
  }
  return (
    <>
      <Group gap='xs' wrap='nowrap'>
        {items.icon}
        <Text fw={500}>{items.label}:</Text>
      </Group>
      <Text fw={items.fw ?? 400}>{items.value}</Text>
    </>
  );
}
