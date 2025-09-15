import { useCallback, useState, useEffect, useRef } from 'react';
import type { GlobalSettings, GlobalSettingsFormValues } from '../../../../data/shemas/GlobalSettings';
import type { SaveResult, ValidationError } from '../../../../data/shemas/formResults';
import { getConfigDb, saveGlobalSettings } from '../../../../data/services/configService';
import type { FirestoreError } from 'firebase/firestore';

export const useConfig = () => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);

  const hasLoadedRef = useRef(false);

  const _getSettingDb = (refresh: boolean) =>
    getConfigDb(refresh)
      .then((settings) => {
        setGlobalSettings(settings);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });

  const loadSettings = useCallback((refresh = false) => {
    setLoading(true);
    setError(null);
    _getSettingDb(refresh);
  }, []);

  const handleSaveSettings = useCallback(async (updates: GlobalSettingsFormValues): Promise<SaveResult> => {
    setError(null);
    setLoading(true);

    try {
      const result = await saveGlobalSettings(updates);
      if (result.success) {
        _getSettingDb(true); // Refresh settings after successful save
        return result;
      } else {
        return result; // Return the error result to the caller
      }
    } catch (error) {
      const err = error as Error | FirestoreError | any;
      return {
        success: false,
        errors: {
          formErrors: [`${err.name}: ${err.message} Please try again later.`],
          fieldErrors: {},
        } as ValidationError,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-load settings when hook is first used (only once)
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadSettings();
  });

  return {
    globalSettings,
    loading,
    error,
    handleRefresh: () => loadSettings(true),
    handleSaveSettings,
  } as const;
};
