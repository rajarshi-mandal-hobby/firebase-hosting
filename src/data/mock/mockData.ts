/**
 * Mock Data for Development and Testing
 * 
 * This file contains mock data that simulates Firestore collections.
 * Uses types from firestore-types.ts to ensure consistency.
 */

import type { Timestamp } from 'firebase/firestore';
import type {
  GlobalSettings,
  AdminConfig,
  Admin,
  RentHistory,
  ElectricBill,
  Floor,
  BedType,
  MemberWithRentHistory,
} from '../../shared/types/firestore-types';

// Helper to create mock Firestore Timestamps
export const createMockTimestamp = (date?: string | Date): Timestamp => {
  const d = date ? new Date(date) : new Date();
  return {
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: 0,
    toDate: () => d,
    toMillis: () => d.getTime(),
    isEqual: (other: Timestamp) => other.seconds === Math.floor(d.getTime() / 1000),
    toJSON: () => ({
      seconds: Math.floor(d.getTime() / 1000),
      nanoseconds: 0,
      type: 'timestamp',
    }),
    valueOf: () => d.getTime().toString(),
  } as Timestamp;
};

// Mock Global Settings
export const mockGlobalSettings: GlobalSettings = {
  floors: ['2nd', '3rd'] as Floor[],
  bedTypes: {
    '2nd': {
      'Bed': 1600,
      'Room': 3200,
      'Special Room': 2400,
    },
    '3rd': {
      'Bed': 1500,
      'Room': 3000,
    },
  },
  securityDeposit: 1600,
  wifiMonthlyCharge: 400,
  upiVpa: '+918777529394',
  activememberCounts: {
    total: 4, // Only 4 active members now (member-5 is deactivated)
    byFloor: {
      '2nd': 3, // member-1, member-2, member-4
      '3rd': 1, // member-3
    },
    wifiOptedIn: 3, // member-1, member-2, member-4 (member-3 opted out)
  },
  currentBillingMonth: createMockTimestamp('2025-07-01'),
  nextBillingMonth: createMockTimestamp('2025-08-01'),
};

// Mock Admin Configuration
export const mockAdminConfig: AdminConfig = {
  list: [
    {
      email: 'primary@example.com',
      uid: 'primary-admin-uid',
      role: 'primary',
      addedAt: createMockTimestamp('2024-01-15'),
      addedBy: 'system',
    },
    {
      email: 'secondary@example.com',
      uid: 'secondary-admin-uid',
      role: 'secondary',
      addedAt: createMockTimestamp('2024-03-20'),
      addedBy: 'primary-admin-uid',
    },
  ] as Admin[],
  primaryAdminUid: 'primary-admin-uid',
  maxAdmins: 5,
};

