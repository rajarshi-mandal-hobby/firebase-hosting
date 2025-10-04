import { useState, useEffect, useCallback, useRef } from 'react';
import type { Member } from '../../../shared/types/firestore-types';
import { getMembers, type MemberFilters } from '../../../data/services/membersService';

/**
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagementData = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<MemberFilters>({ isActive: true });

  const wifiMembersRef = useRef<Member[]>([]);
  const totalOutstandingRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const fetchMembersDb = async ({ refresh = false, ...filters }: MemberFilters) => {
    setError(null);
    getMembers({ refresh, ...filters })
      .then(async (members) => {
        members.forEach((member) => {
          if (member.isActive) {
            totalOutstandingRef.current += member.currentMonthRent.currentOutstanding;
            if (member.optedForWifi) {
              wifiMembersRef.current.push(member);
            }
          }
        });
        setMembers(members);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    fetchMembersDb(filters);
  }, [refreshKey, filters]);

  const handleRetry = () => {
    hasLoadedRef.current = false;
    setRefreshKey((prev) => prev + 1);
  };

  const handleRefresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchMembersDb({ isActive: true });
  }, []);

  // Actions
  const actions = {
    handleRefresh,
    handleRetry,
    setFilters,
  };

  return {
    members,
    wifiMembers: wifiMembersRef.current,
    totalOutstanding: totalOutstandingRef.current,
    isLoading,
    error,
    actions,
  } as const;
};
