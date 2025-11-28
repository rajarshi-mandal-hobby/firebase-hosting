import { useState, useEffect, useRef, useEffectEvent } from 'react';
import type { Member } from '../../../shared/types/firestore-types';
import { fetchMembers, type MemberFilters } from '../../../data/services/membersService';
import type { Tab } from '../../admin/tab-navigation/hooks/useTabNavigation';

/**
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagement = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<MemberFilters>({ reload: false, isActive: 'active' });

  const [wifiMembers, setWifiMembers] = useState<Member[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);

  const fetchEvent = useEffectEvent(() => {
    // TODO: Check for changes in filters if needed
    const shouldFetch = filters.reload || members.length === 0;

    if (!shouldFetch || isLoading) {
      return;
    }

    console.log('useRentManagement effect triggered, reload:', filters.reload);

    const fetchMembersDb = async () => {
      setLoading(true);
      setError(null);
      try {
        const membersData = await fetchMembers({ ...filters });
        setMembers(membersData);

        // Compute wifi members and total outstanding
        const wifiMembersList = membersData.filter((member) => member.optedForWifi);
        const outstanding = membersData.reduce(
          (sum, member) => (member.isActive ? sum + member.currentMonthRent.currentOutstanding : sum),
          0
        );

        setWifiMembers(wifiMembersList);
        setTotalOutstanding(outstanding);
      } catch (err) {
        setError(err as Error);
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

  // Actions
  const actions = {
    handleRefetch,
    setFilters,
  };

  return {
    members,
    wifiMembers,
    totalOutstanding,
    isLoading,
    error,
    actions,
  } as const;
};
