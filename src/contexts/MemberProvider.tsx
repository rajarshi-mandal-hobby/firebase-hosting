import type { Unsubscribe } from 'firebase/auth';
import {
    collection,
    query,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { createContext, use, useSyncExternalStore } from 'react';
import { db } from '../firebase';
import type { Member } from '../data/types';

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

const MembersContext = createContext<StoreState | null>(null);

export function MembersProvider({ children }: { children: React.ReactNode }) {
    // Static subscription: This hook NEVER re-runs its effect
    const state = useSyncExternalStore(membersStore.subscribe, membersStore.getSnapshot);

    return <MembersContext value={state}>{children}</MembersContext>;
}

// 3. The Hook for your Tab Components
export function useMembers(status: MemberStatus = 'active') {
    const state = use(MembersContext);
    if (!state) throw new Error('useMembers must be used within MembersProvider');

    // React Compiler will memoize this slice automatically
    return {
        members: state.data[status] ?? [],
        isLoading: state.isLoading,
        error: state.error,
        handleRefresh: () => membersStore.unsubscribe?.() // Optional trigger
    };
}

export function useMember(memberId: string) {
    const state = use(MembersContext);
    if (!state) throw new Error('useMember must be used within MembersProvider');

    return state.data.all.find((m) => m.id === memberId) ?? null;
}

