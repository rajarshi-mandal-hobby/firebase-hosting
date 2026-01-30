import { Accordion, Progress, Stack, Title, Center, Group, Menu, ActionIcon, Text } from '@mantine/core';
import { useMembers } from '../../../../data/services/membersService';
import { ACTION_BUTTON_SIZE, ACTION_ICON_SIZE, ICON_SIZE, type Member } from '../../../../data/types';
import {
    GroupIcon,
    MyAvatar,
    RentDetailsList,
    LoadingBox,
    NothingToShow,
    ErrorContainer
} from '../../../../shared/components';
import {
    IconMoreVertical,
    IconWhatsapp,
    IconShare,
    IconUniversalCurrency,
    IconMoneyBag
} from '../../../../shared/icons';
import { toIndianLocale, StatusBadge } from '../../../../shared/utils';
import { useRentManagement, type DerivedRents, type MessagesPlatform } from '../hooks/useRentManagement';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import type { UseErrorCache } from '../../tab-navigation/hooks/useErrorCache';
import { AddExpenseModal } from './modals/AddExpenseModal';
import { DisplayPriorityIcon } from './shared/DisplayPriorityIcon';
import { useGlobalModal, type ModalType } from '../../stores/modal-store';

interface RentManagementContentProps extends UseErrorCache {
    members: Member[];
}

interface RentContentMenuProps {
    member: Member;
    handleShareRent: (member: Member, platform: MessagesPlatform) => void;
    openRecordPayment: () => void;
    openAddExpense: () => void;
}

const RentContentMenu = ({ member, handleShareRent, openRecordPayment, openAddExpense }: RentContentMenuProps) => {
    const { useHasErrorForMember, useHasErrorForModal, onModalOpen } = useGlobalModal();
    const hasErrorForMember = useHasErrorForMember(member.id);
    const useErrorForModal = (modal: ModalType) => useHasErrorForModal(member.id, modal);

    return (
        <Menu>
            <Menu.Target>
                <ActionIcon
                    variant='white'
                    autoContrast
                    size={ACTION_BUTTON_SIZE}
                    bdrs={'0 var(--mantine-radius-md) var(--mantine-radius-md) 0'}
                    c={hasErrorForMember ? 'red' : 'var(--mantine-color-bright)'}
                >
                    <IconMoreVertical size={ACTION_ICON_SIZE} />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                <Menu.Label c='dimmed' fz='sm' tt='full-width'>
                    {member.name.split(' ')[0]}
                </Menu.Label>
                <Menu.Divider />
                <Menu.Label>Share Rent</Menu.Label>
                <Menu.Item
                    onClick={() => handleShareRent(member, 'whatsapp')}
                    leftSection={<IconWhatsapp size={ICON_SIZE} />}
                >
                    WhatsApp
                </Menu.Item>
                <Menu.Item
                    onClick={() => handleShareRent(member, 'share')}
                    leftSection={<IconShare size={ICON_SIZE} />}
                >
                    Share
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    leftSection={<IconUniversalCurrency size={ICON_SIZE} />}
                    rightSection={<DisplayPriorityIcon showIcon={useErrorForModal('recordPayment')} />}
                    onClick={() => onModalOpen(member, 'recordPayment', openRecordPayment)}
                >
                    Record Payment
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconMoneyBag size={ICON_SIZE} />}
                    rightSection={<DisplayPriorityIcon showIcon={useErrorForModal('addExpense')} />}
                    onClick={() => onModalOpen(member, 'addExpense', openAddExpense)}
                >
                    Add Expense
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
};

const RentProgress = ({ derivedRents }: { derivedRents: DerivedRents }) => {
    return (
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
};

const RentManagementContent = ({ members, ...errorCacheOptions }: RentManagementContentProps) => {
    const {
        recordPaymentModal: { recordPaymentModalOpened, openRecordPayment, closeRecordPayment },
        addExpenseModal: { addExpenseModalOpened, openAddExpense, closeAddExpense },
        derivedRents,
        handleShareRent,
        modalActions
    } = useRentManagement({ members });

    console.log('🎨 Rendering RentManagementContent');

    return (
        <>
            <RentProgress derivedRents={derivedRents} />

            <Accordion>
                {members.map((member) => {
                    return (
                        <Accordion.Item key={member.id} value={member.id}>
                            <Center>
                                <Accordion.Control aria-label={member.name}>
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
                                                <StatusBadge status={member.currentMonthRent.status} size={14} />
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
            </Accordion>

            <RecordPaymentModal opened={recordPaymentModalOpened} onClose={closeRecordPayment} />

            <AddExpenseModal
                opened={addExpenseModalOpened}
                onClose={closeAddExpense}
                memberId={modalActions.selectedMember?.id || ''}
                memberName={modalActions.selectedMember?.name || ''}
                previousExpenses={modalActions.selectedMember?.currentMonthRent.expenses || []}
                {...modalActions}
                {...errorCacheOptions}
            />
        </>
    );
};

export function RentManagement(useErrorOptions: UseErrorCache) {
    // Active members only
    const { members, isLoading, error, refresh } = useMembers('active');

    console.log('🎨 Rendering RentManagement');

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} onRetry={refresh} />;
    }

    if (members.length) {
        return <RentManagementContent members={members} {...useErrorOptions} />;
    } else {
        // For empty state
        return <NothingToShow message='No members found. Why not add one first?' />;
    }
}
