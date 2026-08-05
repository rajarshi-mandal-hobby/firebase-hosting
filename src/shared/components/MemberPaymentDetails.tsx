import { Stack } from '@mantine/core';
import type { Member } from '../../data/types';
import { getPaymentStatusColor } from '../utils';
import { GroupTable } from './group-helpers';
import { MyAlert } from './MyAlert';
import { NameWithStatusBadge } from './NameWithStatusBadge';

export function MemberPaymentDetails({ member }: { member: Member }) {
    const { totalCharges, amountPaid, outstanding, paymentStatus: status } = member.currentMonthRent;
    const isOutstanding = outstanding !== 0;

    return (
        <Stack gap='xs'>
            <NameWithStatusBadge memberName={member.name} paymentStatus={status} />
            <MyAlert
                title='Rent Summary'
                iconName='info'
                color={getPaymentStatusColor(member.currentMonthRent.paymentStatus)}
            >
                <Stack gap='xs'>
                    <GroupTable iconName='payments' label='Total Charges' value={totalCharges} />

                    {status !== 'Paid' && status !== 'Due' && (
                        <GroupTable iconName='money_bag' label='Previously Paid' value={amountPaid} valueFw={700} />
                    )}

                    {isOutstanding && status !== 'Due' && (
                        <GroupTable
                            iconName='universal_currency_alt'
                            label='Previous Outstanding'
                            value={outstanding}
                        />
                    )}
                </Stack>
            </MyAlert>
        </Stack>
    );
}
