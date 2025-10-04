import { Box, SegmentedControl, Stack } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { LoadingBox } from '../../../../shared/components/LoadingBox';
import { RentManagement } from '../../../rent';
import { useTabNavigation } from '../hooks/useTabNavigation';
import type { Tab } from '../hooks/useTabNavigation';

const MembersManagement = lazy(() => import('../../../members/components/MembersManagement'));
const ConfigManagement = lazy(() => import('../../config/'));

// SegmentedControl expects an array of { label, value }
const TAB_DATA: { label: string; value: Tab }[] = [
  { label: 'Rent', value: 'rent' },
  { label: 'Members', value: 'members' },
  { label: 'Config', value: 'config' },
];

export const TabNavigation =() => {
  // Use custom hook to manage active tab state
  const { activeTab, visitedTab, handleTabChange } = useTabNavigation();

  console.log('Rendering TabNavigation');

  return (
    <Stack>
      <SegmentedControl mb='md' value={activeTab} onChange={handleTabChange} data={TAB_DATA} fullWidth />

      <Box hidden={activeTab !== 'rent'} aria-hidden={activeTab !== 'rent'}>
        <RentManagement />
      </Box>

      <Box hidden={activeTab !== 'members'} aria-hidden={activeTab !== 'members'}>
        {visitedTab.members && (
          <Suspense fallback={<LoadingBox loadingText='Loading members...' forComponent='MembersManagement' />}>
            <MembersManagement />
          </Suspense>
        )}
      </Box>

      <Box hidden={activeTab !== 'config'} aria-hidden={activeTab !== 'config'}>
        {visitedTab.config && (
          <Suspense fallback={<LoadingBox loadingText='Loading configuration...' forComponent='ConfigManagement' />}>
            <ConfigManagement />
          </Suspense>
        )}
      </Box>
    </Stack>
  );
};
