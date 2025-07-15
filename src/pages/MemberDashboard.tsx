import {
  SegmentedControl,
  Group,
  Text,
  ActionIcon,
  Stack,
  Button,
  rem,
  Accordion,
  Alert,
  Title,
  Divider,
  HoverCard,
  Space,
  Loader,
} from '@mantine/core';
import { lazy, useState, useCallback, useMemo, Suspense, useEffect } from 'react';
import { mockCurrentUser } from '../data/mock/mockData';
import { useMemberDashboardData } from '../hooks';
import { SharedAvatar, IconPhone, IconBed, AppContainer, IconLogout, MemberDetailsList, RentDetailsList, IconUpi, IconQrCode, CurrencyFormatter, StatusBadge } from '../shared/components';
import type { Member, UPIPaymentParams } from '../shared/types/firestore-types';
import { getStatusAlertConfig } from '../shared/utils';
import { useData } from '../hooks';


// Lazy load the Friends section for better performance
const FriendsSection = lazy(() =>
  Promise.resolve({
    default: ({ members, isLoading }: { members: Member[]; isLoading: boolean }) => (
      <Stack gap='lg'>
        <Title order={4}>Active Friends</Title>
        {isLoading ? (
          <Group justify='center'>
            <Loader size='sm' />
            <Text size='sm' c='dimmed'>
              Loading friends...
            </Text>
          </Group>
        ) : (
          members.map((member, i) => (
            <Group key={member.id} mt={i === 0 ? 0 : 'xs'}>
              <SharedAvatar name={member.name} src={null} />
              <Stack gap={0}>
                <Title order={5}>{member.name}</Title>
                <Group gap={rem(4)} align='center'>
                  <IconPhone size={16} color='dimmed' />
                  <Text size='sm' c='dimmed' component='a' href={`tel:${member.phone}`}>
                    {member.phone}
                  </Text>
                  <Space w='sm' />
                  <IconBed size={16} color='dimmed' />
                  <Text size='sm' c='dimmed'>
                    {member.floor} - {member.bedType}
                  </Text>
                </Group>
              </Stack>
            </Group>
          ))
        )}
      </Stack>
    ),
  })
);

