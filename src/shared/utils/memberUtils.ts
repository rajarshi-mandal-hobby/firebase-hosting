import type { Member, RentHistory, MockMemberData, PaymentStatus } from '../types/firestore-types';
import { mockMembers } from '../../data/mockData';

/**
 * Utility functions for member data processing
 */

/**
 * Transform mock member data to Member interface
 */
export const mapToMember = (rawMember: MockMemberData): Member => {
  return {
    id: rawMember.id,
    name: rawMember.name,
    phone: rawMember.phone,
    floor: rawMember.floor,
    bedType: rawMember.bedType,
    moveInDate: rawMember.moveInDate,
    securityDeposit: rawMember.securityDeposit,
    rentAtJoining: rawMember.rentAtJoining,
    advanceDeposit: rawMember.advanceDeposit,
    currentRent: rawMember.currentRent,
    totalAgreedDeposit: rawMember.totalAgreedDeposit,
    outstandingBalance: rawMember.outstandingBalance,
    isActive: rawMember.isActive,
    optedForWifi: rawMember.optedForWifi,
    ...(rawMember.firebaseUid && { firebaseUid: rawMember.firebaseUid }),
    ...(rawMember.fcmToken && { fcmToken: rawMember.fcmToken }),
    ...(rawMember.outstandingNote && { outstandingNote: rawMember.outstandingNote }),
    ...(rawMember.leaveDate && { leaveDate: rawMember.leaveDate }),
    ...(rawMember.ttlExpiry && { ttlExpiry: rawMember.ttlExpiry }),
  };
};

/**
 * Transform mock rent history data to RentHistory interface
 */
export const mapToRentHistory = (
  rawHistory: NonNullable<MockMemberData['rentHistory']>[number]
): RentHistory => {
  return {
    id: rawHistory.id,
    generatedAt: rawHistory.generatedAt,
    rent: rawHistory.rent,
    electricity: rawHistory.electricity,
    wifi: rawHistory.wifi,
    previousOutstanding: rawHistory.previousOutstanding,
    expenses: rawHistory.expenses || [],
    totalCharges: rawHistory.totalCharges,
    amountPaid: rawHistory.amountPaid,
    currentOutstanding: rawHistory.currentOutstanding,
    status: ['Due', 'Paid', 'Partially Paid', 'Overpaid'].includes(rawHistory.status)
      ? (rawHistory.status as PaymentStatus)
      : 'Due',
    ...(rawHistory.note && { note: rawHistory.note }),
  };
};

/**
 * Get member with their latest rent history
 */
export const getMemberWithLatestBill = (memberId: string) => {
  const rawMember = (mockMembers as MockMemberData[]).find((m) => m.id === memberId);
  if (!rawMember) return null;

  const member = mapToMember(rawMember);
  const latestHistory = rawMember.rentHistory?.[0] 
    ? mapToRentHistory(rawMember.rentHistory[0])
    : null;

  return {
    member,
    latestHistory
  };
};

/**
 * Get all active members with their latest bills
 */
export const getActiveMembersWithLatestBills = () => {
  return (mockMembers as MockMemberData[])
    .filter((m) => m.isActive)
    .map((rawMember) => {
      const member = mapToMember(rawMember);
      const latestHistory = rawMember.rentHistory?.[0] 
        ? mapToRentHistory(rawMember.rentHistory[0])
        : null;
      
      return {
        member,
        latestHistory
      };
    });
};

/**
 * Calculate total outstanding for all active members
 */
export const calculateTotalOutstanding = (): number => {
  return mockMembers
    .filter(member => member.isActive && member.outstandingBalance > 0)
    .reduce((total, member) => total + member.outstandingBalance, 0);
};

/**
 * Get active members by floor
 */
export const getActiveMembersByFloor = (floor: string) => {
  return mockMembers.filter(member => member.isActive && member.floor === floor);
};

/**
 * Get WiFi opted members
 */
export const getWifiOptedMembers = () => {
  return mockMembers.filter(member => member.isActive && member.optedForWifi);
};

/**
 * Get member rent history
 */
export const getMemberRentHistory = (memberId: string) => {
  const rawMember = (mockMembers as MockMemberData[]).find(member => member.id === memberId);
  if (!rawMember?.rentHistory) return [];
  
  return rawMember.rentHistory.map(mapToRentHistory);
};

/**
 * Get all members (both active and inactive) for member management
 */
export const getAllMembers = (): Member[] => {
  return (mockMembers as MockMemberData[]).map(mapToMember);
};

/**
 * Get active members count by category
 */
export const getMemberCounts = () => {
  const allMembers = getAllMembers();
  const activeMembers = allMembers.filter(m => m.isActive);
  const wifiOptedMembers = getWifiOptedMembers();
  
  return {
    total: allMembers.length,
    active: activeMembers.length,
    wifiOptedIn: wifiOptedMembers.length,
  };
};
