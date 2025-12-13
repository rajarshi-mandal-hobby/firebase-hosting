import { SegmentedControl, Stack } from '@mantine/core';
import { Activity, startTransition, useState } from 'react';
import { RentManagement } from '../../rent';
import { MembersManagement } from '../../members/components/MembersManagement';

export type Tab = 'rent' | 'members';

const TAB_DATA: { label: string; value: Tab }[] = [
  { label: 'Rent', value: 'rent' },
  { label: 'Members', value: 'members' }
];

export const TabNavigation = () => {
  const [activeTab, setActiveTab] = useState<Tab>('rent');

  console.log('Rendering TabNavigation');

  return (
    <Stack align="stretch" justify="flex-start" gap="xl">
      <SegmentedControl
        value={activeTab}
        onChange={(value) => startTransition(() => setActiveTab(value as Tab))}
        data={TAB_DATA}
      />

      <Activity mode={activeTab === 'rent' ? 'visible' : 'hidden'}>
        <RentManagement />
      </Activity>

      <Activity mode={activeTab === 'members' ? 'visible' : 'hidden'}>
        <MembersManagement />
      </Activity>
    </Stack>
  );
};
