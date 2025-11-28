import { useEffect, useState } from 'react';
import type { Member } from '../../../../../shared/types/firestore-types';
import { fetchGlobalSettings } from '../../../../../data/services/configService';
import type { Timestamp } from 'firebase/firestore';
import type { Floor } from '../../../../../data/shemas/GlobalSettings';

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

export const useGenerateBills = (enabled: boolean, members: Member[]) => {
  const [billData, setBillingData] = useState<GenerateBillsData | null>(null);
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
        const activeMembersCounts = { '2nd': 0, '3rd': 0 };
        const activeMembersIdsByFloor: Record<Floor, string[]> = { '2nd': [], '3rd': [] };
        const membersOptions = members
          .filter((member) => member.isActive)
          .reduce<{ label: string; value: string }[]>((acc, member) => {
            if (member.optedForWifi) wifiMemberIds.push(member.id);
            activeMembersCounts[member.floor] = (activeMembersCounts[member.floor] || 0) + 1;
            activeMembersIdsByFloor[member.floor].push(member.id);
            acc.push({ label: member.name, value: member.id });
            return acc;
          }, []);

        setBillingData({
          billingMonths: {
            currentBillingMonth: settings.currentBillingMonth,
            nextBillingMonth: settings.nextBillingMonth,
          },
          activeMembersCounts,
          activeMembersIdsByFloor,
          wifiCharges: {
            wifiMemberIds,
            wifiMonthlyCharge: settings.wifiMonthlyCharge,
          },
          membersOptions,
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
    billData,
    loading,
    error,
    actions: { handleReset },
  } as const;
};
