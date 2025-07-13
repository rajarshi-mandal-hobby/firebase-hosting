import { Accordion, Button, Group, Stack, Text, Title } from '@mantine/core';
import { useState } from 'react';
import { CurrencyFormatter, SharedAvatar, StatusBadge, RentDetailsList } from '../../../shared/components';
import type { UseRentManagementData } from '../hooks/useRentManagementData';
import { GenerateBillsModal, RecordPaymentModal, AddExpenseModal } from './modals';

interface RentManagementProps {
  rentData: UseRentManagementData;
}

export function RentManagement({ rentData }: RentManagementProps) {
  const { membersWithBills, totalOutstanding, error, actions, cache } = rentData;
  const [generateBillsModal, setGenerateBillsModal] = useState(false);
  const [recordPaymentModal, setRecordPaymentModal] = useState(false);
  const [addExpenseModal, setAddExpenseModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; outstandingBalance: number } | null>(null);

  // Early return if there's an error
  if (error) {
    return (
      <Stack gap='lg' align='center'>
        <Text c='red'>Error: {error}</Text>
        <Button onClick={actions.refetch} variant='outline'>
          Retry
        </Button>
      </Stack>
    );
  }

  // Show loading while initial data is being fetched (exactly like MemberDashboard pattern)
  if (!cache.rentLoaded) {
    return (
      <Stack gap='lg'>
        <Text>Loading...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap='lg'>
      <Group justify='space-between'>
        <Title order={5}>
          Total Outstanding: <CurrencyFormatter value={totalOutstanding} />
        </Title>
        <Group>
          <Button onClick={() => setGenerateBillsModal(true)}>Generate Bills</Button>
        </Group>
      </Group>

      <Accordion>
        {membersWithBills.map(({ member, latestHistory }) => {
          return (
            <Accordion.Item key={member.id} value={member.id}>
              <Accordion.Control>
                <Group justify='space-between' wrap='nowrap'>
                  <Group justify='flex-start' wrap='nowrap'>
                    <SharedAvatar name={member.name} size='md' />
                    <Title order={5} lineClamp={1}>
                      {member.name}
                    </Title>
                  </Group>
                  <Group justify='flex-start' wrap='nowrap' pr='md' gap='xs'>
                    {latestHistory && <StatusBadge status={latestHistory.status} size={16} />}
                    <CurrencyFormatter value={member.outstandingBalance} />
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                {latestHistory ? (
                  <RentDetailsList data={latestHistory} showStatus={false} />
                ) : (
                  <Text c='dimmed'>No billing history available</Text>
                )}
                <Group mt='md'>
                  <Button
                    variant='default'
                    size='xs'
                    onClick={() => {
                      setSelectedMember({ name: member.name, outstandingBalance: member.outstandingBalance });
                      setRecordPaymentModal(true);
                    }}>
                    Record Payment
                  </Button>
                  <Button
                    variant='default'
                    size='xs'
                    onClick={() => {
                      setSelectedMember({ name: member.name, outstandingBalance: member.outstandingBalance });
                      setAddExpenseModal(true);
                    }}>
                    Add Expense
                  </Button>
                </Group>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      {/* Modals */}
      <GenerateBillsModal opened={generateBillsModal} onClose={() => setGenerateBillsModal(false)} />

      <RecordPaymentModal
        opened={recordPaymentModal}
        onClose={() => {
          setRecordPaymentModal(false);
          setSelectedMember(null);
        }}
        memberName={selectedMember?.name}
        outstandingAmount={selectedMember?.outstandingBalance}
      />

      <AddExpenseModal
        opened={addExpenseModal}
        onClose={() => {
          setAddExpenseModal(false);
          setSelectedMember(null);
        }}
        memberName={selectedMember?.name}
      />
    </Stack>
  );
}