// Mock Members Data
export const mockMembers: MemberWithRentHistory[] = [
  {
    id: 'member-1',
    name: 'John Doe',
    phone: '+918123456789',
    firebaseUid: 'firebase-uid-1',
    fcmToken: 'fcm-token-1',
    floor: '2nd' as Floor,
    bedType: 'Bed' as BedType,
    moveInDate: createMockTimestamp('2024-01-15'),
    securityDeposit: 1600,
    rentAtJoining: 1600,
    advanceDeposit: 1600,
    currentRent: 1600,
    totalAgreedDeposit: 4800,
    outstandingBalance: 0,
    outstandingNote: '',
    isActive: true,
    optedForWifi: true,
    leaveDate: undefined,
    ttlExpiry: undefined,
    rentHistory: [
      {
        id: '2025-07',
        generatedAt: createMockTimestamp('2025-07-01'),
        rent: 1600,
        electricity: 300,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [],
        totalCharges: 1967,
        amountPaid: 0,
        currentOutstanding: 1967,
        note: '',
        status: 'Due',
      },
      {
        id: '2025-06',
        generatedAt: createMockTimestamp('2025-06-01'),
        rent: 1600,
        electricity: 280,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [
          { amount: 100, description: 'Common area cleaning' },
          { amount: 50, description: 'Maintenance' },
        ],
        totalCharges: 2047,
        amountPaid: 2047,
        currentOutstanding: 0,
        note: '',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'member-2',
    name: 'Jane Smith',
    phone: '+918234567890',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '2nd' as Floor,
    bedType: 'Room' as BedType,
    moveInDate: createMockTimestamp('2024-02-01'),
    securityDeposit: 1600,
    rentAtJoining: 3200,
    advanceDeposit: 3200,
    currentRent: 3200,
    totalAgreedDeposit: 8000,
    outstandingBalance: 0,
    isActive: true,
    optedForWifi: true,
    leaveDate: undefined,
    ttlExpiry: undefined,
    rentHistory: [
      {
        id: '2025-07',
        generatedAt: createMockTimestamp('2025-07-01'),
        rent: 3200,
        electricity: 360,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [],
        totalCharges: 3627,
        amountPaid: 3627,
        currentOutstanding: 0,
        note: '',
        status: 'Paid',
      },
      {
        id: '2025-06',
        generatedAt: createMockTimestamp('2025-06-01'),
        rent: 3200,
        electricity: 340,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [
          { amount: 150, description: 'Room deep cleaning' },
        ],
        totalCharges: 3757,
        amountPaid: 3757,
        currentOutstanding: 0,
        note: '',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'member-3',
    name: 'Bob Wilson',
    phone: '+918345678901',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '3rd' as Floor,
    bedType: 'Bed' as BedType,
    moveInDate: createMockTimestamp('2024-03-10'),
    securityDeposit: 1600,
    rentAtJoining: 1500,
    advanceDeposit: 1500,
    currentRent: 1500,
    totalAgreedDeposit: 4600,
    outstandingBalance: 1500,
    outstandingNote: 'Partial payment pending',
    isActive: true,
    optedForWifi: false,
    leaveDate: undefined,
    ttlExpiry: undefined,
    rentHistory: [
      {
        id: '2025-07',
        generatedAt: createMockTimestamp('2025-07-01'),
        rent: 1500,
        electricity: 280,
        wifi: 0, // Not opted for wifi
        previousOutstanding: 1500,
        expenses: [],
        totalCharges: 3280,
        amountPaid: 1780,
        currentOutstanding: 1500,
        note: 'Partial payment received',
        status: 'Partial',
      },
      {
        id: '2025-06',
        generatedAt: createMockTimestamp('2025-06-01'),
        rent: 1500,
        electricity: 300,
        wifi: 0,
        previousOutstanding: 0,
        expenses: [],
        totalCharges: 1800,
        amountPaid: 300,
        currentOutstanding: 1500,
        note: 'Partial payment only',
        status: 'Partial',
      },
    ],
  },
  {
    id: 'member-4',
    name: 'Alice Johnson',
    phone: '+918456789012',
    firebaseUid: 'firebase-uid-4',
    fcmToken: undefined,
    floor: '2nd' as Floor,
    bedType: 'Special Room' as BedType,
    moveInDate: createMockTimestamp('2024-04-01'),
    securityDeposit: 1600,
    rentAtJoining: 2400,
    advanceDeposit: 2400,
    currentRent: 2400,
    totalAgreedDeposit: 6400,
    outstandingBalance: 0,
    isActive: true,
    optedForWifi: true,
    leaveDate: undefined,
    ttlExpiry: undefined,
    rentHistory: [
      {
        id: '2025-07',
        generatedAt: createMockTimestamp('2025-07-01'),
        rent: 2400,
        electricity: 320,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [
          { amount: 200, description: 'Special room maintenance' },
        ],
        totalCharges: 2987,
        amountPaid: 2987,
        currentOutstanding: 0,
        note: '',
        status: 'Paid',
      },
      {
        id: '2025-06',
        generatedAt: createMockTimestamp('2025-06-01'),
        rent: 2400,
        electricity: 310,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [],
        totalCharges: 2777,
        amountPaid: 2777,
        currentOutstanding: 0,
        note: '',
        status: 'Paid',
      },
    ],
  },
  {
    id: 'member-5',
    name: 'Charlie Brown',
    phone: '+918567890123',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '3rd' as Floor,
    bedType: 'Room' as BedType,
    moveInDate: createMockTimestamp('2024-05-15'),
    securityDeposit: 1600,
    rentAtJoining: 3000,
    advanceDeposit: 3000,
    currentRent: 3000,
    totalAgreedDeposit: 7600,
    outstandingBalance: 0,
    isActive: false, // Deactivated
    optedForWifi: true,
    leaveDate: createMockTimestamp('2025-06-30'), // Left at end of June
    ttlExpiry: createMockTimestamp('2025-12-30'),
    rentHistory: [
      {
        id: '2025-06',
        generatedAt: createMockTimestamp('2025-06-01'),
        rent: 3000,
        electricity: 320,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [],
        totalCharges: 3387,
        amountPaid: 3387,
        currentOutstanding: 0,
        note: 'Final month payment before leaving',
        status: 'Paid',
      },
      {
        id: '2025-05',
        generatedAt: createMockTimestamp('2025-05-01'),
        rent: 3000,
        electricity: 310,
        wifi: 67,
        previousOutstanding: 0,
        expenses: [
          { amount: 100, description: 'Room cleaning' },
        ],
        totalCharges: 3477,
        amountPaid: 3477,
        currentOutstanding: 0,
        note: '',
        status: 'Paid',
      },
    ],
  },
];

// Mock Electric Bills Data
export const mockElectricBills: ElectricBill[] = [
  {
    id: '2025-07',
    billingMonth: createMockTimestamp('2025-07-01'),
    generatedAt: createMockTimestamp('2025-07-01'),
    lastUpdated: createMockTimestamp('2025-07-01'),
    floorCosts: {
      '2nd': {
        bill: 1200, // Updated for 3 active members on 2nd floor
        totalMembers: 3,
      },
      '3rd': {
        bill: 280, // Updated for 1 active member on 3rd floor
        totalMembers: 1,
      },
    },
    appliedBulkExpenses: [
      {
        members: ['member-1', 'member-2', 'member-4'], // Only WiFi users
        amount: 300,
        description: 'WiFi router maintenance',
      },
    ],
  },
  {
    id: '2025-06',
    billingMonth: createMockTimestamp('2025-06-01'),
    generatedAt: createMockTimestamp('2025-06-01'),
    lastUpdated: createMockTimestamp('2025-06-01'),
    floorCosts: {
      '2nd': {
        bill: 1440, // Historical data when member-5 was still active
        totalMembers: 3,
      },
      '3rd': {
        bill: 900, // Historical data with member-3 and member-5
        totalMembers: 2,
      },
    },
    appliedBulkExpenses: [
      {
        members: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'], // All members in June
        amount: 1000,
        description: 'Common area maintenance',
      },
    ],
  },
];

// Extract rent history from members for separate collection seeding
export const mockRentHistory: RentHistory[] = mockMembers.flatMap(member => 
  member.rentHistory.map((history: RentHistory) => ({
    ...history,
    id: `${member.id}-${history.id}` // Prefix with member ID for unique document IDs
  }))
);

// In-memory data store for mock services
let globalSettingsData: GlobalSettings = { ...mockGlobalSettings };
let adminConfigData: AdminConfig = { ...mockAdminConfig };
let membersData: MemberWithRentHistory[] = [...mockMembers];
let electricBillsData: ElectricBill[] = [...mockElectricBills];

// Export data stores for services to use
export const dataStore = {
  get globalSettings() { return globalSettingsData; },
  set globalSettings(data: GlobalSettings) { globalSettingsData = data; },
  
  get adminConfig() { return adminConfigData; },
  set adminConfig(data: AdminConfig) { adminConfigData = data; },
  
  get members() { return membersData; },
  set members(data: MemberWithRentHistory[]) { membersData = data; },
  
  get electricBills() { return electricBillsData; },
  set electricBills(data: ElectricBill[]) { electricBillsData = data; },
};

// Helper functions for working with embedded rent history
export const getMemberWithRentHistory = (memberId: string): MemberWithRentHistory | undefined => {
  return membersData.find(member => member.id === memberId);
};

export const getMemberRentHistory = (memberId: string) => {
  const member = getMemberWithRentHistory(memberId);
  return member?.rentHistory || [];
};

export const getCurrentMonthRentHistory = (memberId: string) => {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const member = getMemberWithRentHistory(memberId);
  return member?.rentHistory.find((rh: RentHistory) => rh.id === currentMonth) || null;
};

export const getActiveMembersWithRentHistory = () => {
  return membersData.filter(member => member.isActive);
};

export const getAllMembersWithOutstanding = () => {
  return membersData.filter(member => member.outstandingBalance > 0);
};

export const getMembersByFloor = (floor: Floor) => {
  return membersData.filter(member => member.floor === floor);
};

// Mock Current User for Authentication
export const mockCurrentUser = {
  email: 'john.doe@gmail.com',
  linkedMemberId: 'member-1', // Links to the first mock member
};

// Export individual collections for convenience
export {
  globalSettingsData,
  adminConfigData,
  membersData,
  electricBillsData,
};
