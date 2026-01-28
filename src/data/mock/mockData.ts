/**
 * Mock Data for Development and Testing
 *
 * This file contains mock data that simulates Firestore collections.
 * Uses types from firestore-types.ts to ensure consistency.
 */

import type { Timestamp } from "firebase/firestore";
import type { AdminConfig, Admin, MemberWithRentHistory } from "../../shared/types/firestore-types";
import { type Floor, type DefaultValues, type ElectricBill, type RentHistory, Floors, BedTypes } from "../types";

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
			type: "timestamp"
		}),
		valueOf: () => d.getTime().toString()
	} as Timestamp;
};

// Mock Global Settings
export const mockGlobalSettings: DefaultValues = {
	bedRents: {
		"2nd": {
			Bed: 1600,
			Room: 3200,
			Special: 1700
		},
		"3rd": {
			Bed: 1600,
			Room: 3200
		}
	},
	securityDeposit: 1000,
	wifiMonthlyCharge: 600,
	upiVpa: "",
	currentBillingMonth: createMockTimestamp("2025-07-01"),
	nextBillingMonth: createMockTimestamp("2025-08-01")
} satisfies DefaultValues;

// Mock Admin Configuration
export const mockAdminConfig: AdminConfig = {
	list: [
		{
			email: "primary@example.com",
			uid: "primary-admin-uid",
			role: "primary",
			addedAt: createMockTimestamp("2024-01-15"),
			addedBy: "system"
		},
		{
			email: "secondary@example.com",
			uid: "secondary-admin-uid",
			role: "secondary",
			addedAt: createMockTimestamp("2024-03-20"),
			addedBy: "primary-admin-uid"
		}
	] as Admin[],
	primaryAdminUid: "primary-admin-uid",
	maxAdmins: 5
};

