import { useState, useEffect, useCallback } from 'react';
import { 
  getActiveMembersWithLatestBills,
  calculateTotalOutstanding
} from '../../../utils/memberUtils';
import type { Member, RentHistory } from '../../../firestore-types';

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
 * Custom hook for rent management data with proper caching
 * Now used at AdminDashboard level to persist across tab switches
 */
export const useRentManagementData = (): UseRentManagementData => {
  // State
  const [membersWithBills, setMembersWithBills] = useState<MemberWithBill[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Loading states
  const [rentLoading, setRentLoading] = useState(false);

  // Cache flags
  const [rentLoaded, setRentLoaded] = useState(false);

  // Load rent data
  const loadRentData = useCallback(async () => {
    if (rentLoaded) return;

    try {
      setRentLoading(true);
      setError(null);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const rentData = getActiveMembersWithLatestBills();
      const totalOutstanding = calculateTotalOutstanding();
      
      setMembersWithBills(rentData);
      setTotalOutstanding(totalOutstanding);
      setRentLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rent data');
    } finally {
      setRentLoading(false);
    }
  }, [rentLoaded]);

  // Auto-load rent data on mount
  useEffect(() => {
    loadRentData();
  }, [loadRentData, rentLoaded]);

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
      rent: rentLoading,
    },
    error,
    actions,
    cache: {
      rentLoaded,
    }
  };
};
