import { useState, useRef, useEffect } from 'react';
import { fetchGlobalSettings } from '../../../../data/services/configService';
import { fetchMembers } from '../../../../data/services/membersService';
import type { Floor } from '../../../../data/shemas/GlobalSettings';
import type { Member } from '../../../../shared/types/firestore-types';
import type { Timestamp } from '@firebase/firestore';

type FunctionName = 'fetchGlobalSettings' | 'fetchMembers';

interface FunctionError {
  functionName: FunctionName;
  error: Error;
}

export type GenerateBillsData = {
  billingMonths: {
    currentBillingMonth: Timestamp;
    nextBillingMonth: Timestamp;
  };
  activeMembersCounts: Record<Floor, number>;
  activeMembersIdsByFloor: Record<Floor, string[]>;
  wifiCharges: {
    wifiMemberIds: string[];
    wifiMonthlyCharge: number;
  };
  membersOptions: { label: string; value: string }[];
};

export const useGenerateBillsData = () => {
  const [billingData, setBillingData] = useState<GenerateBillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FunctionError | null>(null);

  const retryCountRef = useRef<Record<FunctionName, number>>({
    fetchMembers: 0,
    fetchGlobalSettings: 0,
  });

  const retryFunctionRef = useRef<FunctionName | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const processData = (fetchedMembers: Member[], billingData: any) => {
    const wifiMemberIds: string[] = [];
    const activeMembersCounts: Record<Floor, number> = { '2nd': 0, '3rd': 0 };
    const activeMembersIdsByFloor: Record<Floor, string[]> = { '2nd': [], '3rd': [] };

    const membersOptions = fetchedMembers
      .filter((member) => member.isActive)
      .reduce<{ label: string; value: string }[]>((acc, member) => {
        if (member.optedForWifi) wifiMemberIds.push(member.id);
        activeMembersCounts[member.floor]++;
        activeMembersIdsByFloor[member.floor].push(member.id);
        acc.push({ label: member.name, value: member.id });
        return acc;
      }, []);

    return {
      billingMonths: {
        currentBillingMonth: billingData.currentBillingMonth,
        nextBillingMonth: billingData.nextBillingMonth,
      },
      activeMembersCounts,
      activeMembersIdsByFloor,
      wifiCharges: {
        wifiMemberIds,
        wifiMonthlyCharge: billingData.wifiMonthlyCharge,
      },
      membersOptions,
    };
  };

  // ✅ Sequential fetch - first resolve members, then settings
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        const retryFunction = retryFunctionRef.current;

        // ✅ Step 1: Fetch members first
        let fetchedMembers: Member[];
        try {
          fetchedMembers = await fetchMembers({
            isActive: true,
            reload: retryFunction === 'fetchMembers',
          });
          // Reset members retry count on success
          retryCountRef.current.fetchMembers = 0;
        } catch (err) {
          if (!isMounted) return;

          const error = err instanceof Error ? err : new Error(String(err));
          setError({
            functionName: 'fetchMembers',
            error,
          });
          setLoading(false);
          return; // ✅ Stop here - don't fetch settings
        }

        // ✅ Step 2: Only if members succeeded, fetch settings
        let billingData;
        try {
          billingData = await fetchGlobalSettings();
          // Reset settings retry count on success
          retryCountRef.current.fetchGlobalSettings = 0;
        } catch (err) {
          if (!isMounted) return;

          const error = err instanceof Error ? err : new Error(String(err));
          setError({
            functionName: 'fetchGlobalSettings',
            error,
          });
          setLoading(false);
          return; // ✅ Settings failed, show error
        }

        if (!isMounted) return;

        // ✅ Both succeeded - process and set data
        retryFunctionRef.current = null;
        const processedData = processData(fetchedMembers, billingData);
        setBillingData(processedData);
        setLoading(false);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        const error = err instanceof Error ? err : new Error(String(err));
        setError({
          functionName: 'fetchMembers',
          error,
        });
        setLoading(false);
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [fetchTrigger]);

  // ✅ Manual retry handler
  const handleRefetch = () => {
    if (!error) return;

    const currentRetryCount = retryCountRef.current[error.functionName];

    if (currentRetryCount >= 3) {
      setError((prev) => ({
        ...prev!,
        error: new Error('Maximum retry attempts (3) exceeded. Please refresh the page.'),
      }));
      return;
    }

    retryCountRef.current[error.functionName]++;
    retryFunctionRef.current = error.functionName; // ✅ Retry the specific failed function
    setFetchTrigger((prev) => prev + 1); // ✅ Trigger effect re-run
  };

  return { loading, error, billingData, handleRefetch } as const;
};
