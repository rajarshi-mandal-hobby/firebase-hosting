import type { Member, RentHistory, PaymentStatus, SettlementPreview } from '../types/firestore-types';

/**
 * Utility functions for member data processing using real Firestore data
 */

// ======================================
// VALIDATION UTILITIES
// ======================================

/**
 * Validate member name (minimum 2 words requirement)
 */
export const validateMemberName = (name: string): { isValid: boolean; error?: string } => {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return { isValid: false, error: 'Name is required' };
  }

  const nameParts = trimmedName.split(/\s+/);
  if (nameParts.length < 2) {
    return { isValid: false, error: 'Please enter full name (minimum 2 words)' };
  }

  // Check for valid characters (letters, spaces, common punctuation)
  if (!/^[a-zA-Z\s\.\-']+$/.test(trimmedName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, dots, hyphens, and apostrophes' };
  }

  return { isValid: true };
};

/**
 * Format phone number with +91 prefix
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `+91${cleanPhone}`;
};

/**
 * Check if phone number is unique across all members
 */
export const isPhoneNumberUnique = (phone: string, members: Member[], excludeMemberId?: string): boolean => {
  const formattedPhone = formatPhoneNumber(phone);
  return !members.some((member) => member.id !== excludeMemberId && member.phone === formattedPhone);
};

/**
 * Check if member name is unique (case-insensitive)
 */
export const isMemberNameUnique = (name: string, members: Member[], excludeMemberId?: string): boolean => {
  const normalizedName = name.trim().toLowerCase();
  return !members.some((member) => member.id !== excludeMemberId && member.name.toLowerCase() === normalizedName);
};

/**
 * Validate member uniqueness
 */
export const validateMemberUniqueness = (
  name: string,
  phone: string,
  members: Member[],
  excludeMemberId?: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!isPhoneNumberUnique(phone, members, excludeMemberId)) {
    errors.push('Phone number is already registered with another member');
  }

  if (!isMemberNameUnique(name, members, excludeMemberId)) {
    errors.push('Member name already exists');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ======================================
// FINANCIAL CALCULATION UTILITIES
// ======================================


/**
 * Calculate settlement preview for member deactivation
 */
export const calculateSettlementPreview = (member: Member, leaveDate: Date): SettlementPreview => {
  const refundAmount = member.totalAgreedDeposit - member.outstandingBalance;

  let status: 'Refund Due' | 'Payment Due' | 'Settled';
  if (refundAmount > 0) {
    status = 'Refund Due';
  } else if (refundAmount < 0) {
    status = 'Payment Due';
  } else {
    status = 'Settled';
  }

  return {
    memberName: member.name,
    totalAgreedDeposit: member.totalAgreedDeposit,
    outstandingBalance: member.outstandingBalance,
    refundAmount,
    status,
    leaveDate: leaveDate.toISOString(),
  };
};

/**
 * Calculate outstanding balance after payment
 */
export const calculateOutstandingAfterPayment = (currentOutstanding: number, paymentAmount: number): number => {
  return Math.max(0, currentOutstanding - paymentAmount);
};

/**
 * Calculate advance deposit from rent (business rule: advance = rent at joining)
 */
export const calculateAdvanceDeposit = (rentAtJoining: number): number => {
  return rentAtJoining;
};

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (amount: number, maxAmount?: number): { isValid: boolean; error?: string } => {
  if (amount < 0) {
    return { isValid: false, error: 'Payment amount cannot be negative' };
  }

  if (amount === 0) {
    return { isValid: false, error: 'Payment amount must be greater than zero' };
  }

  if (maxAmount && amount > maxAmount) {
    return { isValid: false, error: `Payment amount cannot exceed ₹${maxAmount.toLocaleString()}` };
  }

  return { isValid: true };
};

/**
 * Calculate partial payment percentage
 */
export const calculatePaymentPercentage = (paidAmount: number, totalAmount: number): number => {
  if (totalAmount === 0) return 0;
  return Math.round((paidAmount / totalAmount) * 100);
};

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
    .filter((member) => member.isActive && member.currentRent.status === 'Partial')
    .reduce((total, member) => total + member.outstandingBalance, 0);
};

/**
 * Filter members by floor
 */
export const getMembersByFloor = (members: Member[], floor: string): Member[] => {
  return members.filter((member) => member.isActive && member.floor === floor);
};

/**
 * Get members who have opted for WiFi
 */
export const getWifiOptedMembers = (members: Member[]): Member[] => {
  return members.filter((member) => member.isActive && member.optedForWifi);
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
    .filter((member) => member.isActive)
    .map((member) => {
      const rentHistory = memberRentHistories[member.id] || [];
      const latestBill = rentHistory[0]; // Assuming sorted by date desc
      return {
        ...member,
        latestBill,
      };
    });
};

/**
 * Calculate member statistics
 */
export const calculateMemberStats = (members: Member[]) => {
  const activeMembers = members.filter((m) => m.isActive);
  const inactiveMembers = members.filter((m) => !m.isActive);

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
  return members.filter(
    (member) => member.name.toLowerCase().includes(searchLower) || member.phone.includes(searchTerm)
  );
};

/**
 * Get member by ID
 */
export const getMemberById = (members: Member[], memberId: string): Member | undefined => {
  return members.find((member) => member.id === memberId);
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
  return members.filter((member) => member.isActive && member.outstandingBalance > 0);
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
    active: members.filter((m) => m.isActive).length,
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
