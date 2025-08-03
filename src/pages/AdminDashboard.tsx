import { SegmentedControl, Group, Text, Stack, ActionIcon, Title } from '@mantine/core';
import { RentManagement } from '../features/rent/components/RentManagement';
import { MembersManagement } from '../features/members/components/MembersManagement';
import { ConfigManagement } from '../features/config/components/ConfigManagement';
import { AppContainer, SharedAvatar } from '../shared/components';
import { IconLogout } from '../shared/components/icons';
import {
  AdminDashboardProvider,
  useAdminDashboardContext,
  AdminPerformanceMonitor,
  AdminPerformanceDashboard,
} from '../contexts/hooks/AdminDashboardContext';

function AdminDashboardContent() {
  const { data: adminData, actions } = useAdminDashboardContext();

  const handleTabChange = (value: string) => {
    actions.setActiveTab(value as any);
  };

  return (
    <AppContainer>
      <Stack gap='lg'>
        {/* Header with Admin Info and Sign Out */}
        <Group justify='space-between'>
          <Group>
            <SharedAvatar
              name={adminData.adminInfo?.list[0]?.email.split('@')[0] ?? 'Admin'}
              src={undefined}
              size='md'
            />
            <Stack gap={0}>
              <Title size='md'>{adminData.adminInfo?.list[0]?.email.split('@')[0] ?? 'Admin'}</Title>
              <Text size='xs' c='dimmed'>
                {adminData.adminInfo?.list[0]?.email ?? 'Loading...'}
              </Text>
            </Stack>
          </Group>

          <Group>
            <ActionIcon
              color='blue.6'
              aria-label='Reset performance metrics'
              onClick={() => actions.resetPerformanceStats()}
              size='sm'>
              🔄
            </ActionIcon>
            <ActionIcon color='red.6' aria-label='Sign out'>
              <IconLogout size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <SegmentedControl
          mb='md'
          value={adminData.activeTab}
          onChange={handleTabChange}
          data={[
            { label: 'Rent', value: 'rent' },
            { label: 'Members', value: 'members' },
            { label: 'Config', value: 'config' },
          ]}
          fullWidth
        />

        {/* Use CSS visibility pattern instead of conditional rendering for performance */}
        <div style={{ display: adminData.activeTab === 'rent' ? 'block' : 'none' }}>
          <RentManagement rentData={adminData.rentData} />
        </div>

        <div style={{ display: adminData.activeTab === 'members' ? 'block' : 'none' }}>
          <MembersManagement />
        </div>

        <div style={{ display: adminData.activeTab === 'config' ? 'block' : 'none' }}>
          <ConfigManagement />
        </div>
      </Stack>
    </AppContainer>
  );
}

export function AdminDashboard() {
  return (
    <AdminDashboardProvider
      enablePerformanceMonitoring={process.env.NODE_ENV === 'development'}
      enableAdvancedStabilization={true}
      enableDebugLogging={process.env.NODE_ENV === 'development'}>
      <AdminPerformanceMonitor id='AdminDashboard'>
        <AdminDashboardContent />
      </AdminPerformanceMonitor>
      {process.env.NODE_ENV === 'development' && <AdminPerformanceDashboard />}
    </AdminDashboardProvider>
  );
}
