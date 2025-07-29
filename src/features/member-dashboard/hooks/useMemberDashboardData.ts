import { useState, useCallback, useMemo } from 'react';
import { useAppContext } from '../../../contexts/AppContext';
import type { Member, RentHistory } from '../../../shared/types/firestore-types';
import type { MemberDashboardErrorState, MemberDashboardLoadingState } from '../../../contexts/hooks';
import type { SimplifiedMember } from '../../../contexts/hooks/useMemberDashboard';

export interface UseMemberDashboardData {
  currentMember: Member | null;
  currentMonthHistory: RentHistory | null;
  otherMembers: SimplifiedMember[];
  historyData: RentHistory[];
  hasMoreHistory: boolean;
  upi: any; // Contains vpa and payeeName
  loading: MemberDashboardLoadingState;
  errors: MemberDashboardErrorState;
  actions: {
    loadHistory: () => void;
    loadMoreHistory: () => void;
    loadFriendsData: () => Promise<void>;
    refreshData: () => void;
    retryFriendsData: () => Promise<void>;
    retryHistory: () => Promise<void>;
    retryDashboard: () => Promise<void>;
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
  const { memberDashboardOps } = useAppContext();

  // Extract data constants (SAFE - these are reactive state values)
  const memberDashboard = memberDashboardOps.dashboardData;
  const loading = memberDashboardOps.loading;
  const errors = memberDashboardOps.errors;

  // Local state for cache flags and error handling
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Track when friends data is available or load on demand
  const loadFriendsData = useCallback(async () => {
    console.log('Loading friends data...');
    // Move guard checks inside function to avoid dependencies on changing state
    if (memberDashboard.otherMembers.length > 0 && !friendsLoaded) {
      setFriendsLoaded(true);
      return;
    }

    // If no friends data available and not currently loading, fetch it
    if (memberDashboard.otherMembers.length === 0 && !loading.otherMembers && !friendsLoaded) {
      try {
        await memberDashboardOps.getOtherActiveMembers();
        setFriendsLoaded(true);
      } catch (err) {
        console.error('Failed to load friends data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load friends data';
        setLocalError(errorMessage);
      }
    }
  }, [memberDashboardOps, memberDashboard.otherMembers.length, loading.otherMembers, friendsLoaded]);

  // Track when history data is available or load initial data
  const loadHistory = useCallback(async () => {
    // Move guard checks inside function to avoid dependencies on changing state
    if (memberDashboardOps.dashboardData.rentHistory.length > 0 && !historyLoaded) {
      setHistoryLoaded(true);
      setLocalError(null);
      return;
    }

    // If no history data available and not currently loading, fetch initial batch
    if (memberDashboard.rentHistory.length === 0 && !loading.history && !historyLoaded) {
      try {
        setLocalError(null);
        await memberDashboardOps.getMemberRentHistory(12);
        setHistoryLoaded(true);
      } catch (err) {
        console.error('Failed to load history data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load rent history';
        setLocalError(errorMessage);
      }
    }
  }, [memberDashboardOps, memberDashboard.rentHistory.length, loading.history, historyLoaded]);

  // Load more history data with pagination
  const loadMoreHistory = useCallback(async () => {
    // Move guard checks inside function to avoid dependencies on changing state
    if (loading.history || !memberDashboard.hasMoreHistory || !memberDashboard.nextHistoryCursor) {
      return;
    }

    try {
      setLocalError(null);
      await memberDashboardOps.getMemberRentHistory(12, memberDashboard.nextHistoryCursor);
    } catch (err) {
      console.error('Failed to load more history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more rent history';
      setLocalError(errorMessage);
    }
  }, [memberDashboardOps, loading.history, memberDashboard.hasMoreHistory, memberDashboard.nextHistoryCursor]);

  // Wrapper for loadHistory to handle async properly (for UI button clicks)
  const handleLoadHistory = useCallback(() => {
    void loadHistory();
  }, [loadHistory]);

  // Wrapper for loadMoreHistory to handle async properly (for UI button clicks)
  const handleLoadMoreHistory = useCallback(() => {
    void loadMoreHistory();
  }, [loadMoreHistory]);

  // Note: Friends and history data are loaded on-demand via user interactions
  // - Friends: Loaded ONLY when user clicks on "Friends" tab (not automatically)
  // - History: Loaded when user clicks "Load History" button
  // - More History: Loaded when user clicks "Load More" button

  // Refresh all data - clears cache and reloads everything (requirement 7.4)
  const refreshData = useCallback(async () => {
    setMemberLoaded(false);
    setFriendsLoaded(false);
    setHistoryLoaded(false);
    setLocalError(null);

    // Force refresh member dashboard data with current function reference
    try {
      await memberDashboardOps.getMemberDashboard();
      setMemberLoaded(true);
    } catch (err) {
      console.error('Failed to refresh member data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh data';
      setLocalError(errorMessage);
    }
  }, [memberDashboardOps]);

  // ... existing code

  // Retry functions that clear errors and reload
  const retryFriendsData = useCallback(async () => {
    memberDashboardOps.clearError('otherMembers');
    setFriendsLoaded(false); // Reset cache to force reload
    console.log('retryFriendsData has been called');
    await loadFriendsData();
  }, [loadFriendsData, memberDashboardOps]);

  const retryHistory = useCallback(async () => {
    setLocalError(null);
    setHistoryLoaded(false); // Reset cache to force reload
    await loadHistory();
  }, [loadHistory]);

  const retryDashboard = useCallback(async () => {
    setLocalError(null);
    setMemberLoaded(false); // Reset cache to force reload
    await memberDashboardOps.getMemberDashboard();
    setMemberLoaded(true);
  }, [memberDashboardOps]);

  // Combine errors from AppContext and local errors (requirement 7.5)
  //   const combinedError = localError || errors.dashboard || errors.history || errors.otherMembers;

  // Process history data to exclude current month (requirement 5.2)
  const processedHistoryData = useMemo(() => {
    if (!memberDashboard.rentHistory.length) return [];

    // If the history includes current month, exclude it from the display
    const currentMonthId = memberDashboard.currentMonth?.id;
    const historyArray = memberDashboard.rentHistory;

    // Filter out current month if it exists in history
    return historyArray.filter((history) => history.id !== currentMonthId);
  }, [memberDashboard.rentHistory, memberDashboard.currentMonth?.id]);

  // Use admin's UPI data for payment collection (members pay TO admin)
  const memberUpiData = useMemo(() => {
    // Use the UPI data already provided by the cloud function
    // This contains the admin's VPA and payee name from global settings
    if (!memberDashboard.upi?.upiVpa) {
      return null;
    }

    return {
      vpa: memberDashboard.upi.upiVpa, // Admin's UPI VPA (where members send payment)
      payeeName: memberDashboard.upi.payeeName, // Admin's name (who receives payment)
    };
  }, [memberDashboard.upi]);

  return {
    currentMember: memberDashboard.member,
    currentMonthHistory: memberDashboard.currentMonth,
    otherMembers: memberDashboard.otherMembers,
    historyData: processedHistoryData,
    hasMoreHistory: memberDashboard.hasMoreHistory,
    upi: memberUpiData,
    loading,
    errors,
    actions: {
      loadHistory: handleLoadHistory, // Button click: "Load History"
      loadMoreHistory: handleLoadMoreHistory, // Button click: "Load More"
      loadFriendsData, // Tab click: "Friends" tab
      refreshData, // Button click: "Refresh" button
      // Retry functions for error handling
      retryFriendsData,
      retryHistory,
      retryDashboard,
    },
    cache: {
      memberLoaded,
      friendsLoaded,
      historyLoaded,
    },
  };
};
