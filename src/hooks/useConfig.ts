// Custom hooks for managing configuration data
import { useState, useEffect, useCallback } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { db } from "../lib/firebase";
import { getSystemStats } from "../lib/firestore";
import type {
  ConfigData,
  SystemStats,
} from "../components/admin/settings/types/config";

/**
 * Hook for managing system configuration with real-time updates
 */
export const useConfig = () => {
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const configDocRef = doc(db, "config", "globalSettings");
    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        try {
          if (docSnap.exists()) {
            const configData = docSnap.data() as ConfigData;
            setConfig(configData);
          } else {
            // Document doesn't exist - this will be handled by ConfigManagement component
            setConfig(null);
          }
          setError(null);
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to process configuration data";
          setError(errorMessage);
          console.error("Config processing error:", err);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch configuration";
        setError(errorMessage);
        setLoading(false);
        notifications.show({
          title: "Configuration Error",
          message: errorMessage,
          color: "red",
        });
      },
    );

    return () => unsubscribe();
  }, []);

  return {
    config,
    loading,
    error,
  };
};

/**
 * Hook for system statistics
 */
export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statsData = await getSystemStats();
      setStats(statsData);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch system statistics";
      setError(errorMessage);
      console.error("Stats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for rent rates calculation
 */
export const useRentRates = () => {
  const { config } = useConfig();

  const getRentForBedType = useCallback(
    (floor: string, bedType: string): number | null => {
      if (
        !config ||
        !config.bedTypes[floor] ||
        !config.bedTypes[floor][bedType]
      ) {
        return null;
      }
      return config.bedTypes[floor][bedType];
    },
    [config],
  );

  const getAvailableBedTypes = useCallback(
    (floor: string): string[] => {
      if (!config || !config.bedTypes[floor]) {
        return [];
      }
      return Object.keys(config.bedTypes[floor]);
    },
    [config],
  );

  const getAllFloors = useCallback((): string[] => {
    return config?.floors || [];
  }, [config]);

  const getDefaultSecurityDeposit = useCallback((): number => {
    return config?.defaultSecurityDeposit || 1000;
  }, [config]);

  return {
    getRentForBedType,
    getAvailableBedTypes,
    getAllFloors,
    getDefaultSecurityDeposit,
    config,
  };
};
