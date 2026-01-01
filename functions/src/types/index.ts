import { Timestamp } from "firebase-admin/firestore";
import { FlatErrors } from "valibot";

export * from "./constansts.js";

/**
 * Response type for save operations
 */
export type SaveResponse =
	| {
			success: true;
	  }
	| {
			success: false;
			errors: FlatErrors<any>;
	  };

/**
 * Floors Constants
 */
export const Floors = {
	second: "2nd",
	third: "3rd"
} as const;

/**
 * Floor Type
 */
export type Floor = (typeof Floors)[keyof typeof Floors];

/**
 * Bed Types Constants
 */
export const BedTypes = {
	bed: "Bed",
	room: "Room",
	special: "Special"
} as const;

/**
 * Bed Type
 */
export type BedType = (typeof BedTypes)[keyof typeof BedTypes];

/**
 * Admin Roles Constants
 */
export const AdminRoles = {
	primary: "primary",
	secondary: "secondary"
} as const;

/**
 * Admin Role
 */
export type AdminRole = (typeof AdminRoles)[keyof typeof AdminRoles];

/**
 * Payment Status Constants
 */
export const PaymentStatuses = {
	due: "Due",
	paid: "Paid",
	partial: "Partial",
	overpaid: "Overpaid"
} as const;

/**
 * Payment Status
 */
export type PaymentStatus = (typeof PaymentStatuses)[keyof typeof PaymentStatuses];

/**
 * Admin Interface
 */
export interface Admin {
	email: string;
	uid: string;
	role: AdminRole;
	addedAt: Timestamp;
	addedBy: string;
}

export interface AdminConfig {
	list: Admin[];
	primaryAdminUid: string;
	maxAdmins: number;
}

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

/**
 * Action
 */
export const Actions = {
	add: "add",
	edit: "edit",
	reactivate: "reactivate"
} as const;

export type Action = (typeof Actions)[keyof typeof Actions];

/**
 * Member
 */
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
	totalAgreedDeposit: number;
	isActive: boolean;
	optedForWifi: boolean;
	note?: string;
	leaveDate?: Timestamp;
	ttlExpiry?: Timestamp;
	firebaseUid?: string;
	fcmToken?: string;
}

/**
 * Member With Current Month Rent
 */
export interface MemberWithCurrentMonthRent extends Member {
	currentMonthRent: RentHistory;
}

export interface MemberWithRentHistory extends MemberWithCurrentMonthRent {
	rentHistory: RentHistory[];
}

/**
 * Expense
 */
export interface Expense {
	amount: number;
	description: string;
}

/**
 * Rent History
 */
export interface RentHistory {
	id: string; // YYYY-MM
	generatedAt: Timestamp;
	rent: number;
	electricity: number;
	wifi: number;
	expenses: Expense[];
	totalCharges: number;
	amountPaid: number;
	currentOutstanding: number;
	status: PaymentStatus;
}

/**
 * Electric Bill
 */
export interface ElectricBill {
	id: string;
	floorCosts: {
		[K in Floor]: {
			bill: number;
			members: {
				name: string;
				id: string;
			}[];
		};
	};
	appliedBulkExpenses: {
		members: {
			name: string;
			id: string;
		}[];
		amount: number;
		description: string;
	};
	generatedAt: Timestamp;
	lastUpdated: Timestamp;
}

// Response types
export interface CloudFunctionResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

// Request types for functions
export interface GetMembersRequest {
	includeInactive?: boolean;
	floor?: Floor;
	searchTerm?: string;
}

export interface GetMemberRequest {
	memberId: string;
	includeRentHistory?: boolean;
}

export interface GetRentHistoryRequest {
	memberId: string;
	limit?: number;
	startAfter?: string; // For pagination
}

// Error types
export interface FunctionError {
	code: string;
	message: string;
	details?: unknown;
}
