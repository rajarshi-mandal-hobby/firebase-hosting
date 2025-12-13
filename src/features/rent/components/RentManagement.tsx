import { Stack, Accordion, Center, Group, Title, ActionIcon, Text, Menu, Paper, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import {
  RentDetailsList,
  StatusBadge,
  LoadingBox,
  NothingToShow,
  MyAvatar,
  GroupIcon
} from '../../../shared/components';
import type { Member } from '../../../shared/types/firestore-types';
import { formatNumberIndianLocale } from '../../../shared/utils';
import {
  IconCall,
  IconMoneyBag,
  IconMoreVertical,
  IconShare,
  IconUniversalCurrency,
  IconWhatsapp
} from '../../../shared/icons';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import { AddExpenseModal } from './modals/AddExpenseModal';
import { useRentManagement } from '../hooks/useRentManagement';
import { ErrorContainer } from '../../../shared/components/ErrorContainer';
import dayjs from 'dayjs';
import { notifyError } from '../../../utils/notifications';

type MessagesPlatform = 'whatsapp' | 'share';

export const RentManagement = () => {
  const { members, isLoading, totalOutstanding, error, actions } = useRentManagement();
  const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
  const [addExpenseModal, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const handleShareRent = async (member: Member, platform: MessagesPlatform) => {
    const phoneNumber = member.phone;
    let message = `Hi ${member.name.split(' ')[0]}, *${dayjs(member.currentMonthRent.id).format('MMMM YYYY')}* rent is *${formatNumberIndianLocale(
      member.currentMonthRent.currentOutstanding
    )}*.`;
    message += `\r\n*Details:*`;
    message += `\r\n- Rent: ${formatNumberIndianLocale(member.currentMonthRent.rent)}`;
    message += `\r\n- Electricity: ${formatNumberIndianLocale(member.currentMonthRent.electricity)}`;
    message += `\r\n- Wi-Fi: ${formatNumberIndianLocale(member.currentMonthRent.wifi)}`;
    if (member.currentMonthRent.previousOutstanding > 0) {
      message += `\r\n- Previous Outstanding: ${formatNumberIndianLocale(member.currentMonthRent.previousOutstanding)}`;
    }
    if (member.currentMonthRent.expenses.length > 0) {
      message += `\r\n- Expenses: ${member.currentMonthRent.expenses.map(({ amount, description }) => `${description}: ${formatNumberIndianLocale(amount)}`).join(', ')}`;
    }
    message += `\r\nPlease make the payment within 10th of this month.`;
    if (platform === 'whatsapp') {
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } else {
      try {
        await navigator.share({
          title: 'Rent Details of ' + member.name,
          text: message
        });
      } catch (error) {
        notifyError(error instanceof Error ? error.message : 'Failed to share rent');
      }
    }
  };

  if (isLoading) {
    return <LoadingBox />;
  }

  if (error) {
    return <ErrorContainer error={error} onRetry={actions.handleRefetch} />;
  }

  if (members && !isLoading && !error) {
    return (
      <>
        <Paper withBorder p="md">
          <GroupIcon justify="center">
            <StatusBadge status={totalOutstanding > 0 ? 'Due' : 'Paid'} size={16} />
            <Title order={5}>Total Outstanding: {formatNumberIndianLocale(totalOutstanding)}</Title>
          </GroupIcon>
        </Paper>

        <Accordion>
          {members.map((member) => {
            return (
              <Accordion.Item key={member.id} value={member.name}>
                <Center>
                  <Accordion.Control aria-label={member.name}>
                    <Group wrap="nowrap" mr="xs">
                      <MyAvatar name={member.name} size="md" />
                      <Stack gap={0}>
                        <Title order={5} lineClamp={1}>
                          {member.name}
                        </Title>
                        <GroupIcon>
                          <Text fw={500}>{formatNumberIndianLocale(member.currentMonthRent.currentOutstanding)}</Text>
                          <StatusBadge status={member.currentMonthRent.status} size={14} />
                        </GroupIcon>
                      </Stack>
                    </Group>
                  </Accordion.Control>
                  <Menu>
                    <Menu.Target>
                      <Box h="100%">
                        <ActionIcon variant="white" autoContrast size={32}>
                          <IconMoreVertical size={16} />
                        </ActionIcon>
                      </Box>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Label c="var(--mantine-text-color)" fz="sm" tt="full-width">
                        {member.name.split(' ')[0]}
                      </Menu.Label>
                      <Menu.Divider />
                      <Menu.Label>Share Rent</Menu.Label>
                      <Menu.Item onClick={() => handleShareRent(member, 'whatsapp')} leftSection={<IconWhatsapp />}>
                        WhatsApp
                      </Menu.Item>
                      <Menu.Item onClick={() => handleShareRent(member, 'share')} leftSection={<IconShare />}>
                        Share
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconCall />}
                        onClick={() => {
                          window.location.href = `tel:${member.phone}`;
                        }}>
                        Call
                      </Menu.Item>
                      <Menu.Divider />
                      <Menu.Item
                        leftSection={<IconUniversalCurrency />}
                        onClick={() => {
                          setSelectedMember(member);
                          openRecordPayment();
                        }}>
                        Record Payment
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconMoneyBag />}
                        onClick={() => {
                          setSelectedMember(member);
                          openAddExpense();
                        }}>
                        Add Expense
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Center>
                <Accordion.Panel>
                  <RentDetailsList rentHistory={member.currentMonthRent} />
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>

        <RecordPaymentModal
          opened={recordPaymentModalOpened}
          onClose={closeRecordPayment}
          onExitTransitionEnd={() => {
            setSelectedMember(null);
          }}
          memberName={selectedMember?.name || ''}
          outstandingAmount={selectedMember?.currentMonthRent.currentOutstanding || 0}
          totalCharges={selectedMember?.currentMonthRent.totalCharges || 0}
          amountPaid={selectedMember?.currentMonthRent.amountPaid || 0}
          paymentNote={selectedMember?.currentMonthRent.outstandingNote || ''}
        />

        <AddExpenseModal
          opened={addExpenseModal}
          onClose={closeAddExpense}
          onExitTransitionEnd={() => {
            setSelectedMember(null);
          }}
          memberName={selectedMember?.name || ''}
          initialExpenses={selectedMember?.currentMonthRent.expenses || []}
        />
      </>
    );
  }

  // For empty state
  return <NothingToShow message="No members found" />;
};
