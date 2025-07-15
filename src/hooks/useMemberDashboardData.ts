import { useState, useEffect, useCallback } from 'react';
import { mockCurrentUser } from '../data/mock/mockData';
import { useData } from './useData';
import type { Member, RentHistory } from '../shared/types/firestore-types';

export interface UseMemberDashboardData {
  currentMember: Member | null;
  currentMonthHistory: RentHistory | null;
  otherMembers: Member[];
  historyData: RentHistory[];
  loading: {
    member: boolean;
    friends: boolean;
    history: boolean;
  };
  error: string | null;
  actions: {
    loadHistory: () => void;
    refreshData: () => void;
  };
  cache: {
    memberLoaded: boolean;
    friendsLoaded: boolean;
    historyLoaded: boolean;
  };
}

/**
 * Custom hook for member dashboard data using DataProvider with real-time updates
 */
export const useMemberDashboardData = (): UseMemberDashboardData => {
  // State
  const [currentMember, setCurrentMember] = useState<Member | null>(null);
  const [currentMonthHistory, setCurrentMonthHistory] = useState<RentHistory | null>(null);
  const [otherMembers, setOtherMembers] = useState<Member[]>([]);
  const [historyData, setHistoryData] = useState<RentHistory[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Loading states
  const [memberLoading, setMemberLoading] = useState(false);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Cache flags
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const { getMember, getMembers, getMemberRentHistory } = useData();

  // Load current member data
  const loadMemberData = useCallback(async () => {
    if (memberLoaded || memberLoading) return;

    try {
      setMemberLoading(true);
      setError(null);
      
      // Get current member
      const member = await getMember(mockCurrentUser.linkedMemberId);
      if (!member) {
        setError('Member data not found');
        setCurrentMember(null);
        setCurrentMonthHistory(null);
        return;
      }

      // Get current month rent history
      const rentHistory = await getMemberRentHistory(mockCurrentUser.linkedMemberId);
      const currentMonthBill = rentHistory.length > 0 ? rentHistory[0] : null;

      setCurrentMember(member);
      setCurrentMonthHistory(currentMonthBill);
      setMemberLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member data');
    } finally {
      setMemberLoading(false);
    }
  }, [memberLoaded, memberLoading, getMember, getMemberRentHistory]);

  // Load other active members (friends)
  const loadFriendsData = useCallback(async () => {
    if (friendsLoaded || friendsLoading) return;

    try {
      setFriendsLoading(true);
      setError(null);
      
      const allMembers = await getMembers({ isActive: true });
      const filteredMembers = allMembers.filter(m => m.id !== mockCurrentUser.linkedMemberId);

      setOtherMembers(filteredMembers);
      setFriendsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends data');
    } finally {
      setFriendsLoading(false);
    }
  }, [friendsLoaded, friendsLoading, getMembers]);

  // Load history data
  const loadHistory = useCallback(async () => {
    if (historyLoaded || historyLoading) return;

    try {
      setHistoryLoading(true);
      setError(null);
      
      const history = await getMemberRentHistory(mockCurrentUser.linkedMemberId);
      // Get up to 12 previous months, skipping the first (current month)
      const prevHistory = history.slice(1, 13);
      
      setHistoryData(prevHistory);
      setHistoryLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history data');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLoaded, historyLoading, getMemberRentHistory]);

  // Wrapper for loadHistory to handle async properly
  const handleLoadHistory = useCallback(() => {
    void loadHistory();
  }, [loadHistory]);

  // Auto-load member data when hook is used
  useEffect(() => {
    void loadMemberData();
  }, [loadMemberData]);

  // Auto-load friends when they're accessed
  useEffect(() => {
    if (otherMembers.length === 0 && !friendsLoaded && !friendsLoading) {
      void loadFriendsData();
    }
  }, [otherMembers.length, friendsLoaded, friendsLoading, loadFriendsData]);

  // Refresh all data
  const refreshData = useCallback(() => {
    setMemberLoaded(false);
    setFriendsLoaded(false);
    setHistoryLoaded(false);
    setError(null);
  }, []);

  return {
    currentMember,
    currentMonthHistory,
    otherMembers,
    historyData,
    loading: {
      member: memberLoading,
      friends: friendsLoading,
      history: historyLoading,
    },
    error,
    actions: {
      loadHistory: handleLoadHistory,
      refreshData,
    },
    cache: {
      memberLoaded,
      friendsLoaded,
      historyLoaded,
    },
  };
};
