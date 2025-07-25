import { useState, useEffect, useCallback } from 'react';
import { getMemberCounts } from '../../../shared/utils/memberUtils';
import { FirestoreService } from '../../../data/firestoreService';
import type { Member } from '../../../shared/types/firestore-types';

export interface MemberCounts {
  total: number;
  active: number;
  wifiOptedIn: number;
}

export interface UseMemberManagementData {
  members: Member[];
  memberCounts: MemberCounts;
  loading: {
    members: boolean;
  };
  error: string | null;
  actions: {
    refetch: () => void;
  };
  cache: {
    membersLoaded: boolean;
  };
}

/**
 * Custom hook for member management data with proper caching
 * Now used at AdminDashboard level to persist across tab switches
 */
export const useMemberManagementData = (): UseMemberManagementData => {
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [memberCounts, setMemberCounts] = useState<MemberCounts>({
    total: 0,
    active: 0,
    wifiOptedIn: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // Loading states
  const [membersLoading, setMembersLoading] = useState(false);

  // Cache flags
  const [membersLoaded, setMembersLoaded] = useState(false);

  // Load member data
  const loadMemberData = useCallback(async () => {
    if (membersLoaded) return;

    try {
      setMembersLoading(true);
      setError(null);

      // Load members from FirestoreService
      const allMembers = await FirestoreService.Members.getMembers();
      const counts = getMemberCounts(allMembers);

      setMembers(allMembers);
      setMemberCounts(counts);
      setMembersLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member data');
    } finally {
      setMembersLoading(false);
    }
  }, [membersLoaded]);

  // Auto-load member data on mount
  useEffect(() => {
    void loadMemberData();
  }, [loadMemberData, membersLoaded]);

  // Actions
  const actions = {
    refetch: useCallback(() => {
      setMembersLoaded(false);
      setMembers([]);
      setMemberCounts({ total: 0, active: 0, wifiOptedIn: 0 });
      setError(null);
    }, []),
  };

  return {
    members,
    memberCounts,
    loading: {
      members: membersLoading,
    },
    error,
    actions,
    cache: {
      membersLoaded,
    },
  };
};
