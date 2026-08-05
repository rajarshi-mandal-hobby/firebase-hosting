import { Affix, SegmentedControl } from '@mantine/core';
import { Activity, useState } from 'react';
import { RentManagement } from './rent-management/RentManagement';
import { SuspenseBox } from '../../shared/components';
import { lazyImport } from '../../shared/utils';

const MembersManagement = lazyImport(() => import('./member-menagement/MembersManagement'), 'MembersManagement');

type Tab = 'rent' | 'members';

// 1. Moved static layout declaration entirely outside the hook memory lifecycle
export const TAB_DATA: { value: Tab; label: string }[] = [
    { value: 'rent', label: 'Rent' },
    { value: 'members', label: 'Members' }
];

const useTabNavigation = () => {
    const [activeTab, setActiveTab] = useState<Tab>('rent');

    return {
        activeTab,
        actions: {
            handleTabChange(targetTab: Tab) {
                setActiveTab(targetTab);
            },
            getActivityMode(tab: Tab) {
                return tab === activeTab ? 'visible' : 'hidden';
            }
        }
    } as const;
};

export const TabNavigation = () => {
    const {
        activeTab,
        actions: { handleTabChange, getActivityMode }
    } = useTabNavigation();

    console.log('🎨 Rendering TabNavigation');
    return (
        <>
            <SegmentedControl value={activeTab} onChange={handleTabChange} data={TAB_DATA} />

            <Activity mode={getActivityMode('rent')}>
                <RentManagement />
            </Activity>

            <Activity mode={getActivityMode('members')}>
                <SuspenseBox>
                    <MembersManagement />
                </SuspenseBox>
            </Activity>
        </>
    );
};
