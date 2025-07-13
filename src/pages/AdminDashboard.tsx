import { SegmentedControl, Group, Text, Stack, ActionIcon, Title } from '@mantine/core';
import { useState } from 'react';
import { RentManagement } from '../features/rent/components/RentManagement';
import { MembersManagement } from '../features/members/components/MembersManagement';
import { ConfigManagement } from '../features/config/components/ConfigManagement';
import { AppContainer, SharedAvatar } from '../shared/components';
import { mockAdminUser } from '../data/mockData';
import { IconLogout } from '../shared/components/icons';
import { useRentManagementData } from '../features/rent/hooks/useRentManagementData';
import { useMemberManagementData } from '../features/members/hooks/useMemberManagementData';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rent');

  // Lift data to dashboard level so it persists across tab switches
  const rentData = useRentManagementData();
  const memberData = useMemberManagementData();

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'rent':
        return <RentManagement rentData={rentData} />;
      case 'members':
        return <MembersManagement memberData={memberData} />;
      case 'config':
        return <ConfigManagement />;
      default:
        return <RentManagement rentData={rentData} />;
    }
  };

  return (
    <AppContainer>
      <Stack gap='lg'>
        {/* Header with Admin Info and Sign Out */}
        <Group justify='space-between'>
          <Group>
            <SharedAvatar name={mockAdminUser.displayName} src={mockAdminUser.photoURL} size='md' />
            <Stack gap={0}>
              <Title size='md'>{mockAdminUser.displayName || 'Admin'}</Title>
              <Text size='xs' c='dimmed'>
                {mockAdminUser.email}
              </Text>
            </Stack>
          </Group>

          <ActionIcon color='red.6' aria-label='Sign out'>
            <IconLogout size={16} />
          </ActionIcon>
        </Group>

        <SegmentedControl
          mb='md'
          value={activeTab}
          onChange={setActiveTab}
          data={[
            { label: 'Rent', value: 'rent' },
            { label: 'Members', value: 'members' },
            { label: 'Config', value: 'config' },
          ]}
          fullWidth
        />

        {renderActivePanel()}
      </Stack>
    </AppContainer>
  );
}
