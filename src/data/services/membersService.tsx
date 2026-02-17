import type { Unsubscribe } from 'firebase/auth';
import {
    collection,
    where,
    query,
    orderBy,
    QuerySnapshot,
    type DocumentData,
    getDocsFromServer,
    getDocsFromCache,
    getDocs,
    onSnapshot
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { createContext, useContext, useSyncExternalStore } from 'react';
import { db, functions } from '../../firebase';
import type { SaveResult } from '../shemas/formResults';
import type { Member, Floor, BedType, MemberAction } from '../types';
import { simulateNetworkDelay, simulateRandomError } from '../utils/serviceUtils';

export type ActiveStatus = 'active' | 'inactive' | 'all';

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
    const cacheKey = Object.keys(filters).length > 0 ? JSON.stringify(filters) : 'default';

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
            const membersQuery = collection(db, 'members').withConverter<Member>({
                toFirestore: (data) => data,
                fromFirestore: (snapshot) => snapshot.data() as Member
            });

            // Apply filters
            const constraints: any[] = [];
            if (filters.isActive === 'active') {
                constraints.push(where('isActive', '==', true));
            } else if (filters.isActive === 'inactive') {
                constraints.push(where('isActive', '==', false));
            } else if (filters.isActive === 'all') {
                // Clear any isActive filter to fetch all members
                constraints.length = 0;
            }

            console.log('Applying filters:', ...constraints);
            // Create filtered query
            const q = query(membersQuery, ...constraints, orderBy('name'));

            let snapshot: QuerySnapshot<Member, DocumentData>;

            if (reload) {
                snapshot = await getDocsFromServer(q);
            } else {
                try {
                    snapshot = await getDocsFromCache(q);
                    // If no data is found in cache, fetch from server
                    if (snapshot.empty) {
                        throw new Error('No members found in cache, fetching from server');
                    }
                } catch {
                    snapshot = await getDocs(q);
                }
            }

            if (snapshot.empty) {
                throw new Error('No members found');
            }

            const data = snapshot.docs.map((doc) => doc.data());
            cache.set(cacheKey, data); // Cache the data for these filters
            return data;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            error.name = 'FetchMembersError';
            throw error;
        } finally {
            currentFetchPromises.delete(cacheKey); // Clear the promise reference when done
        }
    })();

    currentFetchPromises.set(cacheKey, newPromise);
    return newPromise;
};

export type MemberStatus = 'active' | 'inactive' | 'all';

// Define the full state shape for the snapshot

interface StoreState {
    data: Record<MemberStatus, Member[]>;
    isLoading: boolean;
    error: Error | null;
}

// --- Store Implementation ---
// membersStore.ts
export const membersStore = {
    state: {
        data: { active: [], inactive: [], all: [] },
        isLoading: true,
        error: null
    } as StoreState,

    unsubscribe: null as Unsubscribe | null,
    listeners: new Set<() => void>(),

    subscribe: (onStoreChange: () => void) => {
        membersStore.listeners.add(onStoreChange);

        if (!membersStore.unsubscribe) {
            const q = query(collection(db, 'members'), orderBy('name', 'asc'));
            // FIX: includeMetadataChanges: false avoids the "double-render" sync
            membersStore.unsubscribe = onSnapshot(
                q,
                { includeMetadataChanges: false },
                (snapshot) => {
                    const all = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Member);
                    membersStore.state = {
                        data: { all, active: all.filter((m) => m.isActive), inactive: all.filter((m) => !m.isActive) },
                        isLoading: false,
                        error: null
                    };
                    membersStore.notify();
                },
                (err) => {
                    membersStore.state = { ...membersStore.state, error: err, isLoading: false };
                    membersStore.notify();
                }
            );
        }

        return () => {
            membersStore.listeners.delete(onStoreChange);
            if (membersStore.listeners.size === 0 && membersStore.unsubscribe) {
                membersStore.unsubscribe();
                membersStore.unsubscribe = null;
            }
        };
    },

    getSnapshot: () => membersStore.state,
    notify: () => membersStore.listeners.forEach((l) => l()),

    forceRefresh: () => {
        membersStore.state = { ...membersStore.state, isLoading: true, error: null };
        membersStore.notify();
    }
};

// --- Hook Implementation ---
// export function useMembers(status: MemberStatus = 'active') {
//     // React monitors the reference returned by getSnapshot.
//     // Since we only update membersStore.state when data actually changes,
//     // this is highly performant.
//     const storeState = useSyncExternalStore(
//         membersStore.subscribe,
//         membersStore.getSnapshot,
//         membersStore.getServerSnapshot
//     );

//     return {
//         // Instant dynamic filtering by accessing the pre-computed slice
//         members: storeState.data[status],
//         isLoading: storeState.isLoading,
//         error: storeState.error,
//         refresh: membersStore.forceRefresh
//     };
// }

// MembersContext.tsx
const MembersContext = createContext<StoreState | null>(null);

export function MembersProvider({ children }: { children: React.ReactNode }) {
    // Static subscription: This hook NEVER re-runs its effect
    const state = useSyncExternalStore(
        membersStore.subscribe,
        membersStore.getSnapshot,
        membersStore.getSnapshot // getServerSnapshot
    );

    console.log('ℹ️ MembersProvider called');

    return <MembersContext value={state}>{children}</MembersContext>;
}

// 3. The Hook for your Tab Components
export function useMembers(status: MemberStatus = 'active') {
    const state = useContext(MembersContext);
    if (!state) throw new Error('useMembers must be used within MembersProvider');

    // React Compiler will memoize this slice automatically
    return {
        members: state.data[status] ?? [],
        isLoading: state.isLoading,
        error: state.error,
        refresh: () => membersStore.unsubscribe?.() // Optional trigger
    };
}

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
    action: MemberAction;
};

export const memberOperations = async (data: MemberDetailsFormRequestData): Promise<SaveResult> => {
    console.log(data);
    const fn = httpsCallable(functions, 'memberOperations');
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
    membersStore.forceRefresh();
    const fn = httpsCallable(functions, 'deactivateMember');
    const res = await fn({ memberId, leaveDate });
    return res.data as unknown as boolean;
};
