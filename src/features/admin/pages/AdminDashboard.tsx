import { Group, Text, Stack, Title } from '@mantine/core';
import { TabNavigation } from '../tab-navigation/TabNavigation';
import { AdminMenu } from './shared-components';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingBox, MyAvatar } from '../../../shared/components';

export const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const adminEmail = user?.email || '';
  const adminName = user?.displayName || 'Admin';

  if (loading) {
    return <LoadingBox />;
  }

  console.log('🎨 Rendering AdminDashboard');

  return (
    <Stack gap="lg" align="stretch" justify="center" p="md">
      {/* Header with Admin Info and Sign Out */}
      <Group justify="space-between" align="center">
        <Group gap="xs" align="center">
          <MyAvatar name={adminName} src={user?.photoURL} size={40} />
          <Stack align="flex-start" justify="center" gap={0}>
            <Title order={4}>{adminName}</Title>
            <Text size="xs" c="dimmed">
              {adminEmail}
            </Text>
          </Stack>
        </Group>

        {/* Admin Menu */}
        <AdminMenu />
      </Group>

      {/* Tab Navigation */}
      <TabNavigation />
    </Stack>
  );
};
