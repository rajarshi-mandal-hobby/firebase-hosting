import { useState, useEffect, useCallback, useRef } from 'react';
import type { Member } from '../../../shared/types/firestore-types';
import { getMembers } from '../../../data/services/membersService';

/**
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagementData = () => {
  // State
  const [members, setMembers] = useState<Member[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [rentManagementError, setRentManagementError] = useState<unknown | null>(null);

  const totalOutstandingRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const fetchMembersDb = (refresh = false) => {
    getMembers({ refresh, isActive: true })
      .then(async (members) => {
        members.some((member) => {
          if (member.currentMonthRent.status === 'Partial') {
            totalOutstandingRef.current += member.currentMonthRent.currentOutstanding;
            return true; // break iteration
          }
          return false; // continue iteration
        });
        setMembers(members);
      })
      .catch((error) => {
        setRentManagementError(error);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  };

  const loadInitialData = useCallback(() => {
    setInitialLoading(true);
    setRentManagementError(null);
    fetchMembersDb();
  }, []);

  const handleRefresh = useCallback(() => {
    setInitialLoading(true);
    setRentManagementError(null);
    fetchMembersDb(true);
  }, []);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadInitialData();
  }, [loadInitialData]);

  // Actions
  const actions = {
    refetch: handleRefresh,
  };

  return {
    members,
    totalOutstanding: totalOutstandingRef.current,
    loading: initialLoading,
    error: rentManagementError,
    actions,
  };
};
