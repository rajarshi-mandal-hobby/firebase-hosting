import type { Member, RentHistory, PaymentStatus } from '../types/firestore-types';

/**
 * Utility functions for member data processing using real Firestore data
 */

/**
 * Calculate payment status based on outstanding balance
 */
export const getPaymentStatus = (
  amountPaid: number,
  totalCharges: number,
  currentOutstanding: number
): PaymentStatus => {
  if (currentOutstanding === 0) {
    return amountPaid > totalCharges ? 'Overpaid' : 'Paid';
  } else if (amountPaid > 0) {
    return 'Partial';
  } else {
    return 'Due';
  }
};

/**
 * Calculate total outstanding for a list of members
 */
export const calculateTotalOutstanding = (members: Member[]): number => {
  return members
    .filter(member => member.isActive && member.outstandingBalance > 0)
    .reduce((total, member) => total + member.outstandingBalance, 0);
};

/**
 * Filter members by floor
 */
export const getMembersByFloor = (members: Member[], floor: string): Member[] => {
  return members.filter(member => member.isActive && member.floor === floor);
};

/**
 * Get members who have opted for WiFi
 */
export const getWifiOptedMembers = (members: Member[]): Member[] => {
  return members.filter(member => member.isActive && member.optedForWifi);
};

/**
 * Format member name for display
 */
export const formatMemberName = (member: Member): string => {
  return `${member.name} (${member.floor} - ${member.bedType})`;
};

/**
 * Get active members with their latest bills
 * This function should be used with rent history data fetched separately
 */
export const getActiveMembersWithLatestBills = (
  members: Member[],
  memberRentHistories: Record<string, RentHistory[]> = {}
): (Member & { latestBill?: RentHistory })[] => {
  return members
    .filter(member => member.isActive)
    .map(member => {
      const rentHistory = memberRentHistories[member.id] || [];
      const latestBill = rentHistory[0]; // Assuming sorted by date desc
      return {
        ...member,
        latestBill
      };
    });
};

/**
 * Calculate member statistics
 */
export const calculateMemberStats = (members: Member[]) => {
  const activeMembers = members.filter(m => m.isActive);
  const inactiveMembers = members.filter(m => !m.isActive);
  
  const byFloor = activeMembers.reduce((acc, member) => {
    acc[member.floor] = (acc[member.floor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalOutstanding = calculateTotalOutstanding(activeMembers);
  const wifiOptedIn = getWifiOptedMembers(activeMembers).length;

  return {
    totalActive: activeMembers.length,
    totalInactive: inactiveMembers.length,
    wifiOptedIn,
    byFloor,
    totalOutstanding,
  };
};

/**
 * Sort members by name
 */
export const sortMembersByName = (members: Member[]): Member[] => {
  return [...members].sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Search members by name or phone
 */
export const searchMembers = (members: Member[], searchTerm: string): Member[] => {
  const searchLower = searchTerm.toLowerCase();
  return members.filter(member =>
    member.name.toLowerCase().includes(searchLower) ||
    member.phone.includes(searchTerm)
  );
};

/**
 * Get member by ID
 */
export const getMemberById = (members: Member[], memberId: string): Member | undefined => {
  return members.find(member => member.id === memberId);
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

/**
 * Get members with outstanding balances
 */
export const getMembersWithOutstanding = (members: Member[]): Member[] => {
  return members.filter(member => member.isActive && member.outstandingBalance > 0);
};

/**
 * Get all members (deprecated - use DataProvider getMembers instead)
 */
export const getAllMembers = (): Promise<Member[]> => {
  // This is a temporary placeholder - components should use DataProvider
  console.warn('getAllMembers is deprecated - use DataProvider getMembers instead');
  return Promise.resolve([]);
};

/**
 * Get member counts (deprecated - use DataProvider instead)
 */
export const getMemberCounts = (members: Member[]) => {
  return {
    total: members.length,
    active: members.filter(m => m.isActive).length,
    wifiOptedIn: getWifiOptedMembers(members).length,
  };
};

/**
 * Get member with latest bill (deprecated - use DataProvider instead)
 */
export const getMemberWithLatestBill = (): Promise<Member | null> => {
  // This is a temporary placeholder - components should use DataProvider
  console.warn('getMemberWithLatestBill is deprecated - use DataProvider instead');
  return Promise.resolve(null);
};


