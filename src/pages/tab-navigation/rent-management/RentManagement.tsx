import { Accordion, Center, Group, Stack, Title, Badge } from '@mantine/core';
import { useMembers } from '../../../contexts';
import type { Member } from '../../../data/types';
import {
    ContainedAccordion,
    MyAvatar,
    StatusThemeIcon,
    LoadingBox,
    ErrorContainer,
    NothingToShow
} from '../../../shared/components';
import { useRefreshKey } from '../../../shared/hooks';
import { getPaymentStatusColor, toIndianLocale } from '../../../shared/utils';
import { RentContentMenu } from './components/RentContentMenu';
import { RentDetailsList } from './components/RentDetailsList';
import { RentProgress } from './components/RentProgress';

interface RentContentProps {
    members: Member[];
}

const RentContent = ({ members }: RentContentProps) => {
    console.log('🎨 Rendering RentManagementContent');

    return (
        <>
            <RentProgress members={members} />

            <ContainedAccordion>
                {members.map((member) => {
                    const key = 'rent_content_' + member.id;
                    return (
                        <Accordion.Item key={key} value={member.id}>
                            <Center>
                                <Accordion.Control>
                                    <Group mr='xs'>
                                        <MyAvatar name={member.name} size='md' />
                                        <Stack gap={2}>
                                            <Title order={5} lineClamp={1}>
                                                {member.name}
                                            </Title>
                                            <Badge
                                                variant='gradient'
                                                gradient={{
                                                    from: `${getPaymentStatusColor(member.currentMonthRent.status)}.0`,
                                                    to: 'gray.3'
                                                }}
                                                c={`gray.7`}
                                                leftSection={
                                                    <StatusThemeIcon
                                                        size={16}
                                                        paymentStatus={member.currentMonthRent.status}
                                                    />
                                                }
                                                pl={2}
                                            >
                                                {toIndianLocale(member.currentMonthRent.outstanding)}
                                            </Badge>
                                        </Stack>
                                    </Group>
                                </Accordion.Control>
                                <RentContentMenu member={member} />
                            </Center>
                            <Accordion.Panel>
                                <RentDetailsList rentHistory={member.currentMonthRent} memberId={member.id} />
                            </Accordion.Panel>
                        </Accordion.Item>
                    );
                })}
            </ContainedAccordion>
        </>
    );
};

export function RentManagement() {
    const { members, isLoading, error } = useMembers();
    const [refreshKey, handleRefresh] = useRefreshKey();

    if (isLoading) return <LoadingBox message='Loading members...' />;

    if (error) return <ErrorContainer error={error} onRetry={handleRefresh} />;

    return members.length ?
            <RentContent members={members} key={refreshKey} />
        :   <NothingToShow message='No members found. Why not add one first?' />;
}
