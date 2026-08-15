import { Stack, Textarea } from '@mantine/core';
import { GroupIcon } from '../../../../shared/components';
import { SummaryGrid } from '../../../../shared/components/group-helpers';
import { IconNote } from '../../../../shared/icons';
import type { GoogleIconName } from '../../../../shared/icons/factory';
import { displayFloorBed, displayPhoneNumber, toIndianLocale } from '../../../../shared/utils';
import type { MemberFormDataTransformed, MemberFormSummary } from '../../types';
import dayjs from 'dayjs';

interface MemberFormConfirmationModalProps {
    values: MemberFormDataTransformed & { logs: string[] };
    summary: MemberFormSummary;
}

export const MemberFormConfirmationModal = ({ values, summary }: MemberFormConfirmationModalProps) => {
    const items: {
        label: string;
        iconName: GoogleIconName;
        value: string;
        valueFw?: number;
    }[] = [
        {
            label: 'Move in Date',
            iconName: 'event',
            value: dayjs(values.moveInDate).format('DD MMMM YY')
        },
        {
            label: 'Name',
            iconName: 'person',
            value: values.name
        },
        {
            label: 'Phone Number',
            iconName: 'call',
            value: displayPhoneNumber(values.phone)
        },
        {
            label: 'Wi-Fi',
            iconName: 'wifi',
            value: values.optedForWifi ? 'Opted In' : 'Not Opted'
        },
        {
            label: 'Floor & Bed',
            iconName: 'king_bed',
            value: displayFloorBed(values.floor, values.bed)
        },
        {
            label: 'Monthly Rent',
            iconName: 'universal_currency_alt',
            value: toIndianLocale(summary.rent)
        },
        {
            label: 'Advance Deposit',
            iconName: 'universal_currency_alt',
            value: toIndianLocale(summary.rent)
        },
        {
            label: 'Security Deposit',
            iconName: 'universal_currency_alt',
            value: toIndianLocale(summary.securityDeposit)
        },
        {
            label: 'Total Deposit',
            iconName: 'payments',
            value: toIndianLocale(summary.totalDeposit)
        },
        ...(summary.total ?
            [
                {
                    label: 'Total Payable',
                    iconName: 'payments' as const,
                    value: toIndianLocale(summary.total),
                    valueFw: 700
                }
            ]
        :   []),
        {
            label: 'Amount Paid',
            iconName: 'money_bag',
            value: toIndianLocale(values.amountPaid),
            valueFw: 900
        }
    ];

    if (values.forwardOutstanding) {
        items.splice(items.length - 1, 0, {
            label: 'Outstanding',
            iconName: 'currency_rupee',
            value: toIndianLocale(summary.outstanding),
            valueFw: 700
        });
    }

    const displayLog = values.logs.length ? values.logs.join('\n- ') : '';

    return (
        <Stack gap='sm' mb='xl'>
            <SummaryGrid {...{ items }} />
            <Textarea
                label={
                    <GroupIcon>
                        <IconNote /> Logs
                    </GroupIcon>
                }
                value={displayLog}
                maxRows={3}
                autosize
                resize='vertical'
                readOnly
            />
        </Stack>
    );
};
