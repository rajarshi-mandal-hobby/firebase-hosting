import { doc, getDoc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db } from '../../../firebase';
import type { SaveResult } from '../shemas/formResults';
import { GlobalSettings, type GlobalSettingsFormValues } from '../shemas/GlobalSettings';
import { simulateNetworkDelay } from '../utils/serviceUtils';

const configDocRef = doc(db, 'config', 'globalSettings').withConverter(GlobalSettings);
let cache: GlobalSettings | null = null;
let currentFetchPromise: Promise<GlobalSettings> | null = null;

export const fetchGlobalSettings = async (refresh = false) => {
  if (refresh) {
    cache = null;
    currentFetchPromise = null;
  }

  // If data is in cache, return a resolved promise immediately
  if (cache) {
    return Promise.resolve(cache);
  }

  // If a fetch is in progress, return the existing promise
  if (currentFetchPromise) {
    return currentFetchPromise;
  }

  // Create a new promise and store it
  const newPromise = (async () => {
    await simulateNetworkDelay(2000);
    // Throw error first time only for testing ErrorBoundary
    try {
      const docSnapshot = await getDoc(configDocRef);

      if (!docSnapshot.exists()) {
        throw new Error('Global settings document missing');
      }

      const fromCache = docSnapshot.metadata.fromCache;
      console.log('Global settings fetched. From cache:', fromCache, 'From server:', !fromCache);
      if (fromCache) {
        throw new Error('Data is stale');
      }

      const data = docSnapshot.data();
      cache = data; // Cache the data
      return data;
    } finally {
      currentFetchPromise = null; // Clear the promise reference when done
    }
  })();

  currentFetchPromise = newPromise;
  return newPromise;
};

/**
 * Save global settings with proper error handling and validation
 */
export const saveGlobalSettings = async (updates: GlobalSettingsFormValues): Promise<SaveResult> => {
  await simulateNetworkDelay(1000);

  const fn = httpsCallable(getFunctions(), 'saveGlobalSettings');
  const res = await fn(updates);

  const data = res.data as unknown as SaveResult;

  if (data.success) {
    return {
      success: true,
    };
  } else {
    return {
      success: false,
      errors: data.errors,
    };
  }
};
