import { Stack, Title, Progress, Badge } from '@mantine/core';
import { useState, useEffect, startTransition } from 'react';
import type { Member, PaymentStatus } from '../../../../data/types';
import { GroupSpaceApart, GroupIcon, StatusThemeIcon } from '../../../../shared/components';
import { getPaymentStatusColor, toIndianLocale } from '../../../../shared/utils';
import dayjs from 'dayjs';
import { IconEvent } from '../../../../shared/icons';

const useRentProgressData = (members: Member[]) => {
    const [rentAggragate, setRentAggragate] = useState({
        totalRent: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        totalPaidPercentage: 0,
        totalOutstandingPercentage: 0
    });

    useEffect(() => {
        startTransition(() => {
            const calculatedRentAggragate = members.reduce(
                (sum, { currentMonthRent: rent }) => {
                    const totalRent = sum.totalRent + rent.totalCharges;
                    // Add the negative OVERPAID amount to get the actual amount paid
                    const totalPaid = sum.totalPaid + rent.amountPaid + Math.min(0, rent.outstanding);
                    // Add the positive OUTSTANDING amount to get the total outstanding
                    const totalOutstanding = sum.totalOutstanding + Math.max(0, rent.outstanding);

                    // Calculate percentages after totals are updated
                    const totalPaidPercentage = (totalPaid / (totalRent || 1)) * 100;
                    const totalOutstandingPercentage = (totalOutstanding / (totalRent || 1)) * 100;

                    return {
                        ...sum,
                        totalRent,
                        totalPaid,
                        totalOutstanding,
                        totalPaidPercentage,
                        totalOutstandingPercentage
                    };
                },
                {
                    totalRent: 0,
                    totalPaid: 0,
                    totalOutstanding: 0,
                    totalPaidPercentage: 0,
                    totalOutstandingPercentage: 0
                }
            );

            setRentAggragate(calculatedRentAggragate);
        });
    }, [members]);

    const paymentStatus: PaymentStatus = rentAggragate.totalOutstanding > 0 ? 'Due' : 'Paid';

    return {
        rentMonth: dayjs(members[0].currentMonthRent.generatedAt.toDate()).format('MMMM YY'),
        rentAggragate,
        colors: {
            gray: {
                textColor: 'gray.7',
                bg: 'gray.4',
                gradient: { from: 'gray.4', to: 'gray.1' }
            },
            red: {
                bg: 'red',
                textColor: 'red.0',
                gradient: { from: 'red.2', to: 'red.1' }
            },
            green: {
                bg: 'green.4',
                textColor: 'green.9',
                gradient: { from: 'green.3', to: 'teal.0' }
            }
        },
        paymentStatus
    };
};

interface RentProgressProps {
    members: Member[];
}

export function RentProgress({ members }: RentProgressProps) {
    const { rentAggragate, colors, paymentStatus, rentMonth } = useRentProgressData(members);
    const { totalOutstanding, totalPaid, totalRent, totalOutstandingPercentage, totalPaidPercentage } = rentAggragate;

    const getBadge = (value: number, color: 'gray' | 'red' | 'green') => (
        <Badge variant='gradient' c={colors[color].textColor} gradient={colors[color].gradient} size='sm'>
            {toIndianLocale(value)}
        </Badge>
    );

    const getProgressSection = (value: number, color: 'gray' | 'red' | 'green') => {
        const label = Math.round(value);
        return (
            <Progress.Section value={value} color={colors[color].bg}>
                {label > 4 && <Progress.Label c={colors[color].textColor}>{label}%</Progress.Label>}
            </Progress.Section>
        );
    };

    return (
        <Stack gap={4} my='xs'>
            <GroupIcon>
                <IconEvent size={28} fw={300} />{' '}
                <Title order={3} fw={300}>
                    {rentMonth}
                </Title>
            </GroupIcon>

            <Progress.Root size='xl'>
                {getProgressSection(totalPaidPercentage, 'gray')}
                {getProgressSection(totalOutstandingPercentage, 'red')}
            </Progress.Root>

            {/* <GroupIcon>
                    <StatusThemeIcon paymentStatus={paymentStatus} size={18} />
                    <Title order={5} fw={300}>
                        {paymentStatus} {toIndianLocale(totalOutstanding)}
                    </Title>
                </GroupIcon> */}
            <GroupSpaceApart>
                <Badge
                    variant='gradient'
                    gradient={{
                        from: `${getPaymentStatusColor(paymentStatus)}.0`,
                        to: 'gray.3'
                    }}
                    c={`gray.7`}
                    leftSection={<StatusThemeIcon size={16} paymentStatus={paymentStatus} />}
                    pl={2}
                    size='md'
                >
                    {paymentStatus} {toIndianLocale(totalOutstanding)}
                </Badge>
                <GroupIcon>
                    {getBadge(totalRent, 'gray')}
                    {getBadge(totalPaid, 'green')}
                </GroupIcon>
            </GroupSpaceApart>
        </Stack>
    );
}
