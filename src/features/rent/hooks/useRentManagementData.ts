import { useState, useEffect, useCallback } from 'react';
import { useData } from '../../../contexts/DataProvider';
import { calculateTotalOutstanding } from '../../../shared/utils/memberUtils';
import type { Member, RentHistory } from '../../../shared/types/firestore-types';

export interface MemberWithBill {
  member: Member;
  latestHistory: RentHistory | null;
}

export interface UseRentManagementData {
  membersWithBills: MemberWithBill[];
  totalOutstanding: number;
  loading: {
    rent: boolean;
  };
  error: string | null;
  actions: {
    refetch: () => void;
  };
  cache: {
    rentLoaded: boolean;
  };
}

/**
 * Custom hook for rent management data using DataProvider with real-time updates
 */
export const useRentManagementData = (): UseRentManagementData => {
  const { 
    getMembers, 
    getMemberRentHistory, 
    isLoading 
  } = useData();

  // State
  const [membersWithBills, setMembersWithBills] = useState<MemberWithBill[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [rentLoaded, setRentLoaded] = useState(false);

  // Load rent data
  const loadRentData = useCallback(async () => {
    if (rentLoaded) return;

    try {
      setError(null);
      
      // Get active members from DataProvider (with caching)
      const members = await getMembers({ isActive: true });
      
      // Get rent history for each member
      const membersWithBillsData: MemberWithBill[] = [];
      
      for (const member of members) {
        try {
          const rentHistory = await getMemberRentHistory(member.id);
          const latestHistory = rentHistory[0] || null; // Most recent history
          
          membersWithBillsData.push({
            member,
            latestHistory
          });
        } catch (err) {
          console.warn(`Failed to load rent history for member ${member.id}:`, err);
          membersWithBillsData.push({
            member,
            latestHistory: null
          });
        }
      }
      
      // Calculate total outstanding
      const totalOutstanding = calculateTotalOutstanding(members);
      
      setMembersWithBills(membersWithBillsData);
      setTotalOutstanding(totalOutstanding);
      setRentLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rent data');
    }
  }, [rentLoaded, getMembers, getMemberRentHistory]);

  // Auto-load rent data on mount
  useEffect(() => {
    loadRentData();
  }, [loadRentData]);

  // Actions
  const actions = {
    refetch: useCallback(() => {
      setRentLoaded(false);
      setMembersWithBills([]);
      setTotalOutstanding(0);
      setError(null);
    }, [])
  };

  return {
    membersWithBills,
    totalOutstanding,
    loading: {
      rent: isLoading('members_{"isActive":true}'),
    },
    error,
    actions,
    cache: {
      rentLoaded,
    }
  };
};
