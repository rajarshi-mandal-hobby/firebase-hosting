import {
    collection,
    doc,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    orderBy,
    Query,
    query,
    QueryDocumentSnapshot,
    startAfter,
    type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { createFetcher, createKeyedFetcher } from './fetcherFactories';
import { DEFAULT_RENTS, ELECTRICITY, ERROR_CAUSE, MEMBERS } from '../data/types/constants';
import type { DefaultRents, ElectricBill, RentHistory } from '../data/types';

export const fetchDefaultRents = createFetcher(async () => {
    const docRef = doc(db, DEFAULT_RENTS.COL, DEFAULT_RENTS.DOC);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
        throw new Error('Default Rents not found', { cause: ERROR_CAUSE.DATA_MISSING });
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

// 1. We need a way to store cursors outside the fetch function 
// so that Page 2 knows where Page 1 ended.
const pageCursors = new Map<string, QueryDocumentSnapshot<DocumentData>>();

// 2. Define a Key that includes the page number
type MemberPageKey = { memberId: string; page: number };

export const fetchRentHistoryForMember = createKeyedFetcher(async (key: MemberPageKey, refresh: boolean) => {
    const { memberId, page } = key;
    const collectionRef = collection(db, 'members', memberId, 'test-history');
    const limitValue = 12;

    // Handle Refresh: Clear cursors for this member if starting over
    if (refresh && page === 0) {
        // Clear all cursors for this specific member
        for (const k of pageCursors.keys()) {
            if (k.startsWith(`${memberId}_`)) pageCursors.delete(k);
        }
    }

    // Identify the cursor from the PREVIOUS page
    // Page 0 has no cursor. Page 1 needs the cursor from Page 0.
    const prevPageKey = `${memberId}_${page - 1}`;
    const lastVisible = page > 0 ? pageCursors.get(prevPageKey) : null;

    let q: Query<DocumentData>;
    if (!lastVisible) {
        q = query(collectionRef, orderBy('generatedAt', 'desc'), limit(limitValue));
    } else {
        q = query(collectionRef, orderBy('generatedAt', 'desc'), startAfter(lastVisible), limit(limitValue));
    }

    const docSnapshot = await getDocs(q);

    // Store the last document of THIS page for the NEXT page to use
    if (docSnapshot.docs.length > 0) {
        const currentPageKey = `${memberId}_${page}`;
        pageCursors.set(currentPageKey, docSnapshot.docs[docSnapshot.docs.length - 1]);
    }

    // Return the data
    return docSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as RentHistory[];
});