// Mock Members Data
export const mockMembers: MemberWithRentHistory[] = [
	{
		id: "member-1",
		name: "John Doe",
		phone: "+918123456789",
		firebaseUid: "firebase-uid-1",
		fcmToken: "fcm-token-1",
		floor: Floors.second,
		bedType: BedTypes.bed,
		moveInDate: createMockTimestamp("2024-01-15"),
		securityDeposit: 1000,
		rentAtJoining: 1600,
		advanceDeposit: 1600,
		currentRent: 1600,
		note: "",
		currentMonthRent: {
			id: "2025-07",
			generatedAt: createMockTimestamp("2025-07-01"),
			rent: 1600,
			electricity: 300,
			wifi: 67,
			previousOutstanding: 0,
			expenses: [],
			totalCharges: 1967,
			amountPaid: 0,
			currentOutstanding: 1967,
			status: "Due"
		},
		totalAgreedDeposit: 4200,
		isActive: true,
		optedForWifi: true,
		leaveDate: undefined,
		ttlExpiry: undefined,
		rentHistory: [
			{
				id: "2025-06",
				generatedAt: createMockTimestamp("2025-06-01"),
				rent: 1600,
				electricity: 280,
				wifi: 67,
				previousOutstanding: 0,
				expenses: [
					{ amount: 100, description: "Common area cleaning" },
					{ amount: 50, description: "Maintenance" }
				],
				totalCharges: 2097,
				amountPaid: 2097,
				currentOutstanding: 0,
				status: "Paid"
			}
		]
	},
	{
		id: "member-2",
		name: "Jane Smith",
		phone: "+918234567890",
		firebaseUid: undefined,
		fcmToken: undefined,
		floor: Floors.second,
		bedType: BedTypes.room,
		moveInDate: createMockTimestamp("2024-02-01"),
		securityDeposit: 1000,
		rentAtJoining: 3200,
		advanceDeposit: 3200,
		currentRent: 3200,
		note: "",
		currentMonthRent: {
			id: "2025-07",
			generatedAt: createMockTimestamp("2025-07-01"),
			rent: 3200,
			electricity: 360,
			wifi: 67,
			previousOutstanding: 0,
			expenses: [],
			totalCharges: 3627,
			amountPaid: 3627,
			currentOutstanding: 0,
			status: "Paid"
		},
		totalAgreedDeposit: 7400,
		isActive: true,
		optedForWifi: true,
		leaveDate: undefined,
		ttlExpiry: undefined,
		rentHistory: [
			{
				id: "2025-06",
				generatedAt: createMockTimestamp("2025-06-01"),
				rent: 3200,
				electricity: 340,
				wifi: 67,
				previousOutstanding: 0,
				expenses: [{ amount: 150, description: "Room deep cleaning" }],
				totalCharges: 3757,
				amountPaid: 3757,
				currentOutstanding: 0,
				status: "Paid"
			}
		]
	},
	{
		id: "member-3",
		name: "Bob Wilson",
		phone: "+918345678901",
		firebaseUid: undefined,
		fcmToken: undefined,
		floor: Floors.third,
		bedType: BedTypes.bed,
		moveInDate: createMockTimestamp("2024-03-10"),
		securityDeposit: 1000,
		rentAtJoining: 1600,
		advanceDeposit: 1600,
		currentRent: 1600,
		note: "",
		currentMonthRent: {
			id: "2025-07",
			generatedAt: createMockTimestamp("2025-07-01"),
			rent: 1600,
			electricity: 280,
			wifi: 0, // Not opted for wifi
			previousOutstanding: 1600,
			expenses: [],
			totalCharges: 1880,
			amountPaid: 1500,
			currentOutstanding: 380,
			note: "Partial payment received",
			status: "Partial"
		},
		totalAgreedDeposit: 4200,
		isActive: true,
		optedForWifi: false,
		leaveDate: undefined,
		ttlExpiry: undefined,
		rentHistory: [
			{
				id: "2025-06",
				generatedAt: createMockTimestamp("2025-06-01"),
				rent: 1600,
				electricity: 300,
				wifi: 0,
				previousOutstanding: 0,
				expenses: [],
				totalCharges: 1900,
				amountPaid: 1900,
				currentOutstanding: 0,
				note: "",
				status: "Paid"
			}
		]
	},
	{
		id: "member-4",
		name: "Alice Johnson",
		phone: "+918456789012",
		firebaseUid: "firebase-uid-4",
		fcmToken: undefined,
		floor: Floors.second,
		bedType: BedTypes.special,
		moveInDate: createMockTimestamp("2024-04-01"),
		securityDeposit: 1000,
		rentAtJoining: 1700,
		advanceDeposit: 1700,
		currentRent: 1700,
		note: `11-12-2025 — Edited\r\n- Bed Type changed from Special\r\n- Amount Paid changed from 6400\r\n- Phone changed from 84567 89012\r\n- Name changed from Alice Johnson`,
		currentMonthRent: {
			id: "2025-07",
			generatedAt: createMockTimestamp("2025-07-01"),
			rent: 1700,
			electricity: 320,
			wifi: 67,
			previousOutstanding: 0,
			expenses: [
				{ amount: 100, description: "Common area cleaning" },
				{ amount: 50, description: "Maintenance" }
			],
			totalCharges: 2237,
			amountPaid: 2250,
			currentOutstanding: -13,
			note: "",
			status: "Overpaid"
		},
		totalAgreedDeposit: 4400,
		isActive: true,
		optedForWifi: true,
		leaveDate: undefined,
		ttlExpiry: undefined,
		rentHistory: [
			{
				id: "2025-06",
				generatedAt: createMockTimestamp("2025-06-01"),
				rent: 1700,
				electricity: 310,
				wifi: 67,
				previousOutstanding: 0,
				expenses: [],
				totalCharges: 2237,
				amountPaid: 2237,
				currentOutstanding: 0,
				note: "",
				status: "Paid"
			}
		]
	},
	{
		id: "member-5",
		name: "Charlie Brown",
		phone: "+918567890123",
		firebaseUid: undefined,
		fcmToken: undefined,
		floor: Floors.second,
		bedType: BedTypes.room,
		moveInDate: createMockTimestamp("2024-05-15"),
		securityDeposit: 1000,
		rentAtJoining: 3200,
		advanceDeposit: 3200,
		currentRent: 3200,
		note: "",
		currentMonthRent: {
			id: "2025-06",
			generatedAt: createMockTimestamp("2025-06-01"),
			rent: 3200,
			electricity: 320,
			wifi: 67,
			previousOutstanding: 0,
			expenses: [],
			totalCharges: 3627,
			amountPaid: 3627,
			currentOutstanding: 0,
			note: "Final month payment before leaving",
			status: "Paid"
		},
		totalAgreedDeposit: 7600,
		isActive: false, // Deactivated
		optedForWifi: true,
		leaveDate: createMockTimestamp("2025-06-30"), // Left at end of June
		ttlExpiry: createMockTimestamp("2025-12-30"),
		rentHistory: [
			{
				id: "2025-05",
				generatedAt: createMockTimestamp("2025-05-01"),
				rent: 3200,
				electricity: 310,
				wifi: 67,
				previousOutstanding: 0,
				expenses: [{ amount: 100, description: "Room cleaning" }],
				totalCharges: 3627,
				amountPaid: 3627,
				currentOutstanding: 0,
				note: "",
				status: "Paid"
			}
		]
	}
];

