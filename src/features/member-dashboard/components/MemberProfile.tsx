import { Accordion, Alert, Button, Divider, Group, HoverCard, Stack, Title, Text } from '@mantine/core';
import type { UPIPaymentParams } from '../../../shared/types/firestore-types';
import {
  MemberDetailsList,
  RentDetailsList,
  IconUpi,
  IconQrCode,
  CurrencyFormatter,
  StatusBadge,
} from '../../../shared/components';
import { useCallback, useMemo, useState } from 'react';
import { getStatusAlertConfig } from '../../../shared/utils';
import { useMemberDashboardData } from '../hooks/useMemberDashboardData';

export function MemberProfile() {
  // Get all data directly from the hook - no more prop drilling!
  const { currentMember, currentMonthHistory, historyData, hasMoreHistory, loading, actions, upi } =
    useMemberDashboardData();

  // Local state for showing history
  const [showHistory, setShowHistory] = useState(false);

  // Format month year helper function
  const formatMonthYear = useCallback((id: string): string => {
    const [year, month] = id.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }, []);

  // History button configuration
  const historyButtonConfig = useMemo(() => {
    if (!showHistory) {
      return { text: 'Load History', disabled: false };
    }
    if (hasMoreHistory) {
      return { text: 'Load More', disabled: false };
    }
    return { text: 'All History Loaded', disabled: true };
  }, [showHistory, hasMoreHistory]);

  // Handle history button click
  const handleHistoryButtonClick = useCallback(() => {
    if (!showHistory) {
      setShowHistory(true);
      actions.loadHistory();
    } else if (hasMoreHistory) {
      actions.loadMoreHistory();
    }
  }, [showHistory, hasMoreHistory, actions]);

  // Simple UPI URI generation using admin's UPI data (Requirements: 4.1, 4.2, 4.5, 4.6)
  const generateUPIUri = useCallback(
    (amount: number, memberName: string, billingMonth: string): string => {
      if (!upi?.vpa || !upi?.payeeName) {
        return '#'; // Fallback if UPI data not available
      }

      const upiParams: UPIPaymentParams = {
        pa: upi.vpa, // Admin's UPI VPA (where members send payment)
        pn: upi.payeeName, // Admin's name (who receives payment)
        am: amount,
        cu: 'INR',
        tn: `Rent ${billingMonth} - ${memberName}`, // Clear transaction note with billing month
      };

      // Generate clean UPI URI
      const params = new URLSearchParams({
        pa: upiParams.pa,
        pn: upiParams.pn,
        am: upiParams.am.toString(),
        cu: upiParams.cu,
        tn: upiParams.tn,
      });

      return `upi://pay?${params.toString()}`;
    },
    [upi]
  );

  const isPaymentDisabled = useMemo(
    () => currentMonthHistory?.status === 'Paid' || currentMonthHistory?.status === 'Overpaid',
    [currentMonthHistory?.status]
  );

  const alertConfig = useMemo(
    () => (currentMonthHistory?.status ? getStatusAlertConfig(currentMonthHistory.status) : null),
    [currentMonthHistory?.status]
  );

  // Early return if member data is not loaded yet
  if (!currentMember) {
    return null; // Let parent component handle loading state
  }

  return (
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
                    The 'Pay' button simply opens your UPI app—just like scanning a QR code. It does not track payment
                    status. After completing the payment, please send a screenshot to {upi?.payeeName || 'admin'} for
                    verification.
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
                    : generateUPIUri(currentMonthHistory.currentOutstanding, currentMember.name, currentMonthHistory.id)
                }>
                <CurrencyFormatter value={currentMonthHistory?.currentOutstanding ?? 0} prefix='Pay ₹' />
              </Button>
            </Group>

            <Alert icon={alertConfig.icon} title={alertConfig.title} color={alertConfig.color} variant='light'>
              <Text size='sm'>{alertConfig.message}</Text>
              {currentMonthHistory?.status === 'Due' && currentMonthHistory?.currentOutstanding > 0 && (
                <Text size='xs' fw={500}>
                  Send screenshot to {upi?.payeeName || 'admin'} for confirmation.
                </Text>
              )}
            </Alert>
          </>
        )}
      </Stack>

      <Divider />

      {/* Rent History Section */}
      {/* History Accordion with Empty State Handling (requirement 5.6) */}
      {showHistory && (
        <>
          {historyData.length > 0 ? (
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
          ) : (
            <Alert color='blue' variant='light'>
              <Text size='sm' ta='center'>
                No rent history available yet. Your payment history will appear here once you have more than one month
                of records.
              </Text>
            </Alert>
          )}
        </>
      )}

      {/* Smart History Button */}
      <Group justify='center'>
        <Button loading={loading.history} onClick={handleHistoryButtonClick} disabled={historyButtonConfig.disabled}>
          {historyButtonConfig.text}
        </Button>
      </Group>
    </>
  );
}
