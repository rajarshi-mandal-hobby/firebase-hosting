import { Table, Text, Textarea } from '@mantine/core';
import type { ReactNode } from 'react';
import { type Member, FLOOR, BED } from '../../../../data/types';
import { GroupIcon } from '../../../../shared/components';
import { IconFirebase, IconNote } from '../../../../shared/icons';
import { type GoogleIconName, GoogleIcon } from '../../../../shared/icons/factory';
import {
    displayPhoneNumber,
    notifyClose,
    notifySuccess,
    notifyError,
    formatDate,
    toIndianLocale
} from '../../../../shared/utils';

interface TableRowProps {
    heading: string;
    value: any;
    iconName?: GoogleIconName;
    icon?: ReactNode;
    onPhoneClick?: () => void;
}

const TableRow = ({ heading, value, iconName, icon, onPhoneClick }: TableRowProps) => (
    <Table.Tr>
        <Table.Td pl={0}>
            <GroupIcon>
                {iconName ?
                    <GoogleIcon iconName={iconName} fw={500} />
                :   icon}
                <Text fw={500} lineClamp={1}>
                    {heading}
                </Text>
            </GroupIcon>
        </Table.Td>
        <Table.Td pr={0}>
            <Text
                style={
                    onPhoneClick ?
                        {
                            cursor: 'pointer',
                            textUnderlineOffset: '1px'
                        }
                    :   undefined
                }
                onClick={onPhoneClick}
                td={onPhoneClick ? 'dotted underline' : undefined}
            >
                {value}
            </Text>
        </Table.Td>
    </Table.Tr>
);

interface MemberDetailsListProps {
    member: Member;
}

export const MemberDetailsList = ({ member }: MemberDetailsListProps) => {
    return (
        <Table layout='fixed' verticalSpacing='sm' fz='sm'>
            <Table.Tbody>
                <TableRow
                    heading='Phone'
                    value={displayPhoneNumber(member.phone)}
                    iconName='call'
                    onPhoneClick={async () => {
                        // Notification should only appear once for every other click
                        const id = 'copy_phone';
                        notifyClose(id);
                        try {
                            await navigator.clipboard.writeText(member.phone);
                            notifySuccess(`Copied ${member.phone}`, { showIcon: false, id });
                        } catch (err) {
                            notifyError((err as Error).message, { id });
                        }
                    }}
                />
                <TableRow heading='Move-in Date' value={formatDate(member.moveInDate)} iconName='event' />
                <TableRow
                    heading='Floor & Bed'
                    value={`${FLOOR[member.floor]} — ${BED[member.bed]}`}
                    iconName='king_bed'
                />
                <TableRow
                    heading='Current Rent'
                    value={toIndianLocale(member.rent) + '/month'}
                    iconName='currency_rupee'
                />
                <TableRow
                    heading='Advance Deposit'
                    value={toIndianLocale(member.advanceDeposit)}
                    iconName='universal_currency_alt'
                />
                <TableRow
                    heading='Security Deposit'
                    value={toIndianLocale(member.securityDeposit)}
                    iconName='money_bag'
                />
                <TableRow
                    heading='Total Agreed Deposit'
                    value={toIndianLocale(member.totalAgreedDeposit)}
                    iconName='payments'
                />
                <TableRow heading='WiFi' value={member.optedForWifi ? 'Opted In' : 'Not Opted'} iconName='wifi' />

                {member.leaveDate && (
                    <TableRow heading='Leave Date' value={formatDate(member.leaveDate)} icon={<IconFirebase />} />
                )}

                {!!member.remarks && (
                    <>
                        <Table.Tr bd={'none'}>
                            <Table.Td px={0} pb={0}>
                                <GroupIcon>
                                    <IconNote />
                                    <Text fw={500} lineClamp={1}>
                                        Note
                                    </Text>
                                </GroupIcon>
                            </Table.Td>
                        </Table.Tr>
                        <Table.Tr>
                            <Table.Td colSpan={2} px={0}>
                                <Textarea
                                    variant='filled'
                                    value={member.remarks}
                                    resize='vertical'
                                    minRows={2}
                                    maxRows={3}
                                    readOnly
                                />
                            </Table.Td>
                        </Table.Tr>
                    </>
                )}
            </Table.Tbody>
        </Table>
    );
};
