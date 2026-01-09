import {
	collection,
	getDocs,
	query,
	where,
	orderBy,
	QuerySnapshot,
	getDocsFromCache,
	getDocsFromServer,
	type DocumentData,
	onSnapshot
} from "firebase/firestore";
import { db, functions } from "../../firebase";
import { simulateNetworkDelay, simulateRandomError } from "../utils/serviceUtils";
import type { Floor, BedType, Member, Action } from "../types";
import { httpsCallable } from "firebase/functions";
import type { SaveResult } from "../shemas/formResults";
import { useState, useSyncExternalStore } from "react";

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

export type MemberStatus = "active" | "inactive" | "all";

export const membersStore = {
	data: { active: [], inactive: [], all: [] } as Record<string, Member[]>,
	isLoading: true,
	error: null as Error | null,
	unsubscribe: null as (() => void) | null,
	listeners: new Set<() => void>(),

	subscribe(onStoreChange: () => void) {
		this.listeners.add(onStoreChange);

		// Prevents duplicate Firestore listeners [Singleton Gatekeeping]
		if (!this.unsubscribe) {
			const q = query(collection(db, "members"), orderBy("name", "asc"));

			this.unsubscribe = onSnapshot(
				q,
				{ includeMetadataChanges: true }, // Necessary to detect when writes finish
				(snapshot) => {
					const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Member);

					// Update pre-calculated lists for referential stability
					this.data = {
						all: allDocs,
						active: allDocs.filter((m) => m.isActive),
						inactive: allDocs.filter((m) => !m.isActive)
					};
					this.isLoading = false;
					this.error = null;
					this.notify();

					// Smart Auto-Stop logic
					const hasPending = snapshot.metadata.hasPendingWrites;
					const isFromCache = snapshot.metadata.fromCache;

					if (!hasPending && !isFromCache) {
						this.internalUnsubscribe();
					}
				},
				(err) => {
					this.error = err;
					this.isLoading = false;
					this.notify();
					this.internalUnsubscribe();
				}
			);
		}

		return () => {
			this.listeners.delete(onStoreChange);
			if (this.listeners.size === 0) this.internalUnsubscribe();
		};
	},

	internalUnsubscribe() {
		if (this.unsubscribe) {
			this.unsubscribe();
			this.unsubscribe = null;
		}
	},

	notify() {
		this.listeners.forEach((l) => l());
	},

	getSnapshot() {
		return this.data; // Stable reference
	}
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
	// Subscribing to the store to get the latest data
	membersStore.subscribe(() => {});
	const fn = httpsCallable(functions, "deactivateMember");
	const res = await fn({ memberId, leaveDate });
	return res.data as unknown as boolean;
};

export function useMembers(status: MemberStatus = "active") {
	const storeData = useSyncExternalStore(
		(onStoreChange) => membersStore.subscribe(onStoreChange),
		() => membersStore.getSnapshot()
	);

	return {
		members: storeData[status],
		isLoading: membersStore.isLoading,
		error: membersStore.error,
		refresh: () => membersStore.subscribe(() => {}) // Restarts the single listener
	};
}
