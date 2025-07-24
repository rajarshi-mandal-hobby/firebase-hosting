/**
 * useMemberOperations Hook
 *
 * Custom hook for member CRUD operations with proper error handling and loading states.
 * Extracted from AppContext as part of the refactoring to improve code organization.
 *
 * Requirements: 3.1, 3.7, 5.1, 5.2, 5.3, 8.1, 8.4
 */

import { useState, useCallback, useMemo } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { MembersService } from '../services';
import { notifications } from '@mantine/notifications';
import type {
  Member,
  AddMemberFormData,
  EditMemberFormData,
  SettlementPreview,
} from '../../shared/types/firestore-types';
import type { BaseHookReturn } from './types';
import { HOOK_OPERATIONS, SUCCESS_MESSAGES } from './constants';
import {
  useEnhancedErrorHandler,
  showProgressNotification,
  updateNotification,
  retryWithBackoff,
  useNetworkStatus,
} from './utils';

/**
 * Return type for useMemberOperations hook
 */
export interface UseMemberOperationsReturn extends BaseHookReturn {
  // Operations
  addMember: (data: AddMemberFormData) => Promise<void>;
  updateMember: (id: string, updates: EditMemberFormData) => Promise<void>;
  deactivateMember: (id: string, leaveDate: Date) => Promise<SettlementPreview>;
  deleteMember: (id: string) => Promise<void>;
  fetchInactiveMembers: () => Promise<Member[]>;

  // State
  isLoading: boolean;
  error: string | null;

  // Utilities
  clearError: () => void;
}

/**
 * Custom hook for member operations
 *
 * Provides member CRUD operations with proper loading states and error handling.
 * Follows React best practices with memoized callbacks and proper error handling.
 */
export function useMemberOperations(): UseMemberOperationsReturn {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced error handler with network awareness
  const handleError = useEnhancedErrorHandler();
  const isOnline = useNetworkStatus();

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Enhanced add member operation with retry and progress notifications
  const addMember = useCallback(
    async (memberData: AddMemberFormData): Promise<void> => {
      setError(null);
      setIsLoading(true);

      // Show progress notification
      const progressId = showProgressNotification(`Adding member ${memberData.name}...`, 'Processing');

      try {
        // Use retry mechanism for network resilience
        await retryWithBackoff(
          () =>
            MembersService.addMember({
              name: memberData.name,
              phone: memberData.phone,
              floor: memberData.floor,
              bedType: memberData.bedType,
              rentAmount: memberData.rentAtJoining,
              securityDeposit: memberData.securityDeposit,
              advanceDeposit: memberData.advanceDeposit,
              optedForWifi: memberData.fullPayment,
              moveInDate: memberData.moveInDate,
            }),
          {
            maxRetries: isOnline ? 3 : 1,
            shouldRetry: (error: any) => {
              // Retry on network errors but not validation errors
              return !error.message?.includes('validation') && !error.message?.includes('permission');
            },
          }
        );

        // Update to success notification
        updateNotification(progressId, true, `Member ${memberData.name} added successfully`);
      } catch (error) {
        // Update to error notification
        updateNotification(
          progressId,
          false,
          handleError(error, HOOK_OPERATIONS.ADD_MEMBER, { showNotification: false })
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Update member operation
  const updateMember = useCallback(
    async (memberId: string, updates: EditMemberFormData): Promise<void> => {
      setError(null);
      setIsLoading(true);

      try {
        await MembersService.updateMember(memberId, {
          floor: updates.floor,
          bedType: updates.bedType,
          currentRent: updates.currentRent,
        });

        notifications.show({
          title: 'Success',
          message: SUCCESS_MESSAGES.MEMBER_UPDATED,
          color: 'green',
          position: 'bottom-center',
        });
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.UPDATE_MEMBER);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Deactivate member operation (calls Cloud Function)
  const deactivateMember = useCallback(
    async (memberId: string, leaveDate: Date): Promise<SettlementPreview> => {
      setError(null);
      setIsLoading(true);

      try {
        // Call the Cloud Function for member deactivation
        const functions = getFunctions();
        const deactivateMemberFn = httpsCallable(functions, 'deactivateMember');

        const result = await deactivateMemberFn({
          memberId,
          leaveDate: leaveDate.toISOString(),
        });

        const response = result.data as {
          success: boolean;
          message: string;
          data: {
            settlement: SettlementPreview;
          };
        };

        if (!response.success) {
          throw new Error(response.message || 'Failed to deactivate member');
        }

        notifications.show({
          title: 'Success',
          message: SUCCESS_MESSAGES.MEMBER_DEACTIVATED,
          color: 'green',
          position: 'bottom-center',
        });

        return response.data.settlement;
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.DEACTIVATE_MEMBER);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Delete member operation
  const deleteMember = useCallback(
    async (memberId: string): Promise<void> => {
      setError(null);
      setIsLoading(true);

      try {
        await MembersService.deleteMember(memberId);

        notifications.show({
          title: 'Success',
          message: SUCCESS_MESSAGES.MEMBER_DELETED,
          color: 'green',
          position: 'bottom-center',
        });
      } catch (error) {
        handleError(error, HOOK_OPERATIONS.DELETE_MEMBER);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError]
  );

  // Fetch inactive members operation
  const fetchInactiveMembers = useCallback(async (): Promise<Member[]> => {
    setError(null);
    setIsLoading(true);

    try {
      const inactiveMembers = await MembersService.getMembers({ isActive: false });
      return inactiveMembers;
    } catch (error) {
      handleError(error, HOOK_OPERATIONS.FETCH_INACTIVE_MEMBERS);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Operations
      addMember,
      updateMember,
      deactivateMember,
      deleteMember,
      fetchInactiveMembers,

      // State
      isLoading,
      error,

      // Utilities
      clearError,
    }),
    [addMember, updateMember, deactivateMember, deleteMember, fetchInactiveMembers, isLoading, error, clearError]
  );
}

// Add displayName for debugging
useMemberOperations.displayName = 'useMemberOperations';
