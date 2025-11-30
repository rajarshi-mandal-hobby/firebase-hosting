import { Box, SegmentedControl, Stack } from '@mantine/core';
import { Activity, lazy, startTransition, Suspense, useState } from 'react';
import { LoadingBox, LoaderSleeping } from '../../../../shared/components/LoadingBox';
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
  //   const { activeTab, visitedTab, handleTabChange } = useTabNavigation();
  const [active, setActive] = useState<Tab>('rent');

  console.log('Rendering TabNavigation');

  return (
    <Stack align='stretch' justify='flex-start' gap='xl'>
      <SegmentedControl
        value={active}
        onChange={(value) => startTransition(() => setActive(value as Tab))}
        data={TAB_DATA}
        fullWidth
      />

      {/* <Box hidden={activeTab !== 'rent'} aria-hidden={activeTab !== 'rent'}> */}
      <Activity mode={active === 'rent' ? 'visible' : 'hidden'}>
        <RentManagement />
      </Activity>
      {/* </Box> */}

      {/* <Box hidden={activeTab !== 'members'} aria-hidden={activeTab !== 'members'}> */}
      {/* {visitedTab.members && ( */}
      <Activity mode={active === 'members' ? 'visible' : 'hidden'}>
        {/* <Suspense fallback={<LoaderSleeping componentName='Members Management' />}> */}
          <MembersManagement />
        {/* </Suspense> */}
      </Activity>
      {/* )} */}
      {/* </Box> */}
    </Stack>
  );
};
