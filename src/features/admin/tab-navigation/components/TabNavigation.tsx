import { Box, SegmentedControl, Stack } from '@mantine/core';
import { lazy, Suspense } from 'react';
import { LoadingBox } from '../../../../shared/components/LoadingBox';
import { RentManagement, useRentManagement } from '../../../rent';
import { useTabNavigation } from '../hooks/useTabNavigation';
import type { Tab } from '../hooks/useTabNavigation';
import { ErrorContainer } from '../../../../shared/components/ErrorContainer';

const MembersManagement = lazy(() => import('../../../members/components/MembersManagement'));

// SegmentedControl expects an array of { label, value }
const TAB_DATA: { label: string; value: Tab }[] = [
  { label: 'Rent', value: 'rent' },
  { label: 'Members', value: 'members' },
];

export const TabNavigation = () => {
  // Use custom hook to manage active tab state
  const { activeTab, visitedTab, handleTabChange } = useTabNavigation();
  const { members, isLoading, totalOutstanding, error, actions } = useRentManagement();

  console.log('Rendering TabNavigation');

  if (isLoading) {
    return <LoadingBox loadingText='Loading Tab Navigation...' forComponent='Tab Navigation' />;
  }

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
  }

  return (
    <Stack align='stretch' justify='flex-start' gap='xl'>
      <SegmentedControl value={activeTab} onChange={handleTabChange} data={TAB_DATA} fullWidth />

      <Box hidden={activeTab !== 'rent'} aria-hidden={activeTab !== 'rent'}>
        <RentManagement members={members} totalOutstanding={totalOutstanding} />
      </Box>

      <Box hidden={activeTab !== 'members'} aria-hidden={activeTab !== 'members'}>
        {visitedTab.members && (
          <Suspense fallback={<LoadingBox loadingText='Loading members...' forComponent='MembersManagement' />}>
            <MembersManagement />
          </Suspense>
        )}
      </Box>
    </Stack>
  );
};
