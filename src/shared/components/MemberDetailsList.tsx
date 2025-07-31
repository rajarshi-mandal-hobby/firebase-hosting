import { List, Text } from '@mantine/core';
import { memo } from 'react';
import { formatDate } from '../utils';
import { CurrencyFormatter } from './CurrencyFormatter';
import {
  IconPhone,
  IconBed,
  IconCalendarMonth,
  IconRupee,
  IconUniversalCurrency,
  IconPayments,
  IconWifi,
  IconFirebase,
} from './icons';
import type { Member } from '../types/firestore-types';
import type { Timestamp } from 'firebase/firestore';

interface MemberDetailsListProps {
  member: Member;
  isAdmin?: boolean;
}

export const MemberDetailsList = memo<MemberDetailsListProps>(({ member, isAdmin = false }) => {
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
    <List spacing='xs' listStyleType='none' size='sm'>
      <List.Item icon={<IconPhone size={16} />}>
        <Text component='a' href={`tel:${member.phone}`} size='sm'>
          Phone: {member.phone}
        </Text>
      </List.Item>
      <List.Item icon={<IconBed size={16} />}>
        Floor: {member.floor} - {member.bedType}{' '}
      </List.Item>
      <List.Item icon={<IconCalendarMonth size={16} />}>Move-in: {formatDate(member.moveInDate)}</List.Item>
      <List.Item icon={<IconRupee size={16} />}>
        Current Rent: <CurrencyFormatter value={member.currentRent} />
        /month
      </List.Item>
      <List.Item icon={<IconUniversalCurrency size={16} />}>
        Rent at Joining: <CurrencyFormatter value={member.rentAtJoining} />
      </List.Item>
      <List.Item icon={<IconUniversalCurrency size={16} />}>
        Advance Deposit: <CurrencyFormatter value={member.advanceDeposit} />
      </List.Item>
      <List.Item icon={<IconUniversalCurrency size={16} />}>
        Security Deposit: <CurrencyFormatter value={member.securityDeposit} />
      </List.Item>
      <List.Item icon={<IconPayments size={16} />} fw={500}>
        Total Agreed Deposit: <CurrencyFormatter value={member.totalAgreedDeposit} />
      </List.Item>
      <List.Item icon={<IconWifi size={16} />}>WiFi: {member.optedForWifi ? 'Opted In' : 'Not Opted'}</List.Item>

      {/* Admin-only fields */}
      {isAdmin && member && (
        <>
          {member.firebaseUid && (
            <List.Item icon={<IconFirebase size={16} />}>Firebase UID: {member.firebaseUid}</List.Item>
          )}
          {member.fcmToken && (
            <List.Item icon={<IconFirebase size={16} />}>
              FCM Token: {member.fcmToken.substring(0, 20)}...
            </List.Item>
          )}
          {member.leaveDate && (
            <List.Item icon={<IconFirebase size={16} />} c='orange'>
              Leave Date: {formatTimestamp(member.leaveDate)}
            </List.Item>
          )}
          {member.ttlExpiry && (
            <List.Item icon={<IconFirebase size={16} />} c='red'>
              TTL Expiry: {formatTimestamp(member.ttlExpiry)}
            </List.Item>
          )}
        </>
      )}
    </List>
  );
});
