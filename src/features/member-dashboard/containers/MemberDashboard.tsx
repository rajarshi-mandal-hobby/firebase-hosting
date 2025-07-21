import { SegmentedControl, Group, Text, ActionIcon, Stack, Alert, Loader } from '@mantine/core';
import { useState, useCallback, useMemo, Suspense } from 'react';
import { mockCurrentUser } from '../../../data/mock/mockData';
import { useMemberDashboardData } from '../hooks/useMemberDashboardData';
import { SharedAvatar, AppContainer, IconLogout } from '../../../shared/components';
import { useAppContext } from '../../../contexts/AppContext';
import { MemberProfile } from '../components/MemberProfile';
import { FriendsSection } from '../components/FriendsSection';

export function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('me');
  const [showHistory, setShowHistory] = useState(false);
  const { globalSettings } = useAppContext();

  // Use the cached hook for data management
  const {
    currentMember,
    currentMonthHistory,
    otherMembers, // Used in FriendsSection component
    historyData,
    hasMoreHistory,
    loading,
    error,
    actions,
    cache,
  } = useMemberDashboardData();

  // Member data loads automatically via the hook

  // Handle tab changes with lazy loading
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);

      // Load friends data only when Friends tab is accessed
      if (value === 'friends') {
        actions.loadFriendsData();
      }
    },
    [setActiveTab, actions]
  );

  // Smart history button handler that manages all states
  const handleHistoryButton = useCallback(() => {
    if (!showHistory) {
      // Show history - load initial data if not loaded
      if (!cache.historyLoaded) {
        actions.loadHistory();
      }
      setShowHistory(true);
    } else if (hasMoreHistory) {
      // Load more history data
      actions.loadMoreHistory();
    } else {
      // Hide history
      setShowHistory(false);
    }
  }, [showHistory, cache.historyLoaded, hasMoreHistory, actions]);

  const formatMonthYear = useCallback((id: string) => {
    const [year, month] = id.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  }, []);

  // Smart button configuration based on current state
  const historyButtonConfig = useMemo(() => {
    if (!showHistory) {
      return {
        text: 'Show History',
        disabled: false,
      };
    } else if (hasMoreHistory) {
      return {
        text: 'Load More History',
        disabled: false,
      };
    } else {
      return {
        text: 'Showing all histroy',
        disabled: true,
      };
    }
  }, [showHistory, hasMoreHistory]);

  // Early return if there's an error
  if (error) {
    return (
      <AppContainer>
        <Alert color='red' title='Error Loading Data'>
          {error}
        </Alert>
      </AppContainer>
    );
  }

  // Early return if member data is not loaded yet
  if (!currentMember) {
    return (
      <AppContainer>
        <Group justify='center'>
          <Loader size='sm' />
          <Text>Loading member data...</Text>
        </Group>
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
        {activeTab === 'me' && currentMember && (
          <MemberProfile
            member={currentMember}
            currentMonthHistory={currentMonthHistory}
            historyData={historyData}
            showHistory={showHistory}
            hasMoreHistory={hasMoreHistory}
            loading={loading.history}
            historyButtonConfig={historyButtonConfig}
            globalSettings={globalSettings}
            formatMonthYear={formatMonthYear}
            onHistoryButtonClick={handleHistoryButton}
          />
        )}

        {activeTab === 'friends' && (
          <Suspense
            fallback={
              <Group justify='center'>
                <Loader size='sm' />
                <Text size='sm' c='dimmed'>
                  Loading friends section...
                </Text>
              </Group>
            }
          >
            <FriendsSection members={otherMembers} isLoading={loading.friends} />
          </Suspense>
        )}
      </Stack>
    </AppContainer>
  );
}
