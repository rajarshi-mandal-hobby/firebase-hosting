/**
 * ✅ SIMPLE: React-compliant useMemberDashboard Hook
 *
 * Following React rules without over-optimization:
 * - https://react.dev/reference/rules
 * - https://react.dev/learn/reusing-logic-with-custom-hooks
 * - https://react.dev/learn/manipulating-the-dom-with-refs
 */

import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import type { Member, RentHistory } from '../../shared/types/firestore-types';
import {
  getMemberDashboard as getMemberDashboardService,
  getMemberRentHistory as getMemberRentHistoryService,
  getOtherActiveMembers as getOtherActiveMembersService,
} from './services/firebaseMemberDashboardService';

/**
 * Simple member dashboard state interface
 */
export interface MemberDashboardState {
  member: Member | null;
  currentMonth: RentHistory | null;
  rentHistory: RentHistory[];
  hasMoreHistory: boolean;
  nextHistoryCursor?: string;
  otherMembers: SimplifiedMember[];
  upi: {
    upiVpa: string;
    payeeName: string;
  };
}

export interface SimplifiedMember {
  id: string;
  name: string;
  phone: string;
  floor: string;
  bedType: string;
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
 * Hook return interface
 */
export interface UseMemberDashboardReturn {
  // Data
  dashboardData: MemberDashboardState;
  loading: MemberDashboardLoadingState;
  errors: MemberDashboardErrorState;

  // Operations
  getMemberDashboard: () => Promise<void>;
  getMemberRentHistory: (limit?: number, startAfter?: string) => Promise<void>;
  getOtherActiveMembers: () => Promise<void>;
  updateFCMToken: (fcmToken: string) => Promise<void>;

  // Real-time Setup
  setupMemberDashboardListeners: (memberId: string) => () => void;

  // Utilities
  clearError: (errorType?: keyof MemberDashboardErrorState) => void;
  clearAllErrors: () => void;

