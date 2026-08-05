import { doc, getDoc } from 'firebase/firestore';
import { createContext, use, useSyncExternalStore, useEffect, useTransition, useEffectEvent } from 'react';
import { type DefaultRents, DB, type ReactChildren } from '../data/types';
import { db } from '../firebase';

interface StoreSnapshot {
    defaultRents: DefaultRents | null;
    loading: boolean;
    error: Error | null;
}

let currentSnapshot: StoreSnapshot = { defaultRents: null, loading: true, error: null };
const listeners = new Set<VoidFunction>();
const emitChange = () => listeners.forEach((l) => l());

async function fetchDefaultRents() {
    currentSnapshot = { loading: true, defaultRents: null, error: null };
    console.log('Fetching Rents');
    try {
        const docRef = doc(db, DB.defaultValuesDoc);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error('Default rents not found');
        currentSnapshot = { defaultRents: snap.data() as DefaultRents, loading: false, error: null };
    } catch (error) {
        currentSnapshot = { defaultRents: null, loading: false, error: error as Error };
    } finally {
        emitChange();
    }
}

export const defaultRentsStore = {
    subscribe(onStoreChange: VoidFunction) {
        listeners.add(onStoreChange);
        return () => {
            listeners.delete(onStoreChange);
        };
    },
    getSnapshot() {
        return currentSnapshot;
    },
    async triggerFetch() {
        await fetchDefaultRents();
    },
    resetDefaultRentsStore() {
        currentSnapshot = { defaultRents: null, loading: true, error: null };
    },
    async refetchDefaultRents() {
        defaultRentsStore.resetDefaultRentsStore();
        await fetchDefaultRents();
    }
};

const RentsContext = createContext<StoreSnapshot | null>(null);

export const RentsProvider = ({ children }: ReactChildren) => {
    const snapshot = useSyncExternalStore(defaultRentsStore.subscribe, defaultRentsStore.getSnapshot);

    return <RentsContext value={snapshot}>{children}</RentsContext>;
};

/**
 * @deprecated use `useDefaultValuesStore` instead
 */
export const useRents = () => {
    const snapshot = use(RentsContext);
    if (!snapshot) {
        throw new Error('useRents must be used within RentsProvider');
    }
    const [isPending, startTransition] = useTransition();

    const fetchEnvt = useEffectEvent(() => {
        if (isPending || !!snapshot.defaultRents) return;
        startTransition(defaultRentsStore.triggerFetch);
    });

    useEffect(() => {
        fetchEnvt();
    }, []);

    return {
        defaultRents: snapshot?.defaultRents,
        isPending,
        error: snapshot?.error,
        resetStore: defaultRentsStore.resetDefaultRentsStore,
        refetchDefaultRents: defaultRentsStore.refetchDefaultRents
    } as const;
};
