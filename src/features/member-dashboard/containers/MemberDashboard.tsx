import { SegmentedControl, Group, Text, ActionIcon, Stack, Alert } from '@mantine/core';
import { useState, Suspense, lazy, Profiler } from 'react';
import { mockCurrentUser } from '../../../data/mock/mockData';
import { SharedAvatar, AppContainer, IconLogout } from '../../../shared/components';
import { MemberProfile } from '../components/MemberProfile';
import { LoadingBox } from '../../../shared/components/LoadingBox';
import { useAppContext } from '../../../contexts/AppContext.tsx';

// Lazy load
const FriendsSection = lazy(() => import('../components/FriendsSection'));

export function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('me');
  const [showHistoryState, setShowHistoryState] = useState(false);

  const { memberDashboardOps } = useAppContext();
  const { dashboardData, errors, getOtherActiveMembers } = memberDashboardOps;

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    // Load friends data only when Friends tab is accessed
    if (value === 'friends' && dashboardData.otherMembers.length === 0) {
      getOtherActiveMembers();
    }
  };

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
  if (!dashboardData.member) {
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
            <SharedAvatar name={dashboardData.member.name} src={null} size='md' />
            <Stack gap={0}>
              <Text size='md' fw={500}>
                {dashboardData.member.name}
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
        {activeTab === 'me' && (
          <MemberProfile
            showHistoryState={showHistoryState}
            setShowHistoryState={setShowHistoryState}
            memberDashboardOps={memberDashboardOps}
          />
        )}

        {activeTab === 'friends' && (
          <Suspense fallback={<LoadingBox loadingText='Loading friends...' />}>
            <FriendsSection memberDashboardOps={memberDashboardOps} />
          </Suspense>
        )}
      </Stack>
    </AppContainer>
  );
}
