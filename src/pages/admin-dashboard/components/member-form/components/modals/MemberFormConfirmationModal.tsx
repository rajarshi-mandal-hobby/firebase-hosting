import { Modal, SimpleGrid, Group, Button, Text, Textarea } from '@mantine/core';
import dayjs from 'dayjs';
import { useState, useEffectEvent, useEffect } from 'react';
import {
    IconPerson,
    IconCalendarMonth,
    IconCall,
    IconWifi,
    IconBed,
    IconUniversalCurrency,
    IconMoneyBag,
    IconPayments,
    IconInfo,
    IconNote
} from '../../../../../../shared/icons';
import { displayPhoneNumber, toIndianLocale, toNumber } from '../../../../../../shared/utils';
import type { MemberDetailsFormData } from '../../hooks/useMemberDetailsForm';
import { calculateTotalDeposit } from '../../utils/utils';
import { GroupButtons, GroupIcon, MyAlert } from '../../../../../../shared/components';

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

export const MemberFormConfirmationModal = ({ opened, actions, formValues, dirtyFields }: ConfirmationModalProps) => {
    const [modifiedNote, setModifiedNote] = useState(formValues.note);

    const event = useEffectEvent(setModifiedNote);

    useEffect(() => {
        event(formValues.note);
    }, [formValues.note]);

    const getFw = (key: keyof MemberDetailsFormData) => {
        return dirtyFields?.[key] ? 800 : 400;
    };

    const data: DataRowConfig[] = [
        {
            label: 'Name',
            value: formValues.name,
            icon: <IconPerson />,
            fw: getFw('name')
        },
        {
            label: 'Joining Date',
            value: dayjs(formValues.moveInDate).format('MMMM YYYY'),
            icon: <IconCalendarMonth />,
            fw: getFw('moveInDate')
        },
        {
            label: 'Phone Number',
            value: displayPhoneNumber(formValues.phone).toString(),
            icon: <IconCall />,
            fw: getFw('phone')
        },
        {
            label: 'Opted for Wifi',
            value: formValues.isOptedForWifi ? 'Yes' : 'No',
            icon: <IconWifi />,
            fw: getFw('isOptedForWifi')
        },
        {
            label: 'Floor & Bed',
            value:
                formValues.floor && formValues.bedType ?
                    `${formValues.floor} Floor - ${formValues.bedType}`
                :   'Not selected',
            icon: <IconBed />,
            fw: getFw('floor')
        },
        {
            label: 'Monthly Rent',
            value: toIndianLocale(formValues.rentAmount),
            icon: <IconUniversalCurrency />,
            fw: getFw('rentAmount')
        },
        {
            label: 'Advance Deposit',
            value: toIndianLocale(formValues.advanceDeposit),
            icon: <IconUniversalCurrency />,
            fw: getFw('advanceDeposit')
        },
        {
            label: 'Security Deposit',
            value: toIndianLocale(formValues.securityDeposit),
            icon: <IconUniversalCurrency />,
            fw: getFw('securityDeposit')
        },
        {
            label: 'Total Amount',
            value: toIndianLocale(
                calculateTotalDeposit(formValues.rentAmount, formValues.securityDeposit, formValues.advanceDeposit)
            ),
            icon: <IconMoneyBag />,
            fw: getFw('rentAmount')
        },
        {
            label: 'Amount Paid',
            value: toIndianLocale(formValues.amountPaid),
            icon: <IconPayments />,
            fw: 700 // Always bold
        }
    ];

    const isOutstandingBalance = toNumber(formValues.outstandingAmount) !== 0;

    return (
        <Modal opened={opened} onClose={actions.onClose} title='Confirmation' size='sm'>
            <SimpleGrid cols={2} spacing='xs' verticalSpacing='sm'>
                {data.map((memberDetail) => {
                    const isNotValid = memberDetail.value.trim() === '';
                    if (isNotValid) return null;

                    return <DisplayDataValues key={memberDetail.label} {...memberDetail} />;
                })}
            </SimpleGrid>

            <Textarea
                label={
                    <GroupIcon>
                        <IconNote />
                        Note
                    </GroupIcon>
                }
                placeholder='Any additional notes or remarks'
                value={modifiedNote}
                onChange={(e) => {
                    console.log('new note', e.currentTarget.value);
                    setModifiedNote(e.currentTarget.value);
                }}
                mt='sm'
                minRows={1}
                maxRows={7}
                draggable
            />

            {isOutstandingBalance && (
                <MyAlert color={formValues.shouldForwardOutstanding ? 'indigo' : 'red'} mt='md' Icon={IconInfo}>
                    The outstanding amount of <strong>{toIndianLocale(formValues.outstandingAmount)}</strong> will{' '}
                    <strong>{formValues.shouldForwardOutstanding ? '' : 'not'}</strong> be added to current month&apos;s
                    bill.
                </MyAlert>
            )}

            <GroupButtons mt='xl'>
                <Button variant='default' onClick={actions.onClose}>
                    Cancel
                </Button>
                <Button onClick={() => actions.onConfirm({ ...formValues, note: modifiedNote })}>Confirm</Button>
            </GroupButtons>
        </Modal>
    );
};

function DisplayDataValues({ label, value, icon, fw }: DataRowProps) {
    return (
        <>
            <Group gap='xs' wrap='nowrap'>
                {icon}
                <Text fw={500}>{label}</Text>
            </Group>
            <Text fw={fw}>{value}</Text>
        </>
    );
}
