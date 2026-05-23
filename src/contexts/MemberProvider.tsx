import type { Unsubscribe } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { createContext, use, useEffect, useEffectEvent, useState, useSyncExternalStore, useTransition } from 'react';
import { db } from '../firebase';
import type { Member, MemberStatus } from '../data/types';

interface StoreState {
    snapshot: Record<MemberStatus, Member[]>;
    isLoading: boolean;
    error: Error | null;
}

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

export const membersStore = {
    state: { snapshot: { active: [], inactive: [], all: [] }, isLoading: true, error: null } as StoreState,
    unsubscribe: null as Unsubscribe | null,
    listeners: new Set<() => void>(),
    inactivityTimeout: null as ReturnType<typeof setTimeout> | null,

    // Core cleanup logic moved to a central function
    stopFirestore: () => {
        if (membersStore.unsubscribe) {
            membersStore.unsubscribe();
            membersStore.unsubscribe = null;
            // Reset to loading so it fresh-starts when the user returns
            membersStore.state = { ...membersStore.state, isLoading: true };
            membersStore.notify();
        }
    },

    startFirestore: () => {
        if (!membersStore.unsubscribe) {
            const q = query(collection(db, 'members'), orderBy('name', 'asc'));

            membersStore.unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const inactive: Member[] = [];
                    const active: Member[] = [];
                    const all = snapshot.docs.map((doc) => {
                        const data = { id: doc.id, ...doc.data() } as Member;
                        if (data.isActive) active.push(data);
                        else inactive.push(data);
                        return data;
                    });

                    membersStore.state = {
                        snapshot: { all, active, inactive },
                        isLoading: false,
                        error: null,
                    };
                    membersStore.notify();
                },
                (err) => {
                    membersStore.state = { ...membersStore.state, error: err, isLoading: false };
                    membersStore.notify();
                },
            );
        }
    },

    subscribe: (onStoreChange: () => void) => {
        membersStore.listeners.add(onStoreChange);

        // Cancel any pending "off-screen" unsubscribe if someone is looking at the app
        if (membersStore.inactivityTimeout) {
            clearTimeout(membersStore.inactivityTimeout);
            membersStore.inactivityTimeout = null;
        }

        membersStore.startFirestore();

        return () => {
            membersStore.listeners.delete(onStoreChange);
            if (membersStore.listeners.size === 0) {
                membersStore.stopFirestore();
            }
        };
    },

    getSnapshot: () => membersStore.state,
    notify: () => Array.from(membersStore.listeners).forEach((l) => l()),
};

// Global Visibility Listener
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Start 15-minute countdown when user leaves the tab
        membersStore.inactivityTimeout = setTimeout(() => {
            membersStore.stopFirestore();
        }, INACTIVITY_LIMIT);
    } else {
        // Cancel timer and restart if user returns before 15 mins
        if (membersStore.inactivityTimeout) {
            clearTimeout(membersStore.inactivityTimeout);
            membersStore.inactivityTimeout = null;
        }
        // If it already unsubscribed, restart it now that they are back
        if (membersStore.listeners.size > 0) {
            membersStore.startFirestore();
        }
    }
});

// --- Store Implementation ---

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
        members: state.snapshot[status] ?? [],
        isLoading: state.isLoading,
        error: state.error,
    };
}

export function useMember(memberId: string) {
    const state = use(MembersContext);
    if (!state) throw new Error('useMember must be used within MembersProvider');

    const [member, setMember] = useState<Member | null>(null);
    const [isSearching, startTransition] = useTransition();

    const serchEvent = useEffectEvent(() => {
        const member = state.snapshot.all.find((m) => m.id === memberId) ?? null;
        setMember(member);
    });

    useEffect(() => {
        startTransition(serchEvent);
    }, [memberId]);

    return { member, isSearching };
}
