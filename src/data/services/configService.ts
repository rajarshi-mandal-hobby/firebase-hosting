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

/**
 * Save global settings with proper error handling and validation
 */
export const saveGlobalSettings = async (updates: GlobalSettingsFormValues): Promise<SaveResult> => {
  await simulateNetworkDelay(1000);

  const fn = httpsCallable(getFunctions(), 'saveGlobalSettings');
  const res = await fn(updates);

  const data = res.data as unknown as SaveResult;
  console.log('saveGlobalSettings response:', data);
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
