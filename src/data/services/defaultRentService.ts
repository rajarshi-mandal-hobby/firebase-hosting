import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase';
import type { SaveResult } from '../shemas/formResults';
import { createFetcher } from './fetcherFactories';
import { DEFAULT_RENTS } from '../types/constants';
import type { DefaultRents } from '../types';

export const fetchDefaultRents = createFetcher(async () => {
    const docRef = doc(db, DEFAULT_RENTS.COL, DEFAULT_RENTS.DOC);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
        throw new Error('Default Values document missing', { cause: 'default-rents-missing' });
    }

    const data = docSnapshot.data() as DefaultRents;
    return data;
});

/**
 * Save default values with proper error handling and validation
 */
export const saveDefaultRents = async (updates: any): Promise<SaveResult> => {
    try {
        const fn = httpsCallable(functions, 'saveDefaultRents');
        const res = await fn(updates);

        const data = res.data as SaveResult;

        if (data.success) {
            return {
                success: true
            };
        } else {
            return {
                success: false,
                errors: data.errors
            };
        }
    } catch (error) {
        console.error('Error saving default values:', error);
        throw error;
    }
};
