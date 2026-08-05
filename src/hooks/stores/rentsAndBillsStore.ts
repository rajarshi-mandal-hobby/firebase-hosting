import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DB } from '../../data/types';
import type { BaseRentsAndRollingBills } from '../../data/types/DefaultRents';
import type { FirebaseError } from 'firebase/app';

interface StoreSnapshot {
    rentsAndBills: BaseRentsAndRollingBills | null;
    loading: boolean;
    error: FirebaseError | null;
}

let currentSnapshot: StoreSnapshot = { rentsAndBills: null, loading: true, error: null };
const listeners = new Set<VoidFunction>();
const emitChange = () => listeners.forEach((l) => l());

async function fetchRentsAndBills() {
    currentSnapshot = { loading: true, rentsAndBills: null, error: null };

    try {
        const docRef = doc(db, DB.rentsAndBillsDoc);
        const snap = await getDoc(docRef);
        if (!snap.exists()) throw new Error('Rents and Bills not found');
        currentSnapshot = { rentsAndBills: snap.data() as BaseRentsAndRollingBills, loading: false, error: null };
    } catch (error) {
        currentSnapshot = { rentsAndBills: null, loading: false, error: error as FirebaseError };
    } finally {
        emitChange();
    }
}

export const rentsAndBillsStore = {
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
        await fetchRentsAndBills();
    },
    resetStore() {
        currentSnapshot = { rentsAndBills: null, loading: true, error: null };
    },
    async refetch() {
        rentsAndBillsStore.resetStore();
        emitChange();
        await fetchRentsAndBills();
    }
};
