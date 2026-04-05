import {
    collection,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    QueryDocumentSnapshot,
    startAfter
} from 'firebase/firestore';
import { db } from '../firebase';
import { createFetcher, createKeyedFetcher, createNewFetcher } from './fetcherFactories';
import { DEFAULT_RENTS, ELECTRICITY, ERROR_CAUSE } from '../data/types/constants';
import type { DefaultRents, ElectricBill } from '../data/types';
import { simulateNetworkDelay, simulateRandomError } from '../data/utils/serviceUtils';

export const fetchDefaultRents = createFetcher(async () => {
    simulateRandomError();
    await simulateNetworkDelay();
    const docRef = doc(db, DEFAULT_RENTS.COL, DEFAULT_RENTS.DOC);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
        return null;
    }

    const data = docSnapshot.data() as DefaultRents;
    return data;
});

export const fetchDefaultRentsWithCache = createNewFetcher(async () => {
    simulateRandomError();
    await simulateNetworkDelay(1500);
    const docRef = doc(db, DEFAULT_RENTS.COL, DEFAULT_RENTS.DOC);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
        return null;
    }

    const data = docSnapshot.data() as DefaultRents;
    return data;
});

export const fetchElectricBillForMonth = createKeyedFetcher(async (month: string) => {
    // Test if month is in format YYYY-MM-DD
    let monthToLoad = month;
    switch (true) {
        case /^\d{4}-\d{2}-\d{2}$/.test(month):
            monthToLoad = month.slice(0, 7);
            break;
        case /^\d{4}-\d{2}$/.test(month):
            monthToLoad = month;
            break;
        default:
            throw new Error('Invalid month format', { cause: ERROR_CAUSE.INVALID_DATA });
    }

    const docRef = doc(db, ELECTRICITY.COL, monthToLoad);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
        throw new Error('Electric Bill not found', { cause: ERROR_CAUSE.DATA_MISSING });
    }

    const data = docSnapshot.data() as ElectricBill;
    return data;
});

export interface PaginationResult<T> {
    data: T[];
    lastDoc: QueryDocumentSnapshot | null;
    hasMore: boolean;
    totalCount: number;
}

// The actual Firestore logic
export const fetchHistoryPage = createKeyedFetcher(
    async ({
        memberId,
        lastDoc,
        pageSize = 13
    }: {
        memberId: string;
        lastDoc: any;
        pageSize?: number;
    }): Promise<PaginationResult<any>> => {
        const colRef = collection(db, 'members', memberId, 'rent-history');

        const countSnapshot = await getCountFromServer(colRef);
        const totalCount = countSnapshot.data().count;

        let q = query(colRef, orderBy('generatedAt', 'desc'), limit(pageSize));
        if (lastDoc) {
            q = query(colRef, orderBy('generatedAt', 'desc'), startAfter(lastDoc), limit(pageSize));
        }

        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

        return {
            data,
            lastDoc: lastVisible,
            hasMore: data.length >= pageSize,
            totalCount
        };
    }
);
