import { useState, useEffect, useEffectEvent, useRef } from 'react';
import type { Member } from '../../../shared/types/firestore-types';
import { fetchMembers, type MemberFilters } from '../../../data/services/membersService';

/**
 * Custom hook for members management data with independent filtering
 * Handles fetching and merging of active and inactive members
 */
export const useMembersManagement = () => {
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [membersCount, setMembersCount] = useState({
    activeMembers: 0,
    inactiveMembers: 0,
    optedForWifiMembers: 0,
  });
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<MemberFilters>({ reload: false, isActive: 'active' });
  const inactiveMemberCalled = useRef(false);

  const fetchEvent = useEffectEvent(() => {
    // Determine if we should fetch based on filters or initial load
    const shouldFetch = filters.reload || allMembers.length === 0 || membersCount.activeMembers === allMembers.length;
    console.log('useMembersManagement fetchEvent called, shouldFetch:', shouldFetch);
    if (!shouldFetch || isLoading || inactiveMemberCalled.current) {
      console.log('Fetch skipped - isLoading:', isLoading, 'inactiveMemberCalled:', inactiveMemberCalled.current);
      return;
    }
    console.log('useMembersManagement effect triggered, filter:', filters.isActive, 'reload:', filters.reload);

    const fetchMembersDb = async () => {
      setLoading(true);
      setError(null);
      try {
        const activeMembers = await fetchMembers({ ...filters, isActive: 'active' });

        let inactiveMembers: Member[] = [];
        if (filters.isActive === 'inactive') {
          inactiveMembers = await fetchMembers({ ...filters, isActive: 'inactive' });
          inactiveMemberCalled.current = true;
        }

        const membersData = [...activeMembers, ...inactiveMembers];

        setMembersCount({
          activeMembers: activeMembers.length,
          inactiveMembers: inactiveMembers.length,
          optedForWifiMembers: membersData.filter((m) => m.optedForWifi).length,
        });
        setAllMembers(membersData);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching members:', err);
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
    inactiveMemberCalled.current = false;
    setFilters((prev) => ({ ...prev, isActive: 'inactive', reload: refetch }));
  };

  // Actions
  const actions = {
    handleRefetch,
    handleInactiveMembers,
  };

  return {
    members: allMembers,
    isLoading,
    error,
    membersCount,
    actions,
  } as const;
};
