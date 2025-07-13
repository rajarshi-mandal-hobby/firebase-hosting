import { useState, useEffect, useCallback } from 'react';
import { 
  getMemberWithLatestBill, 
  mapToMember, 
  getMemberRentHistory 
} from '../utils/memberUtils';
import { mockCurrentUser, mockMembers } from '../data/mockData';
import type { Member, RentHistory, MockMemberData } from '../shared/types/firestore-types';

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
    loadFriends: () => void;
    refetchMember: () => void;
  };
  cache: {
    memberLoaded: boolean;
    friendsLoaded: boolean;
    historyLoaded: boolean;
  };
}

/**
 * Custom hook for member dashboard data with proper caching
 * Prevents unnecessary re-renders and API calls
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

  // Load current member data
  const loadMemberData = useCallback(async () => {
    if (memberLoaded) return;

    try {
      setMemberLoading(true);
      setError(null);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const memberData = getMemberWithLatestBill(mockCurrentUser.linkedMemberId);
      if (!memberData) {
        setError('Member data not found');
        setCurrentMember(null);
        setCurrentMonthHistory(null);
      } else {
        setCurrentMember(memberData.member);
        setCurrentMonthHistory(memberData.latestHistory);
      }
      
      setMemberLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member data');
    } finally {
      setMemberLoading(false);
    }
  }, [memberLoaded]);

  // Load friends data
  const loadFriends = useCallback(async () => {
    if (friendsLoaded) return;

    try {
      setFriendsLoading(true);
      setError(null);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filteredMembers = (mockMembers as MockMemberData[])
        .filter((m) => m.isActive && m.id !== mockCurrentUser.linkedMemberId)
        .map(mapToMember);

      setOtherMembers(filteredMembers);
      setFriendsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends data');
    } finally {
      setFriendsLoading(false);
    }
  }, [friendsLoaded]);

  // Load history data
  const loadHistory = useCallback(async () => {
    if (historyLoaded) return;

    try {
      setHistoryLoading(true);
      setError(null);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const history = getMemberRentHistory(mockCurrentUser.linkedMemberId);
      // Get up to 12 previous months, skipping the first (current month)
      const prevHistory = history.slice(1, 13);
      
      setHistoryData(prevHistory);
      setHistoryLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history data');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLoaded]);

  // Auto-load member data on mount
  useEffect(() => {
    loadMemberData();
  }, [loadMemberData]);

  // Actions
  const actions = {
    loadHistory: useCallback(() => {
      if (!historyLoaded) {
        loadHistory();
      }
    }, [loadHistory, historyLoaded]),
    
    loadFriends: useCallback(() => {
      if (!friendsLoaded) {
        loadFriends();
      }
    }, [loadFriends, friendsLoaded]),
    
    refetchMember: useCallback(() => {
      setMemberLoaded(false);
      setCurrentMember(null);
      setCurrentMonthHistory(null);
    }, [])
  };

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
    actions,
    cache: {
      memberLoaded,
      friendsLoaded,
      historyLoaded,
    }
  };
};
