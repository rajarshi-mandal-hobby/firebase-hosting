import type { Timestamp } from "firebase/firestore";
import type { AdminConfig } from "../shemas/AdminConfig";

export * from "./constants";

export type Action = "add" | "edit" | "reactivate";

export interface ConfigCollection {
	globalSettings: DefaultValues | null;
	admins: AdminConfig | null;
}

export type PaymentStatus = "Due" | "Paid" | "Partial" | "Overpaid";

export const Floors = {
	second: "2nd",
	third: "3rd"
} as const;
export type Floor = (typeof Floors)[keyof typeof Floors];

export const BedTypes = {
	bed: "Bed",
	room: "Room",
	special: "Special"
} as const;
export type BedType = (typeof BedTypes)[keyof typeof BedTypes];

/**
 * Bed Rents
 */
export type BedRents = {
	[F in Floor]: F extends "2nd" ? Record<BedType, number> : Record<Exclude<BedType, "Special">, number>;
};

/**
 * Default Values
 */
export type DefaultValues = {
	// replaced invalid syntax with the explicit BedTypes mapping
	bedRents: BedRents;
	securityDeposit: number;
	wifiMonthlyCharge: number;
	upiVpa: string;
	currentBillingMonth: Timestamp;
	nextBillingMonth: Timestamp;
};

export interface Member {
	id: string; // Firestore document ID
	name: string;
	phone: string;
	floor: Floor;
	bedType: BedType;
	moveInDate: Timestamp;
	securityDeposit: number;
	rentAtJoining: number;
	advanceDeposit: number;
	currentRent: number;
	currentMonthRent: RentHistory; // Optional embedded current month rent
	totalAgreedDeposit: number;
	isActive: boolean;
	optedForWifi: boolean;
	note: string;
	leaveDate?: Timestamp;
	ttlExpiry?: Timestamp;
	firebaseUid?: string;
	fcmToken?: string;
}

export const toMember = (data: any): Member => {
	return {
		id: data.id,
		name: data.name,
		phone: data.phone,
		floor: data.floor,
		bedType: data.bedType,
		moveInDate: data.moveInDate,
		securityDeposit: data.securityDeposit,
		rentAtJoining: data.rentAtJoining,
		advanceDeposit: data.advanceDeposit,
		currentRent: data.currentRent,
		currentMonthRent: data.currentMonthRent,
		totalAgreedDeposit: data.totalAgreedDeposit,
		isActive: data.isActive,
		optedForWifi: data.optedForWifi,
		note: data.note,
		leaveDate: data.leaveDate,
		ttlExpiry: data.ttlExpiry,
		firebaseUid: data.firebaseUid,
		fcmToken: data.fcmToken
	};
};

export interface RentHistory {
	id: string; // YYYY-MM
	generatedAt: Timestamp;
	rent: number;
	electricity: number;
	wifi: number;
	previousOutstanding: number;
	expenses: Expense[];
	totalCharges: number;
	amountPaid: number;
	currentOutstanding: number;
	status: PaymentStatus;
	note?: string;
}

export interface Expense {
	amount: number;
	description: string;
}

/**
 * Electric Bill for a specific month
 * Collection: electric-bills
 * Document: YYYY-MM
 */
export interface ElectricBill {
	id: string;
	floorCosts: {
		[K in Floor]: {
			bill: number;
			members: string[];
		};
	};
	expenses: {
		members: string[];
		amount: number;
		description: string;
	};
	wifi: {
		members: string[];
		amount: number;
	};
	floorIdNameMap: Record<Floor, Record<string, string>>;
}
