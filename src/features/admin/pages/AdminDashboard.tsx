import { Group, Text, Stack, ActionIcon, Title } from '@mantine/core';
import { SharedAvatar } from '../../../shared/components';
import { IconLogout } from '../../../shared/components/icons';
import { useAuth } from '../../../contexts/useAuth';
import { TabNavigation } from '../tab-navigation/components/TabNavigation';

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const adminEmail = user?.email || '';
  const adminName = user?.name || 'Admin';

  return (
     <Stack gap='lg'>
        {/* Header with Admin Info and Sign Out */}
        <Group justify='space-between'>
          <Group>
            <SharedAvatar name={adminName} src={user?.photoURL} size='md' />
            <Stack gap={0}>
              <Title size='md'>{adminName}</Title>
              <Text size='xs' c='dimmed'>
                {adminEmail}
              </Text>
            </Stack>
          </Group>

          <Group>
            <ActionIcon color='red.6' aria-label='Sign out' onClick={signOut}>
              <IconLogout size={16} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Tab Navigation */}
        <TabNavigation />
      </Stack>
  );
};
