import { doc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db } from '../../../firebase';
import type { SaveResult } from '../shemas/formResults';
import { GlobalSettings, type GlobalSettingsFormValues } from '../shemas/GlobalSettings';
import { simulateNetworkDelay } from '../utils/serviceUtils';

/**
 * Fetch both global settings and admin configuration together.
 */
export const getConfigDb = async (refresh = false): Promise<GlobalSettings> => {
  await simulateNetworkDelay(1000); // Simulate network delay for UX

  const configCollectionRef = doc(db, 'config', 'globalSettings').withConverter(GlobalSettings);

  // If refresh/serverFirst requested, skip cache attempt and go straight to server.
  let configCol = await getDocFromServer(configCollectionRef);
  if (refresh) {
    configCol = await getDocFromServer(configCollectionRef);
  } else {
    // Try cache first; if unavailable or incomplete, fall back to server.
    try {
      configCol = await getDocFromCache(configCollectionRef);
    } catch {
      configCol = await getDocFromServer(configCollectionRef);
    }
  }

  console.log(configCol.metadata.fromCache ? 'Config: loaded from cache' : 'Config: loaded from server');

  // Perform checks after the reduction
  if (!configCol.exists()) {
    throw new Error('Global settings document missing');
  }

  return configCol.data();
};

const configDocRef = doc(db, 'config', 'globalSettings').withConverter(GlobalSettings);
let fetchCount = 0; // For testing ErrorBoundary
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
    await simulateNetworkDelay(500);
    // Throw error first time only for testing ErrorBoundary
    try {
      let docSnapshot;
      if (refresh) {
        docSnapshot = await getDocFromServer(configDocRef);
      } else {
        try {
          docSnapshot = await getDocFromCache(configDocRef);
        } catch {
          docSnapshot = await getDocFromServer(configDocRef);
        }
      }

      if (fetchCount === 0) {
        fetchCount += 1;
        throw new Error('Simulated fetch error');
      }

      if (!docSnapshot.exists()) {
        throw new Error('Global settings document missing');
      }
      console.log(
        docSnapshot.metadata.fromCache ? 'Global settings loaded from cache' : 'Global settings loaded from server'
      );
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
