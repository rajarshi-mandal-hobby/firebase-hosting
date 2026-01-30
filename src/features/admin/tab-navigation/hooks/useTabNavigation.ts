import { startTransition, useState } from 'react';
import { useGlobalModal } from '../../stores/modal-store';

export type Tab = 'rent' | 'members';

export const useTabNavigation = () => {
    const [activeTab, setActiveTab] = useState<Tab>('rent');

    const { totalErrorCount } = useGlobalModal();
    const hasGlobalErrors = totalErrorCount > 0;

    const getActivityMode = (isActiveTab: boolean) => {
        return isActiveTab ? 'visible' : 'hidden';
    };

    const handleTabChange = (tab: string) => startTransition(() => setActiveTab(tab as Tab));

    return {
        activeTab,
        handleTabChange,
        hasGlobalErrors,
        totalErrorCount,
        getActivityMode
    };
};
