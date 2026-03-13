import { useMyNavigation } from '../../../../shared/hooks';
import { useMember } from '../../../../contexts';
import { Accordion, Group, HoverCard, Stack, Title, Text, Alert, Button } from '@mantine/core';
import { MemberDetailsList } from '../tab-navigation/member-menagement/components/MemberDetailsList';
import { IconUpi, IconQrCode } from '../../../../shared/icons';
import { RentDetailsList } from '../tab-navigation/rent-management/components/RentDetailsList';
import { getStatusAlertConfig, StatusBadge } from '../../../../shared/utils';
import dayjs from 'dayjs';
import { MyAlert } from '../../../../shared/components';
import { useEffect, useEffectEvent, useState } from 'react';
import type { RentHistory } from '../../../../data/types';
import { fetchRentHistoryForMember } from '../../../../services';

const useMemberDetails = () => {
    const { memberId } = useMyNavigation();
    // TODO: Add loading state for member
    const member = useMember(memberId!);
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<RentHistory[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);

    const loadHistoryEvent = useEffectEvent(async () => {
        setLoading(true);
        const data = await fetchRentHistoryForMember.fetch({ memberId: memberId!, page });
        setHistoryData(data);
        console.log(data);
        setLoading(false);

    });

    useEffect(() => {
        if (showHistory) {
            loadHistoryEvent();
        }
    }, [showHistory]);

    return {
        memberId,
        member,
        showHistory,
        setShowHistory,
        historyData,
        loading
    };
};

export const MemberDetailsPage = () => {
    const { memberId, member, showHistory, setShowHistory, historyData, loading } = useMemberDetails();
    if (!memberId || !member) return <div>Member Not Found</div>;
    const currentMonthRent = member.currentMonthRent;
    const alertConfig = getStatusAlertConfig(currentMonthRent.status);

    return (
        <>
            <Accordion variant='contained' key={memberId}>
                <Accordion.Item value={memberId}>
                    <Accordion.Control>
                        <Title order={5}>My Details</Title>
                    </Accordion.Control>
                    <Accordion.Panel>
                        <MemberDetailsList member={member} />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
            <Stack gap='md'>
                <Title order={4}>Rent for {dayjs(currentMonthRent.id).format('MMMM YYYY')}</Title>

                <RentDetailsList rentHistory={currentMonthRent} />

                {/* Status Alert with Pay Button */}

                <MyAlert Icon={alertConfig.icon} title={alertConfig.title} color={alertConfig.color} variant='light'>
                    <Text size='sm'>{alertConfig.message}</Text>
                </MyAlert>
            </Stack>

            {/* Rent History Section */}
            {/* History Accordion with Empty State Handling (requirement 5.6) */}
            {/* {showHistory && (
                <>
                    {historyData.length > 0 ?
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
                    : historyData.length === 0 && loading.history ?
                        null
                    :   <Alert color='blue' variant='light'>
                            <Text size='sm' ta='center'>
                                No rent history available yet. Your payment history will appear here once you have more
                                than one month of records.
                            </Text>
                        </Alert>
                    }
                </>
            )} */}

            {/* Smart History Button */}
            <Group justify='center'>
                <Button onClick={() => setShowHistory((prev) => !prev)}>
                    {showHistory ? 'Hide History' : 'Load History'}
                </Button>
            </Group>
        </>
    );
};
