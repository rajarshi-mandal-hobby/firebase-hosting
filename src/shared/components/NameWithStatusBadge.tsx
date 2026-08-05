import { Title } from '@mantine/core';
import { GroupIcon } from './group-helpers';
import type { PaymentStatus } from '../../data/types';
import { StatusBadge } from './payment-status-helpers';

interface NameWithStatusBadgeProps {
    memberName?: string;
    paymentStatus?: PaymentStatus;
}

export const NameWithStatusBadge = ({ memberName, paymentStatus = 'Due' }: NameWithStatusBadgeProps) => {
    return (
        <GroupIcon>
            <Title fw={300} order={2} lineClamp={1}>
                {memberName}
            </Title>

            <StatusBadge status={paymentStatus} size='sm' />
        </GroupIcon>
    );
};
