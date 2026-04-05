import { SegmentedControl, Collapse } from '@mantine/core';
import { Activity, useState } from 'react';
import { IconExclamation } from '../../../../shared/icons';
import { RentManagement } from './rent-management/RentManagement';
import { useGlobalErrorData } from '../../../../contexts';
import { MembersManagement } from './member-menagement/MembersManagement';
import { MyAlert } from '../../../../shared/components';

type Tab = 'rent' | 'members';

const TAB_DATA: { value: Tab; label: string }[] = [
    { value: 'rent', label: 'Rent' },
    { value: 'members', label: 'Members' }
] as const;

const useTabNavigation = () => {
    const [activeTab, setActiveTab] = useState<Tab>('rent');

    const { errorCount, errorMembers, hasGlobalErrors, resetAll } = useGlobalErrorData();
    const memberNames = Object.values(errorMembers).map((member) => member.name);
    const memberNameLength = memberNames.length;
    const errorMemberName =
        memberNameLength > 1 ? `${memberNames[0]} and ${memberNameLength - 1} more` : memberNames[0] || '';

    return {
        activeTab,
        hasGlobalErrors,
        totalErrorCount: errorCount,
        errorMemberName,
        actions: {
            handleTabChange: (tab: string) => setActiveTab(tab as Tab),
            getMode: (tab: Tab) => (tab === activeTab ? 'visible' : 'hidden'),
            resetAll
        }
    };
};

export const TabNavigation = () => {
    const {
        activeTab,
        hasGlobalErrors,
        totalErrorCount,
        actions: { handleTabChange, getMode, resetAll },
        errorMemberName
    } = useTabNavigation();

    console.log('🎨 Rendering TabNavigation');
    return (
        <>
            <SegmentedControl value={activeTab} onChange={handleTabChange} data={TAB_DATA} />

            <Collapse expanded={hasGlobalErrors}>
                <MyAlert
                    color='red'
                    variant='outline'
                    p='xs'
                    mt='lg'
                    Icon={IconExclamation}
                    withCloseButton
                    onClose={resetAll}
                    closeButtonLabel='Clear all errors'
                >
                    {errorMemberName} has failed transaction{totalErrorCount > 1 && 's'}. Please try again.
                </MyAlert>
            </Collapse>

            <Activity mode={getMode('rent')}>
                <RentManagement />
            </Activity>

            <Activity mode={getMode('members')}>
                <MembersManagement />
            </Activity>
        </>
    );
};