// Mock Electric Bills Data
export const mockElectricBills: ElectricBill[] = [
	{
		id: "2025-07",
		expenses: {
			amount: 100,
			description: "Plumbing",
			members: ["member-1", "member-3", "member-5"]
		},
		floorCosts: {
			[Floors.second]: {
				bill: 500,
				members: ["member-1", "member-2", "member-4"]
			},
			[Floors.third]: {
				bill: 200,
				members: ["member-3", "member-5"]
			}
		},
		wifi: {
			members: ["member-1", "member-2", "member-3"],
			amount: 150
		},
		floorIdNameMap: {
			"2nd": {
				"member-1": "John Doe",
				"member-2": "Jane Smith",
				"member-4": "Alice Johnson"
			},
			"3rd": {
				"member-3": "Bob Wilson",
				"member-5": "Charlie Brown"
			}
		}
	}
];

// Extract rent history from members for subcollection seeding
// Note: This should be used to seed subcollections under each member document
export const mockRentHistoryByMember: Record<string, RentHistory[]> = mockMembers.reduce(
	(acc, member) => {
		acc[member.id] = member.rentHistory;
		return acc;
	},
	{} as Record<string, RentHistory[]>
);

// In-memory data store for mock services
let defaultRents: DefaultValues = { ...mockGlobalSettings };
let adminConfigData: AdminConfig = { ...mockAdminConfig };
let membersData: MemberWithRentHistory[] = [...mockMembers];
let electricBillsData: ElectricBill[] = [...mockElectricBills];

// Export data stores for services to use
export const dataStore = {
	get defaultRents() {
		return defaultRents;
	},
	set defaultRents(data: DefaultValues) {
		defaultRents = data;
	},

	get adminConfig() {
		return adminConfigData;
	},
	set adminConfig(data: AdminConfig) {
		adminConfigData = data;
	},

	get members() {
		return membersData;
	},
	set members(data: MemberWithRentHistory[]) {
		membersData = data;
	},

	get electricBills() {
		return electricBillsData;
	},
	set electricBills(data: ElectricBill[]) {
		electricBillsData = data;
	}
};

// Helper functions for working with embedded rent history
export const getMemberWithRentHistory = (memberId: string): MemberWithRentHistory | undefined => {
	return membersData.find((member) => member.id === memberId);
};

export const getMemberRentHistory = (memberId: string) => {
	const member = getMemberWithRentHistory(memberId);
	return member?.rentHistory ?? [];
};

export const getCurrentMonthRentHistory = (memberId: string) => {
	const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
	const member = getMemberWithRentHistory(memberId);
	return member?.rentHistory.find((rh: RentHistory) => rh.id === currentMonth) ?? null;
};

export const getActiveMembersWithRentHistory = () => {
	return membersData.filter((member) => member.isActive);
};

export const getAllMembersWithOutstanding = () => {
	return membersData.filter(
		(member) => member.currentMonthRent?.currentOutstanding && member.currentMonthRent.currentOutstanding > 0
	);
};

export const getMembersByFloor = (floor: Floor) => {
	return membersData.filter((member) => member.floor === floor);
};

// Mock Current User for Authentication
export const mockCurrentUser = {
	email: "john.doe@gmail.com",
	linkedMemberId: "member-1" // Links to the first mock member
};

// Export individual collections for convenience
export { defaultRents as globalSettingsData, adminConfigData, membersData, electricBillsData };
