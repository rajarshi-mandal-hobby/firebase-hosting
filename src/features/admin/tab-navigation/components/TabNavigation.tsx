import { SegmentedControl, Stack } from '@mantine/core';
import { Activity, startTransition, useState } from 'react';
import { RentManagement } from '../../../rent';
import type { Tab } from '../hooks/useTabNavigation';
import { MembersManagement } from '../../../members/components/MembersManagement';

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

      <Activity mode={active === 'rent' ? 'visible' : 'hidden'}>
        <RentManagement />
      </Activity>

      <Activity mode={active === 'members' ? 'visible' : 'hidden'}>
        <MembersManagement />
      </Activity>
    </Stack>
  );
};
