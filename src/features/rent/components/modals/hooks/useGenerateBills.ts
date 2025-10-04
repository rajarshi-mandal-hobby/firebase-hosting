import { useEffect, useState } from 'react';
import type { Member } from '../../../../../shared/types/firestore-types';
import { fetchGlobalSettings } from '../../../../../data/services/configService';
import type { Timestamp } from 'firebase/firestore';

export type GenerateBillsData = {
  billingMonths: {
    currentBillingMonth: Timestamp;
    nextBillingMonth: Timestamp;
  };
  activeMembersCounts: {
    '2nd': number;
    '3rd': number;
  };
  wifiCharges: {
    wifiMemberIds: string[];
    wifiMonthlyCharge: number;
  };
};

export const useGenerateBills = (enabled: boolean, members: Member[]) => {
  const [billingData, setBillingData] = useState<GenerateBillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreh, setRefresh] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    console.log('I am in useGenerateBills effect', { enabled, refreh, resetKey });
    if (!enabled) return;
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const settings = await fetchGlobalSettings(refreh);
        const wifiMemberIds: string[] = [];
        const activeMembersCounts = members.reduce(
          (acc, member) => {
            if (member.isActive) {
              if (member.optedForWifi) wifiMemberIds.push(member.id);
              acc[member.floor] = (acc[member.floor] || 0) + 1;
            }
            return acc;
          },
          { '2nd': 0, '3rd': 0 }
        );

        setBillingData({
          billingMonths: {
            currentBillingMonth: settings.currentBillingMonth,
            nextBillingMonth: settings.nextBillingMonth,
          },
          activeMembersCounts,
          wifiCharges: {
            wifiMemberIds,
            wifiMonthlyCharge: settings.wifiMonthlyCharge,
          },
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError(error instanceof Error ? error : new Error('Failed to fetch settings'));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [enabled, refreh, resetKey, members]);

  const handleReset = () => {
    setResetKey((prev) => {
      const newKey = prev + 1;
      setRefresh(newKey > 3);
      return newKey > 3 ? 0 : newKey;
    });
  };

  return {
    billingData,
    loading,
    error,
    actions: { handleReset },
  } as const;
};
