import { useState, useEffect, useRef, useEffectEvent } from 'react';
import { fetchGlobalSettings } from '../../../../data/services/configService';
import type { GlobalSettings } from '../../../../data/shemas/GlobalSettings';

export const useDefaultRents = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [refetch, setRefetch] = useState(false);
  const refetchCountRef = useRef(0);

  const fetchEvent = useEffectEvent(() => {
    const shouldFetch = !settings || refetch;

    if (!shouldFetch || isLoading) {
      return;
    }

    console.log('useSettings effect triggered, refetch:', refetch);
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchGlobalSettings(refetch);
        setSettings(data);
        refetchCountRef.current = 0; // Reset retry count on success
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        refetchCountRef.current++; // Increment retry count on failure
      } finally {
        setIsLoading(false);
        if (refetch) {
          setRefetch(false);
        }
      }
    };

    fetchSettings();
  });

  useEffect(() => {
    fetchEvent();
  }, [refetch]);

  const handleRefresh = () => {
    if (refetchCountRef.current >= 3) {
      throw new Error('Maximum retry attempts reached for fetching settings. Refresh the page to try again.');
    }
    setRefetch(true);
  };

  return { settings, isLoading, error, actions: { handleRefresh } };
};
