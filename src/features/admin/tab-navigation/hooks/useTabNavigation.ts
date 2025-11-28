import { useCallback, useRef, useState } from 'react';

export type Tab = 'rent' | 'members';

export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<Tab>('rent');
  const [visitedTab, setVisitedTab] = useState<Record<Tab, boolean>>({
    rent: true,
    members: false,
  });

  const handleTabChange = 
    (selectedTab: string) => {
      const tab = selectedTab as Tab;
      setActiveTab(tab);
      setVisitedTab((prev) => ({ ...prev, [tab]: true }));
    };
  return { activeTab, visitedTab, handleTabChange } as const;
};
