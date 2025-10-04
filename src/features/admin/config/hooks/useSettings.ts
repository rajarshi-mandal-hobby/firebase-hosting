import { useState, useRef, useEffect } from 'react';
import { fetchGlobalSettings } from '../../../../data/services/configService';
import type { GlobalSettings } from '../../../../data/shemas/GlobalSettings';
import { set } from 'zod/v3';

export const useSettings = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    console.log('useSettings effect triggered, refreshKey:', refreshKey, 'refresh:', refresh);
    const fetchSettings = async () => {
      console.log('Fetching settings...');
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGlobalSettings(refresh);
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch settings'));
      } finally {
        setLoading(false);
        if (refresh) {
          setRefresh(false);
        }
      }
    };
    fetchSettings();
  }, [refreshKey, refresh]);

  const handleRetry = () => {
    setRefreshKey((prev) => prev + 1);
    if (refreshKey > 3) {
      setRefreshKey(0); // Reset after 3 retries to avoid infinite loop
      setRefresh(true); // Force refresh from server
    }
  };

  const handleRefresh = () => {
    setRefresh(true);
    return settings;
  };

  return { settings, loading, error, refreshKey, actions: { handleRefresh, handleRetry } };
};
