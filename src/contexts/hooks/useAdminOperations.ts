/**
 * useAdminOperations Hook
 *
 * Custom hook for admin management functionality including:
 * - Global settings management
 * - Admin user management (add, remove, update roles)
 * - System configuration operations
 *
 * Extracted from AppContext as part of the refactoring to improve code organization.
 * Follows React patterns guidelines with proper error handling and loading states.
 *
 * Requirements: 3.3, 3.7, 5.1, 5.2, 8.1, 8.4
 */

import { useState, useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { ConfigService } from '../services';
import type { GlobalSettings, Admin } from '../../shared/types/firestore-types';
import type { BaseHookReturn } from './types';
import { HOOK_OPERATIONS, SUCCESS_MESSAGES, ERROR_NOTIFICATION, SUCCESS_NOTIFICATION } from './constants';

/**
 * Return type for useAdminOperations hook
 */
export interface UseAdminOperationsReturn extends BaseHookReturn {
  // Operations
  updateGlobalSettings: (settings: Partial<GlobalSettings>) => Promise<void>;
  addAdmin: (email: string, addedBy: string) => Promise<Admin>;
  removeAdmin: (adminUid: string, removedBy: string) => Promise<void>;
  updateAdminRole: (adminUid: string, newRole: 'primary' | 'secondary', updatedBy: string) => Promise<Admin>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}

/**
 * Custom hook for admin operations
 *
 * Provides admin management functionality with proper loading states and error handling.
 * Follows React best practices with memoized callbacks and proper error handling.
 */
export function useAdminOperations(): UseAdminOperationsReturn {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Error handler with user-friendly messages and notifications
  const handleError = useCallback((error: unknown, operation: string) => {
    console.error(`${operation} failed:`, error);

    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = `${operation} failed. Please try again.`;
    }

    setError(errorMessage);

    // Show user notification
    notifications.show({
      ...ERROR_NOTIFICATION,
      message: errorMessage,
    });

    return errorMessage;
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update global settings operation
  const updateGlobalSettings = useCallback(
    async (settings: Partial<GlobalSettings>): Promise<void> => {
      setError(null);
      setIsLoading(true);

      try {
        await ConfigService.updateGlobalSettings(settings);

        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: SUCCESS_MESSAGES.SETTINGS_UPDATED,
        });
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.UPDATE_SETTINGS);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Add admin operation
  const addAdmin = useCallback(
    async (email: string, addedBy: string): Promise<Admin> => {
      setError(null);
      setIsLoading(true);

      try {
        const newAdmin = await ConfigService.addAdmin(email, addedBy);

        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: `Admin ${email} added successfully`,
        });

        return newAdmin;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.MANAGE_ADMINS);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Remove admin operation
  const removeAdmin = useCallback(
    async (adminUid: string, removedBy: string): Promise<void> => {
      setError(null);
      setIsLoading(true);

      try {
        await ConfigService.removeAdmin(adminUid, removedBy);

        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: 'Admin removed successfully',
        });
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.MANAGE_ADMINS);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Update admin role operation
  const updateAdminRole = useCallback(
    async (adminUid: string, newRole: 'primary' | 'secondary', updatedBy: string): Promise<Admin> => {
      setError(null);
      setIsLoading(true);

      try {
        const updatedAdmin = await ConfigService.updateAdminRole(adminUid, newRole, updatedBy);

        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: `Admin role updated to ${newRole}`,
        });

        return updatedAdmin;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.MANAGE_ADMINS);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Operations
      updateGlobalSettings,
      addAdmin,
      removeAdmin,
      updateAdminRole,

      // State
      isLoading,
      error,

      // Utilities
      clearError,
    }),
    [updateGlobalSettings, addAdmin, removeAdmin, updateAdminRole, isLoading, error, clearError]
  );
}

// Set displayName for debugging
useAdminOperations.displayName = 'useAdminOperations';
