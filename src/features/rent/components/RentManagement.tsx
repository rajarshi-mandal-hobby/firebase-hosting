import { Stack, Accordion, Center, Group, Title, ActionIcon, Text, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useState } from 'react';
import { SharedAvatar, RentDetailsList, StatusIndicator, StatusBadge } from '../../../shared/components';
import type { Member } from '../../../shared/types/firestore-types';
import { formatNumberIndianLocale } from '../../../shared/utils';
import {
  IconCall,
  IconMoneyBag,
  IconMoreVertical,
  IconShare,
  IconUniversalCurrency,
  IconWhatsapp,
} from '../../../shared/icons';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import { AddExpenseModal } from './modals/AddExpenseModal';

interface RentManagementProps {
  members: Member[];
  totalOutstanding: number;
}

export function RentManagement({ members, totalOutstanding }: RentManagementProps) {
  const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
  const [addExpenseModal, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  console.log('Rendering RentManagement', selectedMember);
  return (
    <Stack>
      <Group gap='xs'>
        <Text fw={500} fz='md'>
          Total Outstanding:
        </Text>
        <Text fz='md' fw={700} variant='light'>
          {formatNumberIndianLocale(totalOutstanding)}
        </Text>
        <StatusBadge status={totalOutstanding > 0 ? 'Due' : 'Paid'} size={16} />
      </Group>

      <Accordion>
        {members.map((member) => {
          return (
            <Accordion.Item key={member.id} value={member.id}>
              <Center bdrs='lg' style={{ overflow: 'hidden' }}>
                <Accordion.Control>
                  <Group wrap='nowrap'>
                    <StatusIndicator status={member.currentMonthRent.status} position='top-right'>
                      <SharedAvatar name={member.name} size='md' />
                    </StatusIndicator>
                    <Stack gap={0}>
                      <Title order={5} lineClamp={1}>
                        {member.name}
                      </Title>
                      <Text size='sm' fw={500}>
                        {formatNumberIndianLocale(member.currentMonthRent.currentOutstanding)}
                      </Text>
                    </Stack>
                  </Group>
                </Accordion.Control>
                <Menu shadow='md' width={200} position='left-start' withArrow arrowPosition='center'>
                  <Menu.Target>
                    <ActionIcon
                      mr='sm'
                      variant='white'
                      autoContrast
                      size={32}
                      style={{
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      }}>
                      <IconMoreVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label c='var(--mantine-text-color)' fz='sm' tt='full-width'>
                      {member.name.split(' ')[0]}
                    </Menu.Label>
                    <Menu.Divider />
                    <Menu.Label>Share Rent</Menu.Label>
                    <Menu.Item
                      onClick={() => {
                        const phoneNumber = member.phone; // Replace with the desired phone number (include country code, no +, no spaces)
                        const message = `Hello ${member.name.split(' ')[0]}, you have an outstanding rent balance of ₹${
                          member.currentMonthRent.currentOutstanding
                        }. Please make the payment at your earliest convenience.`; // Pre-fill with desired message
                        // Construct the WhatsApp URL
                        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

                        // Open WhatsApp in a new tab/window
                        window.open(whatsappUrl, '_blank');
                      }}
                      leftSection={<IconWhatsapp size={14} />}>
                      WhatsApp
                    </Menu.Item>
                    <Menu.Item
                      onClick={() => {
                        navigator.share({
                          text: `Hello ${member.name.split(' ')[0]}, you have an outstanding rent balance of ₹${
                            member.currentMonthRent.currentOutstanding
                          }. Please make the payment at your earliest convenience.`,
                        });
                      }}
                      leftSection={<IconShare size={14} />}>
                      Share
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconCall size={14} />}
                      onClick={() => {
                        window.location.href = `tel:${member.phone}`;
                      }}>
                      Call
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      leftSection={<IconUniversalCurrency size={14} />}
                      onClick={() => {
                        setSelectedMember(member);
                        openRecordPayment();
                      }}>
                      Record Payment
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconMoneyBag size={14} />}
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

      {/* <GenerateBillsModal members={members} opened={generateBillsOpened} onClose={closeGenerateBills} /> */}

      <RecordPaymentModal
        opened={recordPaymentModalOpened}
        onClose={() => {
          setSelectedMember(null);
          closeRecordPayment();
        }}
        memberName={selectedMember?.name || ''}
        outstandingAmount={selectedMember?.currentMonthRent.currentOutstanding || 0}
        totalCharges={selectedMember?.currentMonthRent.totalCharges || 0}
        amountPaid={selectedMember?.currentMonthRent.amountPaid || 0}
        paymentNote={selectedMember?.currentMonthRent.outstandingNote || ''}
      />

      <AddExpenseModal
        opened={addExpenseModal}
        onClose={() => {
          closeAddExpense();
          setSelectedMember(null);
        }}
        memberName={selectedMember?.name}
        initialExpenses={selectedMember?.currentMonthRent.expenses}
      />
    </Stack>
  );
}
