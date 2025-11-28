import { Accordion, Alert, Text, Group, Button, Title } from '@mantine/core';
import { RentDetailsList, StatusBadge, CurrencyFormatter } from '../../../shared/components';
import type { RentHistory } from '../../../shared/types/firestore-types';

interface RentHistorySectionProps {
  showHistory: boolean;
  historyData: RentHistory[];
  hasMoreHistory: boolean;
  loading: boolean;
  historyButtonConfig: {
    text: string;
    disabled: boolean;
  };
  formatMonthYear: (id: string) => string;
  onHistoryButtonClick: () => void;
}

export function RentHistorySection({
  showHistory,
  historyData,
  loading,
  historyButtonConfig,
  formatMonthYear,
  onHistoryButtonClick,
}: RentHistorySectionProps) {
  return (
    <>
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
                    <RentDetailsList rentHistory={history} />
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
        <Button loading={loading} onClick={onHistoryButtonClick} disabled={historyButtonConfig.disabled}>
          {historyButtonConfig.text}
        </Button>
      </Group>
    </>
  );
}
