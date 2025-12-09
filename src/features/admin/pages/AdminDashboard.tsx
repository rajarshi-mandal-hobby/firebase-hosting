import { Group, Text, Stack, Title } from '@mantine/core';
import { SharedAvatar } from '../../../shared/components';
import { TabNavigation } from '../tab-navigation/components/TabNavigation';
import { AdminMenu } from './shared-components/AdminMenu';
import { useAuth } from '../../../contexts/AuthContext';
import { LoadingBox } from '../../../shared/components/LoadingBox';

export const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const adminEmail = user?.email || '';
  const adminName = user?.displayName || 'Admin';

  if (loading) {
    return <LoadingBox />;
  }

  console.log('🎨 Rendering AdminDashboard');

  return (
    <Stack gap='lg' align='stretch' justify='center' p='md'>
      {/* Header with Admin Info and Sign Out */}
      <Group justify='space-between' align='center'>
        <Group gap='xs' align='center'>
          <SharedAvatar name={adminName} src={user?.photoURL} size={40} />
          <Stack align='flex-start' justify='center' gap={0}>
            <Title order={4}>{adminName}</Title>
            <Text size='xs' c='dimmed'>
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
