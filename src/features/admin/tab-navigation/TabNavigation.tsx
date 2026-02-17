import { SegmentedControl, Collapse, Alert } from '@mantine/core';
import { Activity, useState } from 'react';
import { DEFAULT_SVG_SIZE } from '../../../data/types';
import { IconExclamation } from '../../../shared/icons';
import { RentManagement } from './rent-management/components/RentManagement';
import { MembersManagement } from './member-menagement/components/MembersManagement';
import { useGlobalModal } from '../stores/modal-store';

type Tab = 'rent' | 'members';

const useTabNavigation = () => {
    const [activeTab, setActiveTab] = useState<Tab>('rent');

    const { totalErrorCount, errorMemberName } = useGlobalModal();
    const hasGlobalErrors = totalErrorCount > 0;

    const getActivityMode = (tab: Tab) => (tab === activeTab ? 'visible' : 'hidden');

    const handleTabChange = (tab: string) => setActiveTab(tab as Tab);

    return {
        activeTab,
        handleTabChange,
        hasGlobalErrors,
        totalErrorCount,
        getActivityMode,
        errorMemberName
    };
};

export function TabNavigation() {
    const TAB_DATA: { value: Tab; label: string }[] = [
        { value: 'rent', label: 'Rent' },
        { value: 'members', label: 'Members' }
    ] as const;

    const { activeTab, handleTabChange, hasGlobalErrors, totalErrorCount, getActivityMode, errorMemberName } =
        useTabNavigation();

    console.log('🎨 Rendering TabNavigation');
    return (
        <>
            <SegmentedControl value={activeTab} onChange={handleTabChange} data={TAB_DATA} />

            <Collapse in={hasGlobalErrors}>
                <Alert
                    color='red'
                    variant='outline'
                    p='xs'
                    mt='lg'
                    icon={<IconExclamation size={DEFAULT_SVG_SIZE} color='red' />}
                >
                    {errorMemberName} has failed {totalErrorCount === 1 ? 'transaction' : 'transactions'}. Please try
                    again.
                </Alert>
            </Collapse>

            <Activity mode={getActivityMode('rent')}>
                <RentManagement />
            </Activity>

            <Activity mode={getActivityMode('members')}>
                <MembersManagement />
            </Activity>
        </>
    );
}
