import { Stack, Button, Collapse, Title, Paper, Accordion, ThemeIcon, Text, ActionIcon } from '@mantine/core';
import classesAccordion from './Accordion.module.css';
import dayjs from 'dayjs';
import { useState, useEffectEvent, startTransition, useEffect, useRef } from 'react';
import { useMember } from '../../../../contexts';
import type { Member } from '../../../../data/types';
import { fetchHistoryPage } from '../../../../services';
import {
    GroupSpaceApart,
    GroupIcon,
    MyThemeIcon,
    MyAlert,
    LoadingBox,
    NothingToShow
} from '../../../../shared/components';
import { useAccordionScrollToView, useMyNavigation } from '../../../../shared/hooks';
import { IconInfo, IconPerson, IconClose, IconReceiptLong, IconHistory } from '../../../../shared/icons';
import { getStatusAlertConfig, StatusBadge } from '../../../../shared/utils';
import { MemberDetailsList } from '../tab-navigation/member-menagement/components/MemberDetailsList';
import { RentDetailsList } from '../tab-navigation/rent-management/components/RentDetailsList';

interface MemberDetailsContentProps {
    member: Member;
}

const useMemberDetailsContent = ({ member }: MemberDetailsContentProps) => {
    const [showHistory, setShowHistory] = useState(false);
    const [rentHistory, setRentHistory] = useState<any[]>([]);
    const cursorRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [showDetails, setShowDetails] = useState(false);

    const handleScrollToItem = useAccordionScrollToView();

    const loadHistoryEvent = useEffectEvent(async () => {
        if (!showHistory || loading || !hasMore) return;

        startTransition(async () => {
            setLoading(true);
            try {
                // We pass the current cursor to the service
                const result = await fetchHistoryPage({
                    memberId: member.id,
                    lastDoc: cursorRef.current
                });

                setRentHistory((prev) => [...prev, ...result.data]);
                cursorRef.current = result.lastDoc;
                setHasMore(result.totalCount !== rentHistory.length + result.data.length);
                setTotalCount((prev) => (prev === result.totalCount ? prev : result.totalCount));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
                setShowHistory(false);
            }
        });
    });

    useEffect(() => {
        loadHistoryEvent();
    }, [showHistory]);

    return {
        rentHistory,
        loading,
        hasMore,
        hasNoHistory: rentHistory.length === 0 && !loading,
        totalCount,
        showDetails,
        status: getStatusAlertConfig(member.currentMonthRent.status),
        currentMonthRent: member.currentMonthRent,
        actions: {
            handleScrollToItem,
            handleShowHistory: () => setShowHistory((prev) => !prev),
            handleShowDetails: () => setShowDetails((prev) => !prev)
        }
    };
};

const MemberDetailsContent = ({ member }: MemberDetailsContentProps) => {
    const {
        rentHistory,
        loading,
        hasMore,
        hasNoHistory,
        totalCount,
        showDetails,
        status,
        currentMonthRent,
        actions: { handleScrollToItem, handleShowHistory, handleShowDetails }
    } = useMemberDetailsContent({ member });

    console.log('🎨 Rendering MemberDetailsContent');

    return (
        <Stack gap='xl'>
            <Stack gap='sm' mt='md'>
                <GroupIcon>
                    <Title order={2}>{member.name}</Title>
                    <ActionIcon variant='transparent' size={32} onClick={handleShowDetails}>
                        <IconInfo size={24} />
                    </ActionIcon>
                </GroupIcon>

                <Collapse in={showDetails}>
                    <Stack gap='xs'>
                        <GroupSpaceApart>
                            <GroupIcon>
                                <MyThemeIcon Icon={IconPerson} size={24} />
                                <Title order={5}>Details</Title>
                            </GroupIcon>

                            <Button
                                variant='default'
                                onClick={handleShowDetails}
                                aria-label='Close'
                                size='xs'
                                rightSection={<IconClose />}
                            >
                                Close
                            </Button>
                        </GroupSpaceApart>
                        <Paper withBorder radius='lg' px='md'>
                            <MemberDetailsList member={member} />
                        </Paper>
                    </Stack>
                </Collapse>
            </Stack>

            <MyAlert Icon={status.icon} title={status.title} color={status.color} variant='light'>
                <Text size='sm'>{status.message}</Text>
            </MyAlert>

            <Stack gap='xs'>
                <GroupIcon>
                    <MyThemeIcon Icon={IconReceiptLong} size={24} />
                    <Title order={5}>Rent for {dayjs(currentMonthRent.id).format('MMMM YYYY')}</Title>
                </GroupIcon>

                <Paper px='sm' withBorder radius='lg'>
                    <RentDetailsList rentHistory={member.currentMonthRent} />
                </Paper>
            </Stack>

            {/* Rent History Section */}
            {rentHistory.length > 0 && (
                <Stack gap='xs'>
                    <GroupIcon>
                        <MyThemeIcon Icon={IconHistory} size={24} />
                        <Title order={5}>Rent History</Title>
                    </GroupIcon>
                    <Accordion classNames={classesAccordion}>
                        {rentHistory.map((history, i) => (
                            <Accordion.Item key={history.id} value={history.id}>
                                <Accordion.Control
                                    icon={
                                        <ThemeIcon size='sm' variant='light' fz={10} fw={700} color='gray.9'>
                                            {totalCount - i}
                                        </ThemeIcon>
                                    }
                                    onTransitionEnd={handleScrollToItem}
                                >
                                    <GroupIcon>
                                        <Title order={6}>{dayjs(history.id).format('MMMM YYYY')}</Title>
                                        <StatusBadge status={history.status} />
                                    </GroupIcon>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <RentDetailsList rentHistory={history} />
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </Stack>
            )}

            {/* Smart History Button */}
            <Button
                leftSection={<IconHistory />}
                onClick={handleShowHistory}
                disabled={loading || !hasMore}
                loading={loading}
                fullWidth
            >
                {hasNoHistory ?
                    'Show History'
                : hasMore ?
                    'Show More History'
                :   'No More History'}
            </Button>
        </Stack>
    );
};

export const MemberDetailsPage = () => {
    const { memberId } = useMyNavigation();

    const { member, isSearching } = useMember(memberId ?? '');

    if (isSearching) return <LoadingBox />;

    if (!member) return <NothingToShow message='No Member ID provided' />;

    return <MemberDetailsContent member={member} key={memberId} />;
};
