import { Stack, Button, Collapse, Title, Paper, Accordion, ActionIcon, type CSSProperties, Badge } from '@mantine/core';
import classesAccordion from '../../css-modules/Accordion.module.css';
import dayjs from 'dayjs';
import { useState, useRef, startTransition } from 'react';
import { useMember } from '../../contexts';
import type { Member } from '../../data/types';
import { fetchHistoryPage } from '../../services';
import {
    GroupSpaceApart,
    GroupIcon,
    MyThemeIcon,
    StatusThemeIcon,
    LoadingBox,
    NothingToShow,
    StatusBadge
} from '../../shared/components';
import { useMyNavigation } from '../../shared/hooks';
import { IconInfo, IconClose, IconHistory } from '../../shared/icons';
import { getPaymentStatusConfig } from '../../shared/utils';
import { MemberDetailsList } from '../tab-navigation/member-menagement/components/MemberDetailsList';
import { RentDetailsList } from '../tab-navigation/rent-management/components/RentDetailsList';

interface MemberDetailsContentProps {
    member: Member;
}

const useMemberDetailsContent = ({ member }: MemberDetailsContentProps) => {
    const [rentHistory, setRentHistory] = useState<any[]>([]);
    const cursorRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [showDetails, setShowDetails] = useState(false);

    const loadHistory = async () => {
        if (loading || !hasMore) return;

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
        }
    };

    return {
        rentHistory,
        loading,
        hasMore,
        hasNoHistory: rentHistory.length === 0 && !loading,
        totalCount,
        showDetails,
        status: getPaymentStatusConfig(member.currentMonthRent.paymentStatus),
        currentMonthRent: member.currentMonthRent,
        actions: {
            handleShowHistory: () => startTransition(loadHistory),
            handleShowDetails: () => setShowDetails((prev) => !prev)
        }
    };
};

const getStyle = (showDetails: boolean): CSSProperties => ({
    visibility: showDetails ? 'hidden' : 'visible',
    transform: showDetails ? 'scale(0)' : 'scale(1)',
    opacity: showDetails ? 0 : 1,
    transition: 'opacity 150ms ease-out, transform 150ms ease-out, visibility 150ms ease-out'
});

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
        actions: { handleShowHistory, handleShowDetails }
    } = useMemberDetailsContent({ member });

    console.log('🎨 Rendering MemberDetailsContent');

    return (
        <Stack gap='xl'>
            <Stack gap='sm' mt='md'>
                <GroupSpaceApart>
                    <GroupIcon>
                        <Title order={2}>{member.name}</Title>
                        <ActionIcon
                            variant='transparent'
                            size={32}
                            onClick={handleShowDetails}
                            style={getStyle(showDetails)}
                        >
                            <IconInfo size={24} />
                        </ActionIcon>
                    </GroupIcon>
                    <Button
                        variant='transparent'
                        onClick={handleShowDetails}
                        aria-label='Close'
                        size='xs'
                        rightSection={<IconClose />}
                        style={getStyle(!showDetails)}
                    >
                        Close
                    </Button>
                </GroupSpaceApart>

                <Collapse expanded={showDetails}>
                    <Paper withBorder px='md'>
                        <MemberDetailsList member={member} />
                    </Paper>
                </Collapse>
            </Stack>

            <Stack gap='xs'>
                <GroupSpaceApart wrap='nowrap'>
                    <GroupIcon>
                        {/* <MyThemeIcon Icon={IconReceiptLong} size={24} /> */}
                        <Title order={4} lineClamp={1} fw={300}>
                            Rent for {dayjs(currentMonthRent.id).format('MMMM YY')}
                        </Title>
                    </GroupIcon>
                    <StatusBadge status={currentMonthRent.paymentStatus} size='sm' />
                </GroupSpaceApart>

                <Paper px='sm' withBorder radius='lg'>
                    <RentDetailsList rentHistory={member.currentMonthRent} memberId={member.id} />
                </Paper>
            </Stack>

            {/* Rent History Section */}
            {rentHistory.length > 0 && (
                <Stack gap='xs'>
                    <GroupIcon>
                        <MyThemeIcon Icon={IconHistory} size={24} />
                        <Title order={4} fw={300}>
                            Rent History
                        </Title>
                    </GroupIcon>
                    <Accordion classNames={classesAccordion}>
                        {rentHistory.map((history, i) => (
                            <Accordion.Item key={history.id} value={history.id}>
                                <Accordion.Control
                                    icon={
                                        <Badge color='gray.4' circle>
                                            {totalCount - i}
                                        </Badge>
                                    }
                                >
                                    <GroupIcon>
                                        <Title order={6}>{dayjs(history.id).format('MMMM YYYY')}</Title>
                                        <StatusThemeIcon paymentStatus={history.status} />
                                    </GroupIcon>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <RentDetailsList rentHistory={history} memberId={member.id} />
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

export default function MemberDetailsPage() {
    const { paramMemberId: memberId } = useMyNavigation();

    const { member, isSearching } = useMember(memberId ?? '');

    if (isSearching) return <LoadingBox />;

    if (!member) return <NothingToShow message='No Member ID provided' />;

    return <MemberDetailsContent member={member} key={memberId} />;
}
