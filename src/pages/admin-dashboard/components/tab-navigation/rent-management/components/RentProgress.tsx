import { Stack, Title, Progress, Badge } from '@mantine/core';
import { useState, useEffect, startTransition } from 'react';
import type { Member } from '../../../../../../data/types';
import { GroupIcon } from '../../../../../../shared/components';
import { StatusBadge, toIndianLocale } from '../../../../../../shared/utils';

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

    return rentAggragate;
};

interface RentProgressProps {
    members: Member[];
}

export const RentProgress = ({ members }: RentProgressProps) => {
    const { totalOutstanding, totalPaid, totalRent, totalOutstandingPercentage, totalPaidPercentage } =
        useRentProgressData(members);
    const grayTextColor = 'gray.8';
    const grayBg = 'gray.4';
    const redBg = 'red';
    const redTextColor = 'red.0';

    return (
        <Stack my='md' gap={0}>
            <GroupIcon>
                <StatusBadge status={totalOutstanding > 0 ? 'Due' : 'Paid'} size={16} />
                <Title order={4} c='dimmed' fw={300}>
                    Rent: {toIndianLocale(totalRent)}
                </Title>
                <Badge
                    variant='gradient'
                    c={grayTextColor}
                    gradient={{ from: 'gray.4', to: 'gray.2', deg: 90 }}
                    size='sm'
                >
                    {toIndianLocale(totalPaid)}
                </Badge>
                <Badge variant='gradient' c={redTextColor} gradient={{ from: 'red.8', to: 'red.4', deg: 90 }} size='sm'>
                    {toIndianLocale(totalOutstanding)}
                </Badge>
            </GroupIcon>
            <Progress.Root size='xl'>
                <Progress.Section value={totalPaidPercentage} color={grayBg}>
                    <Progress.Label c={grayTextColor}>{Math.round(totalPaidPercentage)}%</Progress.Label>
                </Progress.Section>
                <Progress.Section value={totalOutstandingPercentage} color={redBg}>
                    <Progress.Label c={redTextColor}>{Math.round(totalOutstandingPercentage)}%</Progress.Label>
                </Progress.Section>
            </Progress.Root>
        </Stack>
    );
};
