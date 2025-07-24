import { useState, useEffect, useCallback } from 'react';
import { MembersService } from '../../../contexts/services';
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
 * Custom hook for rent management data using FirestoreService with real-time updates
 */
export const useRentManagementData = (): UseRentManagementData => {
  // State
  const [membersWithBills, setMembersWithBills] = useState<MemberWithBill[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rentLoaded, setRentLoaded] = useState(false);

  // Load rent data
  const loadRentData = useCallback(async () => {
    if (rentLoaded) return;

    try {
      setError(null);
      setLoading(true);

      // Get active members from MembersService
      const members = await MembersService.getMembers({ isActive: true });

      // Get rent history for each member
      const membersWithBillsData: MemberWithBill[] = [];

      for (const member of members) {
        try {
          const rentHistory = await MembersService.getMemberRentHistory(member.id);
          const latestHistory = rentHistory[0] || null; // Most recent history

          membersWithBillsData.push({
            member,
            latestHistory,
          });
        } catch (err) {
          console.warn(`Failed to load rent history for member ${member.id}:`, err);
          membersWithBillsData.push({
            member,
            latestHistory: null,
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
    } finally {
      setLoading(false);
    }
  }, [rentLoaded]);

  // Auto-load rent data on mount
  useEffect(() => {
    void loadRentData();
  }, [loadRentData]);

  // Actions
  const actions = {
    refetch: useCallback(() => {
      setRentLoaded(false);
      setMembersWithBills([]);
      setTotalOutstanding(0);
      setError(null);
    }, []),
  };

  return {
    membersWithBills,
    totalOutstanding,
    loading: {
      rent: loading,
    },
    error,
    actions,
    cache: {
      rentLoaded,
    },
  };
};
