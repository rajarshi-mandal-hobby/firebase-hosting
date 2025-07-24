/**
 * useMemberDashboard Hook
 *
 * Custom hook for member dashboard operations including:
 * - Member dashboard data fetching
 * - Member rent history with pagination
 * - Other active members (friends directory)
 * - FCM token management
 * - Real-time dashboard listeners setup
 *
 * Extracted from AppContext as part of the refactoring to improve code organization.
 * Follows React patterns guidelines with proper error handling and loading states.
 *
 * Requirements: 3.4, 3.7, 5.1, 5.2, 8.1, 8.4
 */

import { useState, useCallback, useMemo } from 'react';
import { notifications } from '@mantine/notifications';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { RealtimeService } from '../services';
import type { Member, RentHistory } from '../../shared/types/firestore-types';
import type { BaseHookReturn } from './types';
import { HOOK_OPERATIONS, SUCCESS_MESSAGES, ERROR_NOTIFICATION, SUCCESS_NOTIFICATION } from './constants';

/**
 * Member dashboard state interface
 */
export interface MemberDashboardState {
  member: Member | null;
  currentMonth: RentHistory | null;
  rentHistory: RentHistory[];
  hasMoreHistory: boolean;
  nextHistoryCursor?: string;
  otherMembers: Array<{
    id: string;
    name: string;
    phone: string;
    floor: string;
    bedType: string;
  }>;
}

/**
 * Loading states for different member dashboard operations
 */
export interface MemberDashboardLoadingState {
  dashboard: boolean;
  history: boolean;
  otherMembers: boolean;
  fcmToken: boolean;
}

/**
 * Error states for different member dashboard operations
 */
export interface MemberDashboardErrorState {
  dashboard: string | null;
  history: string | null;
  otherMembers: string | null;
  fcmToken: string | null;
}

/**
 * Return type for useMemberDashboard hook
 */
export interface UseMemberDashboardReturn extends BaseHookReturn {
  // Data
  dashboardData: MemberDashboardState;

  // Operations
  getMemberDashboard: () => Promise<void>;
  getMemberRentHistory: (limit?: number, startAfter?: string) => Promise<void>;
  getOtherActiveMembers: () => Promise<void>;
  updateFCMToken: (fcmToken: string) => Promise<void>;

  // Real-time Setup
  setupMemberDashboardListeners: (memberId: string) => () => void;

  // Loading States
  loading: MemberDashboardLoadingState;

  // Error States
  errors: MemberDashboardErrorState;

  // Utilities
  clearError: (errorType?: keyof MemberDashboardErrorState) => void;
  clearAllErrors: () => void;
}

/**
 * Custom hook for member dashboard operations
 *
 * Provides member dashboard functionality with proper loading states and error handling.
 * Follows React best practices with memoized callbacks and proper error handling.
 */
