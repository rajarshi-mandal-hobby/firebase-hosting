import { Accordion, Center, Group, Stack, Title, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMembers } from '../../../../../contexts';
import type { Member } from '../../../../../data/types';
import {
    LoadingBox,
    ErrorContainer,
    SuspenseBox,
    NothingToShow,
    ContainedAccordion,
    GroupIcon,
    MyAvatar
} from '../../../../../shared/components';
import { useRefreshKey } from '../../../../../shared/hooks';
import { toIndianLocale, StatusBadge } from '../../../../../shared/utils';
import { RentDetailsList } from './components/RentDetailsList';
import { AddExpenseModal } from './modals/AddExpenseModal';
import { RecordPaymentModal } from './modals/RecordPaymentModal';
import { RentProgress } from './components/RentProgress';
import { RentContentMenu } from './components/RentContentMenu';
import type { Tab } from '../TabNavigation';

interface RentManagementContentProps {
    members: Member[];
    activeTab: Tab;
}

const RentManagementContent = ({ members, activeTab }: RentManagementContentProps) => {
    const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
    const [addExpenseModalOpened, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);

    console.log('🎨 Rendering RentManagementContent');

    return (
        <>
            <RentProgress members={members} />

            <ContainedAccordion>
                {members.map((member) => {
                    const key = `rent_${member.id}`;
                    return (
                        <Accordion.Item key={key} value={key}>
                            <Center>
                                <Accordion.Control>
                                    <Group mr='xs'>
                                        <MyAvatar name={member.name} size='md' />
                                        <Stack gap={0}>
                                            <Title order={5} lineClamp={1}>
                                                {member.name}
                                            </Title>
                                            <GroupIcon>
                                                <Text fw={500}>
                                                    {toIndianLocale(member.currentMonthRent.outstanding)}
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
                                    activeTab={activeTab}
                                />
                            </Center>
                            <Accordion.Panel>
                                <RentDetailsList rentHistory={member.currentMonthRent} memberId={member.id} />
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

export const RentManagement = ({ activeTab }: { activeTab: Tab }) => {
    const { members, isLoading, error } = useMembers();
    const [refreshKey, handleRefresh] = useRefreshKey();

    if (isLoading) return <LoadingBox />;

    if (error) return <ErrorContainer error={error} onRetry={handleRefresh} />;

    return members.length ?
            <SuspenseBox key={refreshKey}>
                <RentManagementContent {...{ activeTab, members }} />
            </SuspenseBox>
        :   <NothingToShow message='No members found. Why not add one first?' />;
};
