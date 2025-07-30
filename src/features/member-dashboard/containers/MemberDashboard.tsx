import { SegmentedControl, Group, Text, ActionIcon, Stack, Alert, Loader } from '@mantine/core';
import { useState, useCallback, Suspense, lazy } from 'react';
import { mockCurrentUser } from '../../../data/mock/mockData';
import { useMemberDashboardData } from '../hooks/useMemberDashboardData';
import { SharedAvatar, AppContainer, IconLogout } from '../../../shared/components';
import { MemberProfile } from '../components/MemberProfile';

import { LoadingBox } from '../../../shared/components/LoadingBox';

const FriendsSection = lazy(() => import('../components/FriendsSection.tsx'));

export function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('me');

  // Use the cached hook for data management
  const { currentMember, errors, actions, cache } = useMemberDashboardData();

  // Handle tab changes with proper data loading
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // Load friends data only when Friends tab is accessed
      if (value === 'friends') {
        if (cache.friendsLoaded) return; // Already loaded
        actions.loadFriendsData();
      }
    },
    [actions, cache.friendsLoaded]
  );

  // Early return if there's an error
  if (errors.dashboard) {
    return (
      <AppContainer>
        <Alert color='red' title='Error Loading Data'>
          {errors.dashboard}
        </Alert>
      </AppContainer>
    );
  }

  // Early return if member data is not loaded yet
  if (!currentMember) {
    return (
      <AppContainer>
        <LoadingBox loadingText='Loading your Dashboard...' fullScreen />
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Stack gap='lg'>
        {/* Header with Member Info and Sign Out */}
        <Group justify='space-between'>
          <Group>
            <SharedAvatar name={currentMember.name} src={null} size='md' />
            <Stack gap={0}>
              <Text size='md' fw={500}>
                {currentMember.name}
              </Text>
              <Text size='xs' c='dimmed'>
                {mockCurrentUser.email}
              </Text>
            </Stack>
          </Group>

          <ActionIcon color='red.6' aria-label='Sign out'>
            <IconLogout size={16} />
          </ActionIcon>
        </Group>

        {/* Main Navigation Tabs */}
        <SegmentedControl
          mb='md'
          value={activeTab}
          onChange={handleTabChange}
          data={[
            { label: 'Me', value: 'me' },
            { label: 'Friends', value: 'friends' },
          ]}
          fullWidth
        />

        {/* Active Panel Content */}
        {activeTab === 'me' && <MemberProfile />}

        {activeTab === 'friends' && (
          <Suspense
            fallback={
              <Group justify='center'>
                <Loader size='sm' />
                <Text size='sm' c='dimmed'>
                  Loading friends section...
                </Text>
              </Group>
            }>
            <FriendsSection />
          </Suspense>
        )}
      </Stack>
    </AppContainer>
  );
}
