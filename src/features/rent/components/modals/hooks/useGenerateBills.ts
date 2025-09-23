import { useCallback, useEffect, useRef, useState } from 'react';
import { GlobalSettings } from '../../../../../data/shemas/GlobalSettings';
import { getConfigDb } from '../../../../../data/services/configService';
import { fetchElectricBillByMonth } from '../../../../../data/services/electricService';
import type { ElectricBill } from '../../../../../shared/types/firestore-types';
import { set } from 'zod';

type ErrorState = {
  from: 'settings' | 'bill';
  error: Error;
  retryData?: { month?: string };
} | null;

export const useGenerateBills = (enabled: boolean = true) => {
  const [settings, setSettings] = useState<GlobalSettings | undefined>();
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ErrorState>(null);

  const isSettingsLoadedRef = useRef(settings !== undefined);

  // Cache for electric bills (month -> ElectricBill)
  const billCacheRef = useRef<Record<string, ElectricBill>>({});
  const fetchingRef = useRef<Record<string, Promise<ElectricBill>>>({});

  const getSettings = (refresh = false) => {
    setLoading(true);
    setError(null);
    getConfigDb(refresh)
      .then((settings) => {
        setSettings(settings);
      })
      .catch((error) => {
        setError({ from: 'settings', error });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchSettings = useCallback(() => getSettings(false), []);
  const retrySettings = useCallback(() => getSettings(true), []);

  const getElectricBill = async (month: string, refresh = false) => {
    const monthKey = month.slice(0, 7); // Ensure format is YYYY-MM

    // Return cached data if available and not refreshing
    if (!refresh && billCacheRef.current[monthKey]) {
      setError(null); // Clear any previous errors
      return Promise.resolve(billCacheRef.current[monthKey]);
    }

    // Return existing promise if already fetching
    if (monthKey in fetchingRef.current) {
      return fetchingRef.current[monthKey];
    }

    console.log('Fetching electric bill for month:', monthKey);
    // Set loading state and clear errors
    setError(null);
    setLoading(true);
    

    // Create new fetch promise
    const fetchPromise = fetchElectricBillByMonth(monthKey, refresh)
      .then(async (bill) => {
        // Cache the result
        billCacheRef.current[monthKey] = bill;
        // Clean up the fetching promise
        delete fetchingRef.current[monthKey];
        // Clear loading state
        setLoading(false);
        return bill;
      })
      .catch((error) => {
        console.error('Error fetching electric bill:', error);
        // Clean up the fetching promise on error
        delete fetchingRef.current[monthKey];
        setLoading(false);
        setError({ from: 'bill', error, retryData: { month: monthKey } }); // Set error state
        throw error; // Ensure the error is propagated
      });

    // Store the promise to prevent duplicate requests
    fetchingRef.current[monthKey] = fetchPromise;

    return fetchPromise;
  };

  const fetchElectricBill = useCallback(async (month: string) => getElectricBill(month, false), []);

  // Retry function specifically for electric bills
  const retryElectricBill = useCallback(async (month: string) => {
    return getElectricBill(month, true); // Force refresh on retry
  }, []);

  // Clear cache function for manual cache invalidation
  const clearBillCache = useCallback(() => {
    billCacheRef.current = {};
    fetchingRef.current = {};
    setError(null);
    setLoading(false);
  }, []);

  const saveBills = useCallback(async (bills: ElectricBill[]): Promise<void> => {
    // Placeholder for saving bills logic
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (isSettingsLoadedRef.current) return;
    isSettingsLoadedRef.current = true;
    fetchSettings();
  }, [fetchSettings, enabled]);

  return {
    settings,
    loading,
    error,
    retrySettings,
    fetchElectricBill,
    retryElectricBill,
    clearBillCache,
  } as const;
};
