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
  Member,
  RentHistory,
  ElectricBill,
  Floor,
  BedType,
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
  upiPhoneNumber: '+918777529394',
  activememberCounts: {
    total: 8,
    byFloor: {
      '2nd': 5,
      '3rd': 3,
    },
    wifiOptedIn: 6,
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
export const mockMembers: Member[] = [
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
    isActive: true,
    optedForWifi: true,
    leaveDate: undefined,
    ttlExpiry: undefined,
  },
  {
    id: 'member-6',
    name: 'Diana Prince',
    phone: '+918678901234',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '2nd' as Floor,
    bedType: 'Bed' as BedType,
    moveInDate: createMockTimestamp('2024-06-01'),
    securityDeposit: 1600,
    rentAtJoining: 1600,
    advanceDeposit: 1600,
    currentRent: 1600,
    totalAgreedDeposit: 4800,
    outstandingBalance: 3200,
    outstandingNote: 'Two months pending',
    isActive: true,
    optedForWifi: true,
    leaveDate: undefined,
    ttlExpiry: undefined,
  },
  {
    id: 'member-7',
    name: 'Edward Green',
    phone: '+918789012345',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '3rd' as Floor,
    bedType: 'Bed' as BedType,
    moveInDate: createMockTimestamp('2024-01-01'),
    securityDeposit: 1600,
    rentAtJoining: 1500,
    advanceDeposit: 1500,
    currentRent: 1500,
    totalAgreedDeposit: 4600,
    outstandingBalance: 0,
    isActive: true,
    optedForWifi: false,
    leaveDate: undefined,
    ttlExpiry: undefined,
  },
  {
    id: 'member-8',
    name: 'Fiona White',
    phone: '+918890123456',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '2nd' as Floor,
    bedType: 'Room' as BedType,
    moveInDate: createMockTimestamp('2024-02-15'),
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
  },
  // Inactive member for testing
  {
    id: 'member-9',
    name: 'George Black',
    phone: '+918901234567',
    firebaseUid: undefined,
    fcmToken: undefined,
    floor: '2nd' as Floor,
    bedType: 'Bed' as BedType,
    moveInDate: createMockTimestamp('2023-12-01'),
    securityDeposit: 1600,
    rentAtJoining: 1600,
    advanceDeposit: 1600,
    currentRent: 1600,
    totalAgreedDeposit: 4800,
    outstandingBalance: 0,
    isActive: false,
    optedForWifi: false,
    leaveDate: createMockTimestamp('2024-06-30'),
    ttlExpiry: createMockTimestamp('2024-12-30'),
  },
];

// Mock Rent History Data
export const mockRentHistory: RentHistory[] = [
  {
    id: '2025-06',
    generatedAt: createMockTimestamp('2025-06-01'),
    rent: 1600,
    electricity: 300,
    wifi: 67,
    previousOutstanding: 0,
    expenses: [
      {
        amount: 200,
        description: 'Common area cleaning',
      },
    ],
    totalCharges: 2167,
    amountPaid: 2167,
    currentOutstanding: 0,
    note: '',
    status: 'Paid',
  },
  {
    id: '2025-07',
    generatedAt: createMockTimestamp('2025-07-01'),
    rent: 1600,
    electricity: 280,
    wifi: 67,
    previousOutstanding: 0,
    expenses: [],
    totalCharges: 1947,
    amountPaid: 0,
    currentOutstanding: 1947,
    status: 'Due',
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
        bill: 1500,
        totalMembers: 5,
      },
      '3rd': {
        bill: 840,
        totalMembers: 3,
      },
    },
    appliedBulkExpenses: [
      {
        members: ['member-1', 'member-2', 'member-4'],
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
        bill: 1800,
        totalMembers: 5,
      },
      '3rd': {
        bill: 900,
        totalMembers: 3,
      },
    },
    appliedBulkExpenses: [
      {
        members: ['member-1', 'member-2', 'member-3', 'member-4', 'member-5'],
        amount: 1000,
        description: 'Common area maintenance',
      },
    ],
  },
];

// In-memory data store for mock services
let globalSettingsData: GlobalSettings = { ...mockGlobalSettings };
let adminConfigData: AdminConfig = { ...mockAdminConfig };
let membersData: Member[] = [...mockMembers];
let rentHistoryData: RentHistory[] = [...mockRentHistory];
let electricBillsData: ElectricBill[] = [...mockElectricBills];

// Export data stores for services to use
export const dataStore = {
  get globalSettings() { return globalSettingsData; },
  set globalSettings(data: GlobalSettings) { globalSettingsData = data; },
  
  get adminConfig() { return adminConfigData; },
  set adminConfig(data: AdminConfig) { adminConfigData = data; },
  
  get members() { return membersData; },
  set members(data: Member[]) { membersData = data; },
  
  get rentHistory() { return rentHistoryData; },
  set rentHistory(data: RentHistory[]) { rentHistoryData = data; },
  
  get electricBills() { return electricBillsData; },
  set electricBills(data: ElectricBill[]) { electricBillsData = data; },
};

// Export individual collections for convenience
export {
  globalSettingsData,
  adminConfigData,
  membersData,
  rentHistoryData,
  electricBillsData,
};
