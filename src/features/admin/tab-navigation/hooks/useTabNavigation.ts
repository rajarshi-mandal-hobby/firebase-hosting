import { useCallback, useRef, useState } from 'react';

export type Tab = 'rent' | 'members' | 'config';
let currentTab: Tab = 'rent';

export const useTabNavigation = () => {
  const [activeTab, setActiveTab] = useState<Tab>(currentTab);
  const visitedTabRef = useRef<Record<Tab, boolean>>({
    rent: true,
    members: false,
    config: false,
  });

  const handleTabChange = useCallback(
    (selectedTab: string) => {
      const tab = selectedTab as Tab;
      setActiveTab(tab);
      visitedTabRef.current[tab] = true;
    },
    [setActiveTab]
  );
  currentTab = activeTab;
  return { activeTab, visitedTab: visitedTabRef.current, handleTabChange } as const;
};
