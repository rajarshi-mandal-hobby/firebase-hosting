import { useCallback, useEffect, useRef, useState } from 'react';
import { GlobalSettings } from '../../../../../data/shemas/GlobalSettings';
import { getConfigDb } from '../../../../../data/services/configService';
import { fetchElectricBillByMonth } from '../../../../../data/services/electricService';

export const useGenerateBills = () => {
  const [settings, setSettings] = useState<GlobalSettings | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const isSettingsLoadedRef = useRef(settings !== undefined);

  const getSettings = (refresh = false) => {
    setLoading(true);
    setError(null);
    getConfigDb(refresh)
      .then((settings) => {
        setSettings(settings);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getElectricBill = (month: string, refresh = false) => {
    month = month.slice(0, 7); // Ensure format is YYYY-MM
    return fetchElectricBillByMonth(month, refresh);
  };

  const fetchSettings = useCallback(() => getSettings(false), []);
  const refreshSettings = useCallback(() => getSettings(true), []);

  const fetchElectricBill = useCallback((month: string) => getElectricBill(month), []);
  const refreshElectricBill = useCallback((month: string) => getElectricBill(month, true), []);

  useEffect(() => {
    if (isSettingsLoadedRef.current) return;
    isSettingsLoadedRef.current = true;
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    refreshSettings,
    fetchElectricBill,
    refreshElectricBill,
  } as const;
};
