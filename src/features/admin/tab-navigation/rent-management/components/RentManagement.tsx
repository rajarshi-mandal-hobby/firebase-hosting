import { Menu, ActionIcon, Stack, Title, Progress, Accordion, Center, Group, Text } from '@mantine/core';
import { useMembers } from '../../../../../data/services/membersService';
import { type Member, ACTION_BUTTON_SIZE, ACTION_ICON_SIZE, DEFAULT_SVG_SIZE } from '../../../../../data/types';
import {
    GroupIcon,
    MyAvatar,
    RentDetailsList,
    LoadingBox,
    ErrorContainer,
    NothingToShow,
    SuspenseBox
} from '../../../../../shared/components';
import {
    IconMoreVertical,
    IconWhatsapp,
    IconShare,
    IconUniversalCurrency,
    IconMoneyBag
} from '../../../../../shared/icons';
import { lazyImport, StatusBadge, toIndianLocale } from '../../../../../shared/utils';
import { DisplayPriorityIconOnError } from '../../../../../shared/components/DisplayPriorityIconOnError';
import { type MessagesPlatform, type DerivedRents, useRentManagement } from '../hooks/useRentManagement';
import { useGlobalModal, type ModalType } from '../../../stores/modal-store';

const RecordPaymentModal = lazyImport(() => import('./modals/RecordPaymentModal'), 'RecordPaymentModal');
const AddExpenseModal = lazyImport(() => import('./modals/AddExpenseModal'), 'AddExpenseModal');

interface RentContentMenuProps {
    member: Member;
    handleShareRent: (member: Member, platform: MessagesPlatform) => void;
    openRecordPayment: () => void;
    openAddExpense: () => void;
}

function RentContentMenu({ member, handleShareRent, openRecordPayment, openAddExpense }: RentContentMenuProps) {
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
                    leftSection={<IconWhatsapp size={DEFAULT_SVG_SIZE} />}
                >
                    WhatsApp
                </Menu.Item>
                <Menu.Item
                    onClick={() => handleShareRent(member, 'share')}
                    leftSection={<IconShare size={DEFAULT_SVG_SIZE} />}
                >
                    Share
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                    leftSection={<IconUniversalCurrency size={DEFAULT_SVG_SIZE} />}
                    rightSection={<DisplayPriorityIconOnError showIcon={useErrorForModal('recordPayment')} />}
                    onClick={() => onModalOpen(member, 'recordPayment', openRecordPayment)}
                >
                    Record Payment
                </Menu.Item>
                <Menu.Item
                    leftSection={<IconMoneyBag size={DEFAULT_SVG_SIZE} />}
                    rightSection={<DisplayPriorityIconOnError showIcon={useErrorForModal('addExpense')} />}
                    onClick={() => onModalOpen(member, 'addExpense', openAddExpense)}
                >
                    Add Expense
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    );
}

function RentProgress({ derivedRents }: { derivedRents: DerivedRents }) {
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
}

interface RentManagementContentProps {
    members: Member[];
}

function RentManagementContent({ members }: RentManagementContentProps) {
    const {
        recordPaymentModal: { recordPaymentModalOpened, openRecordPayment, closeRecordPayment },
        addExpenseModal: { addExpenseModalOpened, openAddExpense, closeAddExpense },
        derivedRents,
        handleShareRent
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

            <SuspenseBox>
                <RecordPaymentModal opened={recordPaymentModalOpened} onClose={closeRecordPayment} />
                <AddExpenseModal opened={addExpenseModalOpened} onClose={closeAddExpense} />
            </SuspenseBox>
        </>
    );
}

export function RentManagement() {
    // Active members only
    const { members, isLoading, error, refresh } = useMembers();

    console.log('🎨 Rendering RentManagement', members, isLoading, error);

    if (isLoading) {
        return <LoadingBox />;
    }

    if (error) {
        return <ErrorContainer error={error} onRetry={refresh} />;
    }

    if (members.length) {
        return <RentManagementContent members={members} />;
    }
    // For empty state
    return <NothingToShow message='No members found. Why not add one first?' />;
}
