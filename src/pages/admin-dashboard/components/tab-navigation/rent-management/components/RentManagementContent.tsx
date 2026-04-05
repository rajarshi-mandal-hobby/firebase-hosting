import { Menu, ActionIcon, Stack, Title, Progress, Accordion, Center, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useGlobalErrorData } from '../../../../../../contexts';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE } from '../../../../../../data/types';
import {
    DisplayPriorityIconOnError,
    GroupIcon,
    ContainedAccordion,
    MyAvatar
} from '../../../../../../shared/components';
import { useActivityMountedKey, useMyNavigation } from '../../../../../../shared/hooks';
import {
    IconMoreVertical,
    IconWhatsapp,
    IconShare,
    IconUniversalCurrency,
    IconMoneyBag,
    IconHistory
} from '../../../../../../shared/icons';
import { StatusBadge, toIndianLocale } from '../../../../../../shared/utils';
import { type MessagesPlatform, type DerivedRents, useRentManagementContent } from '../hooks/useRentManagementContent';
import { AddExpenseModal } from '../modals/AddExpenseModal';
import { RecordPaymentModal } from '../modals/RecordPaymentModal';
import { RentDetailsList } from './RentDetailsList';

const useRentContentMenu = ({ member }: { member: Member }) => {
    const { setSelectedMember, hasErrorForMemberAndForm } = useGlobalErrorData();
    const hasErrorForRecordPayment = hasErrorForMemberAndForm(member.id, 'record-payment');
    const hasErrorForAddExpense = hasErrorForMemberAndForm(member.id, 'add-expense');
    const hasErrorForMember = hasErrorForRecordPayment || hasErrorForAddExpense;

    const { navigateTo } = useMyNavigation();

    const key = useActivityMountedKey('rent-activity');

    return {
        hasErrorForMember,
        hasErrorForRecordPayment,
        hasErrorForAddExpense,
        setSelectedMember,
        key,
        handleHistory: () => navigateTo('member-details', { memberid: member.id })
    };
};

interface RentContentMenuProps {
    member: Member;
    handleShareRent: (member: Member, platform: MessagesPlatform) => void;
    openRecordPayment: () => void;
    openAddExpense: () => void;
}

const RentContentMenu = ({ member, handleShareRent, openRecordPayment, openAddExpense }: RentContentMenuProps) => {
    const {
        hasErrorForMember,
        hasErrorForRecordPayment,
        hasErrorForAddExpense,
        setSelectedMember,
        key,
        handleHistory
    } = useRentContentMenu({ member });

    return (
        <Menu key={key}>
            <Menu.Target>
                <ActionIcon variant='white' size={ACTION_BUTTON_SIZE} c={hasErrorForMember ? 'red' : undefined}>
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='dimmed' fz='sm' tt='full-width'>
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
                <Menu.Divider />
                <Menu.Label>Actions</Menu.Label>
                <Menu.Item
                    leftSection={<IconMoneyBag />}
                    rightSection={<DisplayPriorityIconOnError showIcon={hasErrorForRecordPayment} />}
                    onClick={() => {
                        setSelectedMember(member);
                        openRecordPayment();
                    }}
                >
                    Record Payment
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconUniversalCurrency />}
                    rightSection={<DisplayPriorityIconOnError showIcon={hasErrorForAddExpense} />}
                    onClick={() => {
                        setSelectedMember(member);
                        openAddExpense();
                    }}
                >
                    Add Expense
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item leftSection={<IconHistory />} onClick={handleHistory}>
                    History
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

interface RentProgressProps {
    derivedRents: DerivedRents;
}

const RentProgress = ({ derivedRents }: RentProgressProps) => (
    <Stack my='md' gap={0}>
        <GroupIcon>
            <StatusBadge status={derivedRents.totalOutstanding > 0 ? 'Due' : 'Paid'} size={16} />
            <Title order={4} c='dimmed' fw={300}>
                Total Rent: {toIndianLocale(derivedRents.totalRent)}
            </Title>
        </GroupIcon>
        <Progress.Root size='xl'>
            <Progress.Section value={derivedRents.totalPaidPercentage} color='gray.4'>
                <Progress.Label c='gray.7'>{toIndianLocale(derivedRents.totalPaid)}</Progress.Label>
            </Progress.Section>
            {/* <Progress.Section value={derivedRents.totalPartialPercentage} color='orange'>
						<Progress.Label c='orange.1'>{derivedRents.totalPartial.toIndianLocale()}</Progress.Label>
					</Progress.Section> */}
            <Progress.Section
                value={derivedRents.totalOutstandingPercentage + derivedRents.totalPartialPercentage}
                color='red'
            >
                <Progress.Label c='red.1'>
                    {toIndianLocale(derivedRents.totalOutstanding + derivedRents.totalPartial)}
                </Progress.Label>
            </Progress.Section>
        </Progress.Root>
    </Stack>
);

interface RentManagementContentProps {
    members: Member[];
}

export const RentManagementContent = ({ members }: RentManagementContentProps) => {
    const {
        derivedRents,
        actions: { handleScrollToItem, handleShareRent }
    } = useRentManagementContent(members);
    const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
    const [addExpenseModalOpened, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);

    console.log('🎨 Rendering RentManagementContent');

    return (
        <>
            <RentProgress derivedRents={derivedRents} />

            <ContainedAccordion>
                {members.map((member) => {
                    return (
                        <Accordion.Item key={member.id + '_rent'} value={member.id + '_rent'}>
                            <Center>
                                <Accordion.Control aria-label={member.name} onTransitionEnd={handleScrollToItem}>
                                    <Group wrap='nowrap' mr='xs'>
                                        <MyAvatar name={member.name} size='md' />
                                        <Stack gap={0}>
                                            <Title order={5} lineClamp={1}>
                                                {member.name}
                                            </Title>
                                            <GroupIcon>
                                                <Text fw={500}>
                                                    {toIndianLocale(member.currentMonthRent.currentOutstanding)}
                                                </Text>
                                                <StatusBadge size={14} status={member.currentMonthRent.status} />
                                            </GroupIcon>
                                        </Stack>
                                    </Group>
                                </Accordion.Control>
                                <RentContentMenu
                                    member={member}
                                    openAddExpense={openAddExpense}
                                    openRecordPayment={openRecordPayment}
                                    handleShareRent={handleShareRent}
                                />
                            </Center>
                            <Accordion.Panel>
                                <RentDetailsList rentHistory={member.currentMonthRent} />
                            </Accordion.Panel>
                        </Accordion.Item>
                    );
                })}
            </ContainedAccordion>

            <RecordPaymentModal opened={recordPaymentModalOpened} onClose={closeRecordPayment} />
            <AddExpenseModal opened={addExpenseModalOpened} onClose={closeAddExpense} />
        </>
    );
};
