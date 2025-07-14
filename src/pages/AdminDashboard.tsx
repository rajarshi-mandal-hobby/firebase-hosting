import { SegmentedControl, Group, Text, Stack, ActionIcon, Title } from '@mantine/core';
import { useState, useEffect } from 'react';
import { RentManagement } from '../features/rent/components/RentManagement';
import { MembersManagement } from '../features/members/components/MembersManagement';
import { ConfigManagement } from '../features/config/components/ConfigManagement';
import { AppContainer, SharedAvatar } from '../shared/components';
import { useData } from '../contexts/DataProvider';
import { IconLogout } from '../shared/components/icons';
import { useRentManagementData } from '../features/rent/hooks/useRentManagementData';
import { useMemberManagementData } from '../features/members/hooks/useMemberManagementData';
import type { AdminConfig } from '../shared/types/firestore-types';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('rent');
  const { getAdminConfig } = useData();
  
  // Get admin config for displaying admin info
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  
  useEffect(() => {
    getAdminConfig().then(setAdminConfig).catch(console.error);
  }, [getAdminConfig]);

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
            <SharedAvatar 
              name={adminConfig?.list[0]?.email.split('@')[0] || 'Admin'} 
              src={undefined} 
              size='md' 
            />
            <Stack gap={0}>
              <Title size='md'>{adminConfig?.list[0]?.email.split('@')[0] || 'Admin'}</Title>
              <Text size='xs' c='dimmed'>
                {adminConfig?.list[0]?.email || 'Loading...'}
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
