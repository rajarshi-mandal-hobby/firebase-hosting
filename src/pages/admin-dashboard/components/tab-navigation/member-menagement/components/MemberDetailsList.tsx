import { Table, Text, Textarea } from '@mantine/core';
import { type Member } from '../../../../../../data/types';
import {
    IconCall,
    IconCalendarMonth,
    IconBed,
    IconRupee,
    IconUniversalCurrency,
    IconPayments,
    IconWifi,
    IconFirebase,
    IconNote
} from '../../../../../../shared/icons';
import {
    convertToFloorOrdinal,
    displayPhoneNumber,
    formatDate,
    notifyClose,
    notifyError,
    notifySuccess,
    toIndianLocale
} from '../../../../../../shared/utils';
import { GroupIcon } from '../../../../../../shared/components/group-helpers';

interface TableRowProps {
    heading: string;
    value: any;
    icon: React.ElementType;
    onPhoneClick?: () => void;
}

const TableRow = ({ heading, value, icon: Icon, onPhoneClick }: TableRowProps) => (
    <Table.Tr>
        <Table.Td pl={0}>
            <GroupIcon>
                <Icon />
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
                td={onPhoneClick ? 'dotted underline' : 'none'}
                tt='capitalize'
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
                    icon={IconCall}
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
                <TableRow heading='Move-in Date' value={formatDate(member.moveInDate)} icon={IconCalendarMonth} />
                <TableRow
                    heading='Floor & Bed'
                    value={`${convertToFloorOrdinal(member.floor)} — ${member.bed}`}
                    icon={IconBed}
                />
                <TableRow heading='Current Rent' value={toIndianLocale(member.rent) + '/month'} icon={IconRupee} />
                <TableRow
                    heading='Rent at Joining'
                    value={toIndianLocale(member.rentAtJoining) + '/month'}
                    icon={IconUniversalCurrency}
                />
                <TableRow
                    heading='Advance Deposit'
                    value={toIndianLocale(member.advanceDeposit)}
                    icon={IconUniversalCurrency}
                />
                <TableRow
                    heading='Security Deposit'
                    value={toIndianLocale(member.securityDeposit)}
                    icon={IconUniversalCurrency}
                />
                <TableRow
                    heading='Total Agreed Deposit'
                    value={toIndianLocale(member.totalAgreedDeposit)}
                    icon={IconPayments}
                />
                <TableRow heading='WiFi' value={member.optedForWifi ? 'Opted In' : 'Not Opted'} icon={IconWifi} />

                {member.leaveDate && (
                    <TableRow heading='Leave Date' value={formatDate(member.leaveDate)} icon={IconFirebase} />
                )}

                {!!member.note && (
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
                                    value={member.note}
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
