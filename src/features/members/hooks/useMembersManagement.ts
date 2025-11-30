import { useState, useEffect, useEffectEvent, useRef } from 'react';
import type { Member } from '../../../shared/types/firestore-types';
import { fetchMembers, type MemberFilters } from '../../../data/services/membersService';

/**
 * Custom hook for members management data with independent filtering
 * Handles fetching and merging of active and inactive members
 */
export const useMembersManagement = () => {
  const [activeMembers, setActiveMembers] = useState<Member[]>([]);
  const [inactiveMembers, setInactiveMembers] = useState<Member[]>([]);
  const [membersCount, setMembersCount] = useState({
    activeMembers: 0,
    inactiveMembers: 0,
    totalMembers: 0,
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<MemberFilters>({ reload: false, isActive: 'active' });
  const isInactiveMemberCalled = useRef(false);

  const fetchEvent = useEffectEvent(() => {
    // Determine if we should fetch based on filters or initial load
    const isFetchRequired =
      filters.reload ||
      activeMembers.length === 0 ||
      (membersCount.inactiveMembers === 0 && filters.isActive === 'inactive');

    if (!isFetchRequired || isLoading || isInactiveMemberCalled.current) {
      return;
    }

    const fetchMembersDb = async () => {
      setLoading(true);
      setError(null);
      try {
        const isActive = filters.isActive === 'active' ? 'active' : 'inactive';
        const members = await fetchMembers({ ...filters, isActive });

        if (filters.isActive === 'active') {
          setActiveMembers(members);
            setMembersCount((prev) => ({
            ...prev,
            activeMembers: members.length,
            totalMembers: members.length + prev.inactiveMembers,
          }));
        } else {
          setInactiveMembers(members);
          setMembersCount((prev) => ({
            ...prev,
            inactiveMembers: members.length,
            totalMembers: prev.activeMembers + members.length,
          }));
          isInactiveMemberCalled.current = true;
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        if (filters.isActive === 'inactive') {
          isInactiveMemberCalled.current = false;
        }
        setError(error);
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
        if (filters.reload) {
          setFilters((prev) => ({ ...prev, reload: false }));
        }
      }
    };

    fetchMembersDb();
  });

  useEffect(() => fetchEvent(), [filters]);

  const handleRefetch = () => {
    setFilters((prev) => ({ ...prev, reload: true }));
  };

  const handleInactiveMembers = (refetch = false) => {
    isInactiveMemberCalled.current = false;
    setFilters((prev) => ({ ...prev, isActive: 'inactive', reload: refetch }));
  };

  // Actions
  const actions = {
    handleRefetch,
    handleInactiveMembers,
  };

  return {
    activeMembers,
    inactiveMembers,
    isLoading,
    error,
    membersCount,
    actions,
  } as const;
};