export function MemberDashboard() {
  const [activeTab, setActiveTab] = useState('me');
  const [showHistory, setShowHistory] = useState(false);
  const { getGlobalSettings } = useData();
  const [globalSettings, setGlobalSettings] = useState<{ upiVpa: string } | null>(null);

  // Load global settings for UPI
  useEffect(() => {
    getGlobalSettings().then(settings => {
      setGlobalSettings(settings);
    }).catch(console.error);
  }, [getGlobalSettings]);

  // Use the cached hook for data management
  const { currentMember, currentMonthHistory, otherMembers, historyData, loading, error, actions } =
    useMemberDashboardData();

  const upiUri = (amount: number, name: string): string => {
    const upiParams: UPIPaymentParams = {
      pa: `${globalSettings?.upiVpa ?? '+918777529394'}@paytm`, // UPI ID from global settings
      pn: 'Rajarshi', // Payee name (e.g., "Rent Payment")
      am: amount, // Amount
      cu: 'INR', // Currency (e.g., "INR")
      tn: `${name}'s paying the rent of ${amount}`,
    };
    return encodeURIComponent(
      `upi://pay?pa=${upiParams.pa}&pn=${upiParams.pn}&am=${upiParams.am}&cu=${upiParams.cu}&tn=${upiParams.tn}`
    );
  };

  // Handle tab changes and trigger lazy loading
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // Friends are auto-loaded in the new implementation
    },
    [setActiveTab]
  );

  // Handle history loading
  const handleLoadHistory = useCallback(() => {
    setShowHistory((prev) => {
      const newValue = !prev;
      if (newValue) {
        actions.loadHistory();
      }
      return newValue;
    });
  }, [actions]);

  const formatMonthYear = useCallback((id: string) => {
    const [year, month] = id.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
    });
  }, []);

  // Memoize computed values to prevent unnecessary recalculations
  const isPaymentDisabled = useMemo(
    () => currentMonthHistory?.status === 'Paid' || currentMonthHistory?.status === 'Overpaid',
    [currentMonthHistory?.status]
  );

  const alertConfig = useMemo(
    () => (currentMonthHistory?.status ? getStatusAlertConfig(currentMonthHistory.status) : null),
    [currentMonthHistory?.status]
  );

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

        {activeTab === 'me' && (
          <>
            {/* Member Details Section - Collapsible */}
            <Accordion variant='contained' defaultValue={null}>
              <Accordion.Item value='details'>
                <Accordion.Control>
                  <Title order={5}>My Details</Title>
                </Accordion.Control>
                <Accordion.Panel>
                  <MemberDetailsList member={currentMember} />
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>

            {/* Current Month Rent Section */}
            <Stack gap='md'>
              <Title order={4}>
                Rent for {currentMonthHistory ? formatMonthYear(currentMonthHistory.id) : 'Current Month'}
              </Title>

              {currentMonthHistory && <RentDetailsList data={currentMonthHistory} showStatus={true} />}

              {/* Status Alert with Pay Button */}
              {alertConfig && (
                <>
                  <Group justify='flex-end' align='center' gap='lg'>
                    <HoverCard width={280} shadow='md' withArrow>
                      <HoverCard.Target>
                        <Group gap='xs' style={{ cursor: 'pointer' }}>
                          <IconUpi size={48} />
                          <IconQrCode size={20} />
                        </Group>
                      </HoverCard.Target>
                      <HoverCard.Dropdown>
                        <Text size='sm'>
                          The 'Pay' button simply opens your UPI app—just like scanning a QR code. It does not track
                          payment status. After completing the payment, please send a screenshot to Rajarshi for
                          verification
                        </Text>
                      </HoverCard.Dropdown>
                    </HoverCard>
                    <Button
                      disabled={isPaymentDisabled}
                      lts={'0.1em'}
                      component='a'
                      href={
                        isPaymentDisabled || !currentMonthHistory
                          ? undefined
                          : upiUri(currentMonthHistory.currentOutstanding, currentMember.name)
                      }>
                      <CurrencyFormatter value={currentMonthHistory?.currentOutstanding ?? 0} prefix='Pay ₹' />
                    </Button>
                  </Group>

                  <Alert icon={alertConfig.icon} title={alertConfig.title} color={alertConfig.color} variant='light'>
                    {/* <Stack gap='xs'> */}
                    <Text size='sm'>{alertConfig.message}</Text>
                    {currentMonthHistory?.status === 'Due' && currentMonthHistory?.currentOutstanding > 0 && (
                      <Text size='xs' fw={500}>
                        Send screenshot to Rajarshi for confirmation.
                      </Text>
                    )}
                    {/* </Stack> */}
                  </Alert>
                </>
              )}
            </Stack>

            <Divider />

            {/* History Section */}
            <Group justify='center'>
              <Button loading={loading.history} onClick={handleLoadHistory}>
                Show History (12 Months)
              </Button>
            </Group>

            {/* History Accordion */}
            {showHistory && (
              <Accordion variant='contained'>
                {historyData.map((history) => (
                  <Accordion.Item key={history.id} value={history.id}>
                    <Accordion.Control icon={<StatusBadge status={history.status} size={16} />}>
                      <Group justify='space-between' pr='md'>
                        <Title order={5}>{formatMonthYear(history.id)}</Title>
                        <Text>
                          <CurrencyFormatter value={history.currentOutstanding} />
                        </Text>
                      </Group>
                    </Accordion.Control>
                    <Accordion.Panel>
                      <RentDetailsList data={history} />
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            )}
          </>
        )}

        {/* Friends Section */}
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
            <FriendsSection members={otherMembers} isLoading={loading.friends} />
          </Suspense>
        )}
      </Stack>
    </AppContainer>
  );
}