export function useMemberDashboard(): UseMemberDashboardReturn {
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState<MemberDashboardState>({
    member: null,
    currentMonth: null,
    rentHistory: [],
    hasMoreHistory: false,
    nextHistoryCursor: undefined,
    otherMembers: [],
  });

  // Loading states for different operations
  const [loading, setLoading] = useState<MemberDashboardLoadingState>({
    dashboard: false,
    history: false,
    otherMembers: false,
    fcmToken: false,
  });

  // Error states for different operations
  const [errors, setErrors] = useState<MemberDashboardErrorState>({
    dashboard: null,
    history: null,
    otherMembers: null,
    fcmToken: null,
  });

  // Generic error handler with user-friendly messages and notifications
  const handleError = useCallback((error: unknown, operation: string, errorType: keyof MemberDashboardErrorState) => {
    console.error(`${operation} failed:`, error);

    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = `${operation} failed. Please try again.`;
    }

    setErrors((prev) => ({ ...prev, [errorType]: errorMessage }));

    // Show user notification
    notifications.show({
      ...ERROR_NOTIFICATION,
      message: errorMessage,
    });

    return errorMessage;
  }, []);

  // Clear specific error state
  const clearError = useCallback((errorType?: keyof MemberDashboardErrorState) => {
    if (errorType) {
      setErrors((prev) => ({ ...prev, [errorType]: null }));
    } else {
      // If no specific error type, clear the general error (for BaseHookReturn compatibility)
      setErrors((prev) => ({ ...prev, dashboard: null }));
    }
  }, []);

  // Clear all error states
  const clearAllErrors = useCallback(() => {
    setErrors({
      dashboard: null,
      history: null,
      otherMembers: null,
      fcmToken: null,
    });
  }, []);

  // Get member dashboard data operation
  const getMemberDashboard = useCallback(async (): Promise<void> => {
    setErrors((prev) => ({ ...prev, dashboard: null }));
    setLoading((prev) => ({ ...prev, dashboard: true }));

    try {
      const functions = getFunctions();
      const getMemberDashboardFn = httpsCallable(functions, 'getMemberDashboard');

      const result = await getMemberDashboardFn();
      console.log('getMemberDashboard result:', result.data);
      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          member: Member;
          currentMonth?: RentHistory;
          globalSettings: {
            upiVpa?: string;
            payeeName?: string;
          };
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch member dashboard');
      }

      setDashboardData((prev) => ({
        ...prev,
        member: response.data.member,
        currentMonth: response.data.currentMonth || null,
      }));

      notifications.show({
        ...SUCCESS_NOTIFICATION,
        message: 'Dashboard data loaded successfully',
      });
    } catch (error) {
      handleError(error, HOOK_OPERATIONS.GET_MEMBER_DASHBOARD, 'dashboard');
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  }, [handleError]);

  // Get member rent history with pagination
  const getMemberRentHistory = useCallback(
    async (limit: number = 12, startAfter?: string): Promise<void> => {
      setErrors((prev) => ({ ...prev, history: null }));
      setLoading((prev) => ({ ...prev, history: true }));

      try {
        const functions = getFunctions();
        const getMyRentHistoryFn = httpsCallable(functions, 'getMyRentHistory');

        const result = await getMyRentHistoryFn({
          limit,
          startAfter,
        });

        const response = result.data as {
          success: boolean;
          message: string;
          data: {
            rentHistory: RentHistory[];
            hasMore: boolean;
            nextCursor?: string;
          };
        };

        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch rent history');
        }

        setDashboardData((prev) => ({
          ...prev,
          rentHistory: startAfter ? [...prev.rentHistory, ...response.data.rentHistory] : response.data.rentHistory,
          hasMoreHistory: response.data.hasMore,
          nextHistoryCursor: response.data.nextCursor,
        }));

        if (!startAfter) {
          notifications.show({
            ...SUCCESS_NOTIFICATION,
            message: 'Rent history loaded successfully',
          });
        }
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.GET_RENT_HISTORY, 'history');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, history: false }));
      }
    },
    [handleError]
  );

  // Get other active members for friends directory
  const getOtherActiveMembers = useCallback(async (): Promise<void> => {
    setErrors((prev) => ({ ...prev, otherMembers: null }));
    setLoading((prev) => ({ ...prev, otherMembers: true }));

    try {
      const functions = getFunctions();
      const getOtherActiveMembersFn = httpsCallable(functions, 'getOtherActiveMembers');

      const result = await getOtherActiveMembersFn();
      const response = result.data as {
        success: boolean;
        message: string;
        data: {
          members: Array<{
            id: string;
            name: string;
            phone: string;
            floor: string;
            bedType: string;
          }>;
        };
      };

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch other members');
      }

      setDashboardData((prev) => ({
        ...prev,
        otherMembers: response.data.members,
      }));

      notifications.show({
        ...SUCCESS_NOTIFICATION,
        message: 'Friends list loaded successfully',
      });
    } catch (error) {
      handleError(error, HOOK_OPERATIONS.GET_OTHER_MEMBERS, 'otherMembers');
      throw error;
    } finally {
      setLoading((prev) => ({ ...prev, otherMembers: false }));
    }
  }, [handleError]);

  // Update FCM token for push notifications
  const updateFCMToken = useCallback(
    async (fcmToken: string): Promise<void> => {
      setErrors((prev) => ({ ...prev, fcmToken: null }));
      setLoading((prev) => ({ ...prev, fcmToken: true }));

      try {
        const functions = getFunctions();
        const updateFCMTokenFn = httpsCallable(functions, 'updateFCMToken');

        const result = await updateFCMTokenFn({ fcmToken });
        const response = result.data as {
          success: boolean;
          message: string;
        };

        if (!response.success) {
          throw new Error(response.message || 'Failed to update FCM token');
        }

        notifications.show({
          ...SUCCESS_NOTIFICATION,
          message: SUCCESS_MESSAGES.PAYMENT_SETTINGS_UPDATED,
        });
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.UPDATE_FCM_TOKEN, 'fcmToken');
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, fcmToken: false }));
      }
    },
    [handleError]
  );

  // Setup real-time listeners for member dashboard
  const setupMemberDashboardListeners = useCallback((memberId: string) => {
    let memberHistoryUnsubscribe: (() => void) | null = null;

    try {
      // Subscribe to member's rent history for real-time updates
      memberHistoryUnsubscribe = RealtimeService.subscribeToMemberRentHistory(
        memberId,
        (rentHistory: RentHistory[]) => {
          setDashboardData((prev) => ({
            ...prev,
            rentHistory: rentHistory.slice(1, 13), // Exclude current month, limit to 12 months
            currentMonth: rentHistory.length > 0 ? rentHistory[0] : null, // Most recent is current month
          }));
          setLoading((prev) => ({ ...prev, history: false }));
          setErrors((prev) => ({ ...prev, history: null }));
        }
      );
    } catch (error) {
      console.error('Failed to setup member dashboard listeners:', error);
      setErrors((prev) => ({
        ...prev,
        history: 'Failed to connect to rent history data',
      }));
    }

    // Return cleanup function
    return () => {
      if (memberHistoryUnsubscribe) {
        memberHistoryUnsubscribe();
      }
    };
  }, []);

  // Computed error state for BaseHookReturn compatibility
  const generalError = useMemo(() => {
    return errors.dashboard || errors.history || errors.otherMembers || errors.fcmToken;
  }, [errors]);

  // Computed loading state for BaseHookReturn compatibility
  const generalLoading = useMemo(() => {
    return loading.dashboard || loading.history || loading.otherMembers || loading.fcmToken;
  }, [loading]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Data
      dashboardData,

      // Operations
      getMemberDashboard,
      getMemberRentHistory,
      getOtherActiveMembers,
      updateFCMToken,

      // Real-time Setup
      setupMemberDashboardListeners,

      // Loading States
      loading,

      // Error States
      errors,

      // BaseHookReturn compatibility
      isLoading: generalLoading,
      error: generalError,

      // Utilities
      clearError,
      clearAllErrors,
    }),
    [
      dashboardData,
      getMemberDashboard,
      getMemberRentHistory,
      getOtherActiveMembers,
      updateFCMToken,
      setupMemberDashboardListeners,
      loading,
      errors,
      generalLoading,
      generalError,
      clearError,
      clearAllErrors,
    ]
  );
}

// Set displayName for debugging
useMemberDashboard.displayName = 'useMemberDashboard';
