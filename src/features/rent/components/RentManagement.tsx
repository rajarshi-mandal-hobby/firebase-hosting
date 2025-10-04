import { Accordion, Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { Suspense, useState, lazy, Children, type ReactElement, cloneElement, isValidElement, type SVGProps, type ReactNode } from 'react';
import { CurrencyFormatter, SharedAvatar, StatusBadge, RentDetailsList } from '../../../shared/components';

import { RecordPaymentModal, AddExpenseModal, GenerateBillsModal } from './modals';
import { useRentManagementData } from '../hooks';
import { LoadingBox } from '../../../shared/components/LoadingBox';
import { RetryBox } from '../../../shared/components/RetryBox';
import { useDisclosure } from '@mantine/hooks';
import React from 'react';

export function RentManagement() {
  const { members, isLoading, totalOutstanding, error, actions } = useRentManagementData();
  const [generateBillsOpened, { open: openGenerateBills, close: closeGenerateBills }] = useDisclosure(false);
  const [recordPaymentModal, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
  const [addExpenseModal, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);
  const [selectedMember, setSelectedMember] = useState<{ name: string; outstandingBalance: number } | null>(null);

  console.log('🎨 Rendering RentManagement');

  // Early return if there's an error
  if (error) {
    return <RetryBox error={error || 'Failed to load members'} handleRetry={actions.handleRetry} loading={isLoading} />;
  }

  if (isLoading) {
    return (
      <Stack gap='lg'>
        <Group justify='space-between'>
          <Title order={5}>
            <Skeleton visible={isLoading}>
              Total Outstanding:
              <CurrencyFormatter value={totalOutstanding} />
            </Skeleton>
          </Title>

          <Group>
            <Button onClick={openGenerateBills}>Generate Bills</Button>
          </Group>
        </Group>
        <LoadingBox loadingText='Loading members...' />
      </Stack>
    );
  }

  return (
    <Stack gap='lg'>
      <Group justify='space-between'>
        <Title order={5}>
          Total Outstanding:
          <Skeleton visible={isLoading}>
            <CurrencyFormatter value={totalOutstanding} />
          </Skeleton>
        </Title>
        <Group>
          <Button onClick={openGenerateBills}>Generate Bills</Button>
        </Group>
      </Group>

      <Accordion>
        {members.map((member) => {
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
                    {member.currentMonthRent && <StatusBadge status={member.currentMonthRent.status} size={16} />}
                    <CurrencyFormatter value={member.currentMonthRent.currentOutstanding} />
                  </Group>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                {member.currentMonthRent ? (
                  <RentDetailsList data={member.currentMonthRent} showStatus={false} />
                ) : (
                  <Text c='dimmed'>No billing history available</Text>
                )}
                <Group mt='md'>
                  <Button
                    variant='default'
                    size='xs'
                    onClick={() => {
                      setSelectedMember({
                        name: member.name,
                        outstandingBalance: member.currentMonthRent.currentOutstanding,
                      });
                      openRecordPayment();
                    }}>
                    Record Payment
                  </Button>
                  <Button
                    variant='default'
                    size='xs'
                    onClick={() => {
                      setSelectedMember({
                        name: member.name,
                        outstandingBalance: member.currentMonthRent.currentOutstanding,
                      });
                      openAddExpense();
                    }}>
                    Add Expense
                  </Button>
                </Group>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>

      <Suspense fallback={<LoadingBox loadingText='Loading bill tools...' />}>
        <GenerateBillsModal members={members} opened={generateBillsOpened} onClose={closeGenerateBills} />
      </Suspense>

      {/* <RecordPaymentModal
        opened={recordPaymentModal}
        onClose={() => {
          closeRecordPayment();
          setSelectedMember(null);
        }}
        memberName={selectedMember?.name}
        outstandingAmount={selectedMember?.outstandingBalance}
      /> */}

      {/* <AddExpenseModal
        opened={addExpenseModal}
        onClose={() => {
          closeAddExpense();
          setSelectedMember(null);
        }}
        memberName={selectedMember?.name}
      /> */}
    </Stack>
  );
}
