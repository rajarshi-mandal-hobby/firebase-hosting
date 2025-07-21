import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import type { Member, RentHistory } from '../../../shared/types/firestore-types';

// Simplified member type for friends list (matches AppContext structure)
export interface SimplifiedMember {
  id: string;
  name: string;
  phone: string;
  floor: string;
  bedType: string;
}

export interface UseMemberDashboardData {
  currentMember: Member | null;
  currentMonthHistory: RentHistory | null;
  otherMembers: SimplifiedMember[];
  historyData: RentHistory[];
  hasMoreHistory: boolean;
  loading: {
    member: boolean;
    friends: boolean;
    history: boolean;
  };
  error: string | null;
  actions: {
    loadHistory: () => void;
    loadMoreHistory: () => void;
    loadFriendsData: () => Promise<void>;
    refreshData: () => void;
  };
  cache: {
    memberLoaded: boolean;
    friendsLoaded: boolean;
    historyLoaded: boolean;
  };
}

/**
 * Custom hook for member dashboard data using AppContext with real-time updates
 * Integrates with AppContext for centralized state management and Firebase Cloud Function calls
 * Provides proper loading states, error handling, and retry mechanisms
 */
export const useMemberDashboardData = (): UseMemberDashboardData => {
  // Get AppContext data and operations
  const {
    memberDashboard,
    loading,
    errors,
    getMemberDashboard,
    getMemberRentHistory,
    getOtherActiveMembers,
    setupMemberDashboardListeners,
  } = useAppContext();

  // Local state for cache flags and error handling
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Load current member data with error handling and retry mechanism
  const loadMemberData = useCallback(async () => {
    if (memberLoaded || loading.memberDashboard) return;

    try {
      setLocalError(null);
      await getMemberDashboard();
      setMemberLoaded(true);
    } catch (err) {
      console.error('Failed to load member dashboard:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load member data';
      setLocalError(errorMessage);
    }
  }, [memberLoaded, loading.memberDashboard, getMemberDashboard]);

  // Load other active members (friends) with error handling
  const loadFriendsData = useCallback(async () => {
    if (friendsLoaded || loading.otherMembers) return;
    console.log('Loading friends data...');
    try {
      setLocalError(null);
      await getOtherActiveMembers();
      setFriendsLoaded(true);
    } catch (err) {
      console.error('Failed to load friends data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load friends data';
      setLocalError(errorMessage);
    }
  }, [friendsLoaded, loading.otherMembers, getOtherActiveMembers]);

  // Load initial history data with proper error handling
  const loadHistory = useCallback(async () => {
    if (historyLoaded || loading.memberHistory) return;

    try {
      setLocalError(null);
      // Load initial batch of history (12 months)
      await getMemberRentHistory(12);
      setHistoryLoaded(true);
    } catch (err) {
      console.error('Failed to load history data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load rent history';
      setLocalError(errorMessage);
    }
  }, [historyLoaded, loading.memberHistory, getMemberRentHistory]);

  // Load more history data with pagination
  const loadMoreHistory = useCallback(async () => {
    if (loading.memberHistory || !memberDashboard.hasMoreHistory || !memberDashboard.nextHistoryCursor) return;

    try {
      setLocalError(null);
      // Load next batch using cursor
      await getMemberRentHistory(12, memberDashboard.nextHistoryCursor);
    } catch (err) {
      console.error('Failed to load more history data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more rent history';
      setLocalError(errorMessage);
    }
  }, [loading.memberHistory, memberDashboard.hasMoreHistory, memberDashboard.nextHistoryCursor, getMemberRentHistory]);

  // Wrapper for loadHistory to handle async properly (for UI button clicks)
  const handleLoadHistory = useCallback(() => {
    void loadHistory();
  }, [loadHistory]);

  // Wrapper for loadMoreHistory to handle async properly (for UI button clicks)
  const handleLoadMoreHistory = useCallback(() => {
    void loadMoreHistory();
  }, [loadMoreHistory]);

  // Auto-load member data when hook is used (essential data - requirement 7.1)
  useEffect(() => {
    void loadMemberData();
  }, [loadMemberData]);

  // // Load friends data on-demand (when explicitly requested)
  // const loadFriendsIfNeeded = useCallback(async () => {
  //   if (!friendsLoaded && !loading.otherMembers) {
  //     await loadFriendsData();
  //   }
  // }, [friendsLoaded, loading.otherMembers, loadFriendsData]);

  // Setup real-time listeners for member dashboard data (requirement 7.3)
  useEffect(() => {
    if (memberDashboard.member?.id) {
      const cleanup = setupMemberDashboardListeners(memberDashboard.member.id);
      return cleanup;
    }
  }, [memberDashboard.member?.id, setupMemberDashboardListeners]);

  // Refresh all data - clears cache and reloads everything (requirement 7.4)
  const refreshData = useCallback(() => {
    setMemberLoaded(false);
    setFriendsLoaded(false);
    setHistoryLoaded(false);
    setLocalError(null);

    // Trigger reload of member data
    void loadMemberData();
  }, [loadMemberData]);

  // Combine errors from AppContext and local errors (requirement 7.5)
  const combinedError = localError || errors.memberDashboard || errors.memberHistory || errors.otherMembers;

  // Process history data to exclude current month (requirement 5.2)
  const processedHistoryData = useMemo(() => {
    if (!memberDashboard.rentHistory.length) return [];

    // If the history includes current month, exclude it from the display
    const currentMonthId = memberDashboard.currentMonth?.id;
    const historyArray = memberDashboard.rentHistory;

    // Filter out current month if it exists in history
    return historyArray.filter((history) => history.id !== currentMonthId);
  }, [memberDashboard.rentHistory, memberDashboard.currentMonth?.id]);

  return {
    currentMember: memberDashboard.member,
    currentMonthHistory: memberDashboard.currentMonth,
    otherMembers: memberDashboard.otherMembers,
    historyData: processedHistoryData,
    hasMoreHistory: memberDashboard.hasMoreHistory,
    loading: {
      member: loading.memberDashboard,
      friends: loading.otherMembers,
      history: loading.memberHistory,
    },
    error: combinedError,
    actions: {
      loadHistory: handleLoadHistory,
      loadMoreHistory: handleLoadMoreHistory,
      loadFriendsData,
      refreshData,
    },
    cache: {
      memberLoaded,
      friendsLoaded,
      historyLoaded,
    },
  };
};
