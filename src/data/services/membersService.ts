import {
	collection,
	getDocs,
	query,
	where,
	orderBy,
	QuerySnapshot,
	getDocsFromCache,
	getDocsFromServer,
	type DocumentData
} from "firebase/firestore";
import { db, functions } from "../../firebase";
import { simulateNetworkDelay, simulateRandomError } from "../utils/serviceUtils";
import type { Floor, BedType, Member, Action } from "../types";
import { httpsCallable } from "firebase/functions";
import type { SaveResult } from "../shemas/formResults";

export type ActiveStatus = "active" | "inactive" | "all";

export interface MemberFilters {
	reload: boolean;
	isActive: ActiveStatus;
}

// Cache for storing member data based on filters
const cache: Map<string, Member[]> = new Map();
// Map to store promises for each unique filter combination
const currentFetchPromises: Map<string, Promise<Member[]>> = new Map();

export const fetchMembers = async ({ reload, ...filters }: MemberFilters): Promise<Member[]> => {
	// Create a cache key based on filters (serialize to string for uniqueness)
	const cacheKey = Object.keys(filters).length > 0 ? JSON.stringify(filters) : "default";

	if (reload) {
		cache.delete(cacheKey);
		currentFetchPromises.delete(cacheKey);
	}

	// If data is in cache, return a resolved promise immediately
	if (cache.has(cacheKey)) {
		return Promise.resolve(cache.get(cacheKey)!);
	}

	// If a fetch is in progress for these filters, return the existing promise
	if (currentFetchPromises.has(cacheKey)) {
		return currentFetchPromises.get(cacheKey)!;
	}

	// Create a new promise and store it
	const newPromise = (async () => {
		try {
			await simulateNetworkDelay();
			simulateRandomError();
			const membersQuery = collection(db, "members").withConverter<Member>({
				toFirestore: (data) => data,
				fromFirestore: (snapshot) => snapshot.data() as Member
			});

			// Apply filters
			const constraints: any[] = [];
			if (filters.isActive === "active") {
				constraints.push(where("isActive", "==", true));
			} else if (filters.isActive === "inactive") {
				constraints.push(where("isActive", "==", false));
			} else if (filters.isActive === "all") {
				// Clear any isActive filter to fetch all members
				constraints.length = 0;
			}

			console.log("Applying filters:", ...constraints);
			// Create filtered query
			const q = query(membersQuery, ...constraints, orderBy("name"));

			let snapshot: QuerySnapshot<Member, DocumentData>;

			if (reload) {
				snapshot = await getDocsFromServer(q);
			} else {
				try {
					snapshot = await getDocsFromCache(q);
					// If no data is found in cache, fetch from server
					if (snapshot.empty) {
						throw new Error("No members found in cache, fetching from server");
					}
				} catch {
					snapshot = await getDocs(q);
				}
			}

			if (snapshot.empty) {
				throw new Error("No members found");
			}

			const data = snapshot.docs.map((doc) => doc.data());
			cache.set(cacheKey, data); // Cache the data for these filters
			return data;
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			error.name = "FetchMembersError";
			throw error;
		} finally {
			currentFetchPromises.delete(cacheKey); // Clear the promise reference when done
		}
	})();

	currentFetchPromises.set(cacheKey, newPromise);
	return newPromise;
};

export type MemberDetailsFormRequestData = {
	id?: string;
	name: string;
	phone: string;
	floor: Floor;
	bedType: BedType;
	rentAmount: number;
	rentAtJoining?: number;
	securityDeposit: number;
	advanceDeposit: number;
	isOptedForWifi: boolean;
	moveInDate: Date;
	note: string;
	amountPaid: number;
	shouldForwardOutstanding: boolean;
	outstandingAmount: number;
	action: Action;
};

export const memberOperations = async (data: MemberDetailsFormRequestData): Promise<SaveResult> => {
	console.log(data);
	const fn = httpsCallable(functions, "memberOperations");
	const res = await fn(data);
	const result = res.data as unknown as SaveResult;

	if (result.success) {
		return {
			success: true
		};
	} else {
		return {
			success: false,
			errors: result.errors
		};
	}
};

export const deactivateMember = async (memberId: string, leaveDate: string): Promise<boolean> => {
	const fn = httpsCallable(functions, "deactivateMember");
	const res = await fn({ memberId, leaveDate });
	return res.data as unknown as boolean;
};