  // Computed states
  isLoading: boolean;
  error: string | null;
}

/**
 * ✅ SIMPLE: React-compliant member dashboard hook
 *
 * Follows React rules without over-optimization:
 * - Simple state management with useState
 * - useCallback for stable function references only where needed
 * - No unnecessary memoization of the return object
 * - Custom hook for reusing logic between components
 */
export function useMemberDashboard(options?: {
  initialMemberData?: Member;
  autoLoad?: boolean;
  memberId?: string;
}): UseMemberDashboardReturn {
  const { initialMemberData, autoLoad = true, memberId } = options || {};

  // ✅ Simple state initialization
  const [dashboardData, setDashboardData] = useState<MemberDashboardState>(() => ({
    member: initialMemberData || null,
    currentMonth: null,
    rentHistory: [],
    hasMoreHistory: false,
    nextHistoryCursor: undefined,
    otherMembers: [],
    upi: { upiVpa: '', payeeName: '' },
  }));

  const [loading, setLoading] = useState<MemberDashboardLoadingState>({
    dashboard: false,
    history: false,
    otherMembers: false,
    fcmToken: false,
  });

  const [errors, setErrors] = useState<MemberDashboardErrorState>({
    dashboard: null,
    history: null,
    otherMembers: null,
    fcmToken: null,
  });

  // ✅ Standard React pattern: useCallback for stable references
  const getMemberDashboard = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, dashboard: true }));
      setErrors((prev) => ({ ...prev, dashboard: null }));

      // Pass memberId only if explicitly provided (for admin use)
      // For regular member use, Firebase Functions will use authenticated user
      const result = await getMemberDashboardService(memberId);

      setDashboardData((prev) => ({
        ...prev,
        member: result.member,
        currentMonth: result.currentMonth || null,
        upi: {
          upiVpa: result.upi.upiVpa || '',
          payeeName: result.upi.payeeName || 'Admin',
        },
      }));

      notifications.show({
        title: 'Dashboard Updated',
        message: 'Your data has been refreshed',
        position: 'bottom-center',
        color: 'green',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
      setErrors((prev) => ({ ...prev, dashboard: errorMessage }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        position: 'bottom-center',
      });
    } finally {
      setLoading((prev) => ({ ...prev, dashboard: false }));
    }
  }, [memberId]);

  const getMemberRentHistory = useCallback(
    async (limit = 12, startAfter?: string) => {
      try {
        setLoading((prev) => ({ ...prev, history: true }));
        setErrors((prev) => ({ ...prev, history: null }));

        // Pass parameters in the correct order: limit, startAfter, memberId
        const result = await getMemberRentHistoryService(limit, startAfter, memberId);

        setDashboardData((prev) => ({
          ...prev,
          rentHistory: startAfter ? [...prev.rentHistory, ...result.rentHistory] : result.rentHistory,
          hasMoreHistory: result.hasMore,
          nextHistoryCursor: result.nextCursor,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
        setErrors((prev) => ({ ...prev, history: errorMessage }));
      } finally {
        setLoading((prev) => ({ ...prev, history: false }));
      }
    },
    [memberId]
  );

  const getOtherActiveMembers = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, otherMembers: true }));
      setErrors((prev) => ({ ...prev, otherMembers: null }));

      const result = await getOtherActiveMembersService();

      // Convert Members to SimplifiedMembers
      const simplifiedMembers: SimplifiedMember[] = result.map((member) => ({
        id: member.id,
        name: member.name,
        phone: member.phone,
        floor: member.floor,
        bedType: member.bedType,
      }));

      setDashboardData((prev) => ({
        ...prev,
        otherMembers: simplifiedMembers,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load other members';
      setErrors((prev) => ({ ...prev, otherMembers: errorMessage }));
    } finally {
      setLoading((prev) => ({ ...prev, otherMembers: false }));
    }
  }, []);

  const updateFCMToken = useCallback(async (fcmToken: string) => {
    try {
      setLoading((prev) => ({ ...prev, fcmToken: true }));
      setErrors((prev) => ({ ...prev, fcmToken: null }));

      // TODO: Implement FCM token update when Firebase Functions support it

      // Update local state
      setDashboardData((prev) => ({
        ...prev,
        fcmToken,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update FCM token';
      setErrors((prev) => ({ ...prev, fcmToken: errorMessage }));
    } finally {
      setLoading((prev) => ({ ...prev, fcmToken: false }));
    }
  }, []);

  const setupMemberDashboardListeners = useCallback((_acMemberId: string) => {
    // Real-time listeners will be implemented here
    // For now, return cleanup function
    return () => {};
  }, []);

  const clearError = useCallback((errorType?: keyof MemberDashboardErrorState) => {
    if (errorType) {
      setErrors((prev) => ({ ...prev, [errorType]: null }));
    } else {
      setErrors({
        dashboard: null,
        history: null,
        otherMembers: null,
        fcmToken: null,
      });
    }
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({
      dashboard: null,
      history: null,
      otherMembers: null,
      fcmToken: null,
    });
  }, []);

  // ✅ Simple auto-load effect
  useEffect(() => {
    if (autoLoad && dashboardData && !dashboardData.member) {
      getMemberDashboard();
    }
  }, [autoLoad, dashboardData, getMemberDashboard]);

  // ✅ SIMPLE RETURN: No unnecessary memoization
  // React will handle object identity efficiently
  return {
    dashboardData,
    loading,
    errors,
    getMemberDashboard,
    getMemberRentHistory,
    getOtherActiveMembers,
    updateFCMToken,
    setupMemberDashboardListeners,
    clearError,
    clearAllErrors,
    isLoading: Object.values(loading).some(Boolean),
    error: Object.values(errors).find(Boolean) || null,
  };
}

// Set displayName for debugging
useMemberDashboard.displayName = 'useMemberDashboard';
