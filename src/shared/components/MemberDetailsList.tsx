import { Group, Table, Text } from '@mantine/core';
import { formatDate } from '../utils';
import type { Member } from '../types/firestore-types';
import type { Timestamp } from 'firebase/firestore';
import {
  IconBed,
  IconCalendarMonth,
  IconCall,
  IconPayments,
  IconRupee,
  IconUniversalCurrency,
  IconWifi,
  IconFirebase,
} from '../icons';

type TableRowProps = {
  heading: string;
  value: any;
  icon: React.ElementType;
};

const TableRow = ({ heading, value, icon: Icon }: TableRowProps) => (
  <Table.Tr>
    <Table.Th pl={0} fw={500} w={155}>
      <Group wrap='nowrap' gap='xs'>
        <Icon size={14} />
        {heading}
      </Group>
    </Table.Th>
    <Table.Td pr={0}>
      <Text fz='sm' lineClamp={1}>
        {value}
      </Text>
    </Table.Td>
  </Table.Tr>
);

type MemberDetailsListProps = {
  member: Member;
  isAdmin?: boolean;
}

export const MemberDetailsList = ({ member, isAdmin = false }: MemberDetailsListProps) => {
  const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return 'Not set';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Table layout='fixed' verticalSpacing='sm' fz='sm'>
      <Table.Tbody>
        <TableRow heading='Phone' value={member.phone} icon={IconCall} />
        <TableRow heading='Move-in Date' value={formatDate(member.moveInDate)} icon={IconCalendarMonth} />
        <TableRow heading='Floor & Bed' value={`${member.floor} - ${member.bedType}`} icon={IconBed} />
        <TableRow heading='Current Rent' value={'₹' + member.currentRent + '/month'} icon={IconRupee} />
        <TableRow heading='Rent at Joining' value={'₹' + member.rentAtJoining + '/month'} icon={IconUniversalCurrency} />
        <TableRow heading='Advance Deposit' value={'₹' + member.advanceDeposit} icon={IconUniversalCurrency} />
        <TableRow heading='Security Deposit' value={'₹' + member.securityDeposit} icon={IconUniversalCurrency} />
        <TableRow heading='Total Agreed Deposit' value={'₹' + member.totalAgreedDeposit} icon={IconPayments} />
        <TableRow heading='WiFi' value={member.optedForWifi ? 'Opted In' : 'Not Opted'} icon={IconWifi} />
        {/* Admin-only fields */}
        {isAdmin &&
          member.leaveDate &&
          <TableRow heading='Leave Date' value={formatTimestamp(member.leaveDate)} icon={IconFirebase} />}
        {isAdmin &&
          member.ttlExpiry &&
          <TableRow heading='TTL Expiry' value={formatTimestamp(member.ttlExpiry)} icon={IconFirebase} />}
        {isAdmin &&
          member.firebaseUid &&
          <TableRow heading='Firebase UID' value={member.firebaseUid} icon={IconFirebase} />}
        {isAdmin && member.fcmToken && <TableRow heading='FCM Token' value={member.fcmToken} icon={IconFirebase} />}
      </Table.Tbody>
    </Table>
  );
};
