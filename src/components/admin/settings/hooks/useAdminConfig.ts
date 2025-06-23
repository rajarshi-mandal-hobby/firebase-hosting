// Real-time admin configuration hook following Firebase best practices
import { useState, useEffect, useCallback } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { notifications } from "@mantine/notifications";
import { db } from "../../../../lib/firebase";
import {
  initializeAdminConfig,
  updateAdminConfig,
} from "../../../../lib/config";
import type { AdminConfig } from "../types/config";

export interface UseAdminConfigReturn {
  adminConfig: AdminConfig | null;
  loading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<AdminConfig>) => Promise<void>;
  addAdmin: (uid: string) => Promise<void>;
  removeAdmin: (uid: string) => Promise<void>;
}

/**
 * Hook for managing admin configuration with real-time updates
 * Follows Firebase best practices with onSnapshot
 */
export const useAdminConfig = (): UseAdminConfigReturn => {
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupListener = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize admin config if it doesn't exist
        await initializeAdminConfig();

        // Set up real-time listener
        const adminDocRef = doc(db, "config", "adminSettings");
        unsubscribe = onSnapshot(
          adminDocRef,
          (docSnap) => {
            try {
              if (docSnap.exists()) {
                const configData = docSnap.data() as AdminConfig;
                setAdminConfig(configData);
              } else {
                setAdminConfig(null);
              }
              setError(null);
            } catch (err) {
              const errorMessage =
                err instanceof Error
                  ? err.message
                  : "Failed to process admin configuration";
              setError(errorMessage);
              console.error("Admin config processing error:", err);
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            const errorMessage =
              err instanceof Error
                ? err.message
                : "Failed to fetch admin configuration";
            setError(errorMessage);
            setLoading(false);
            notifications.show({
              title: "Admin Configuration Error",
              message: errorMessage,
              color: "red",
            });
          },
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to initialize admin configuration";
        setError(errorMessage);
        setLoading(false);
        notifications.show({
          title: "Initialization Error",
          message: errorMessage,
          color: "red",
        });
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Update admin configuration
  const updateConfig = useCallback(async (newConfig: Partial<AdminConfig>) => {
    try {
      await updateAdminConfig(newConfig);
      notifications.show({
        title: "Success",
        message: "Admin configuration updated successfully",
        color: "green",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update admin configuration";
      notifications.show({
        title: "Update Failed",
        message: errorMessage,
        color: "red",
      });
      throw err;
    }
  }, []);

  // Add admin UID
  const addAdmin = useCallback(
    async (uid: string) => {
      if (!adminConfig) return;

      const updatedList = [...(adminConfig.list || [])];
      if (!updatedList.includes(uid)) {
        updatedList.push(uid);
        await updateConfig({ list: updatedList });
      }
    },
    [adminConfig, updateConfig],
  );

  // Remove admin UID
  const removeAdmin = useCallback(
    async (uid: string) => {
      if (!adminConfig) return;

      const updatedList = (adminConfig.list || []).filter((id) => id !== uid);
      await updateConfig({ list: updatedList });
    },
    [adminConfig, updateConfig],
  );

  return {
    adminConfig,
    loading,
    error,
    updateConfig,
    addAdmin,
    removeAdmin,
  };
};
