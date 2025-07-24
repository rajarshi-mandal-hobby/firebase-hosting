/**
 * useAuth Hook
 *
 * Custom hook for authentication and account linking operations.
 * Extracted from AppContext as part of the refactoring to improve code organization.
 *
 * Requirements: 3.5, 3.7, 5.1, 5.2, 8.1, 8.4
 */

import { useState, useCallback, useMemo } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { AuthService } from '../services';
import { notifications } from '@mantine/notifications';
import type { Member } from '../../shared/types/firestore-types';
import type { BaseHookReturn } from './types';
import { HOOK_OPERATIONS, SUCCESS_MESSAGES, ERROR_NOTIFICATION, SUCCESS_NOTIFICATION } from './constants';

/**
 * Authentication result interface
 */
export interface AuthResult {
  uid: string;
  role: 'admin' | 'member' | 'unlinked';
  userData?: any;
}

/**
 * Return type for useAuth hook
 */
export interface UseAuthReturn extends BaseHookReturn {
  // Operations
  linkMemberAccount: (phoneNumber: string) => Promise<Member>;
  verifyAuth: (token: string) => Promise<AuthResult>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}

/**
 * Custom hook for authentication operations
 *
 * Provides authentication and account linking operations with proper loading states
 * and error handling. Follows React best practices with memoized callbacks.
 */
export function useAuth(): UseAuthReturn {
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

  // Link member account operation
  const linkMemberAccount = useCallback(
    async (phoneNumber: string): Promise<Member> => {
      setError(null);
      setIsLoading(true);

      try {
        // Validate phone number format
        if (!phoneNumber || phoneNumber.trim().length === 0) {
          throw new Error('Phone number is required');
        }

        // Call the Cloud Function for account linking
        const functions = getFunctions();
        const linkMemberAccountFn = httpsCallable(functions, 'linkMemberAccount');

        const result = await linkMemberAccountFn({ phoneNumber: phoneNumber.trim() });
        const response = result.data as {
          success: boolean;
          message: string;
          data: {
            success: boolean;
            member: Member;
          };
        };

        if (!response.success) {
          throw new Error(response.message || 'Failed to link member account');
        }

        // Show success notification
        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: SUCCESS_MESSAGES.ACCOUNT_LINKED,
        });

        return response.data.member;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.LINK_ACCOUNT);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Verify authentication operation
  const verifyAuth = useCallback(
    async (token: string): Promise<AuthResult> => {
      setError(null);
      setIsLoading(true);

      try {
        // Validate token
        if (!token || token.trim().length === 0) {
          throw new Error('Authentication token is required');
        }

        // Call the AuthService to verify the token
        const authResult = await AuthService.verifyAuth(token.trim());

        // Show success notification
        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: SUCCESS_MESSAGES.AUTH_VERIFIED,
        });

        return authResult;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.VERIFY_AUTH);
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
      linkMemberAccount,
      verifyAuth,

      // State
      isLoading,
      error,

      // Utilities
      clearError,
    }),
    [linkMemberAccount, verifyAuth, isLoading, error, clearError]
  );
}

// Set displayName for debugging
useAuth.displayName = 'useAuth';
