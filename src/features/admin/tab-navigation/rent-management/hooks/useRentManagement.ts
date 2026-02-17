import dayjs from 'dayjs';
import type { Member } from '../../../../../data/types';
import { toIndianLocale, notifyError } from '../../../../../shared/utils';
import { useDisclosure } from '@mantine/hooks';

export type MessagesPlatform = 'whatsapp' | 'share';

export interface DerivedRents {
    totalRent: number;
    totalPaid: number;
    totalPartial: number;
    totalOutstanding: number;
    totalPaidPercentage: number;
    totalPartialPercentage: number;
    totalOutstandingPercentage: number;
}

export const useRentManagement = ({ members }: { members: Member[] }) => {
    const [recordPaymentModalOpened, { open: openRecordPayment, close: closeRecordPayment }] = useDisclosure(false);
    const [addExpenseModalOpened, { open: openAddExpense, close: closeAddExpense }] = useDisclosure(false);

    const derivedRents = members.reduce<DerivedRents>(
        (sum, { currentMonthRent: rent }) => {
            const isPartial = rent.status === 'Partial';

            sum.totalRent += rent.totalCharges;
            sum.totalPaid += rent.amountPaid;
            sum.totalPartial += isPartial ? rent.currentOutstanding : 0;
            sum.totalOutstanding += !isPartial ? Math.max(0, rent.currentOutstanding) : 0;

            // Calculate percentages after totals are updated
            const t = sum.totalRent || 1; // Prevent division by zero
            sum.totalPaidPercentage = (sum.totalPaid / t) * 100;
            sum.totalPartialPercentage = (sum.totalPartial / t) * 100;
            sum.totalOutstandingPercentage = (sum.totalOutstanding / t) * 100;

            return sum;
        },
        {
            totalRent: 0,
            totalPaid: 0,
            totalPartial: 0,
            totalOutstanding: 0,
            totalPaidPercentage: 0,
            totalPartialPercentage: 0,
            totalOutstandingPercentage: 0
        }
    );


    const handleShareRent = async (member: Member, platform: MessagesPlatform) => {
        const { name, phone, currentMonthRent: rent } = member;
        const month = dayjs(rent.id).format('MMMM YY');
        const status = rent.currentOutstanding > 0 ? 'is due' : 'has been paid';

        const lines = [
            `Hi ${name.split(' ')[0]}, the rent of *${toIndianLocale(rent.totalCharges)}* for *${month}* ${status}.`,
            '\r\n*Details:*',
            `- Rent: ${toIndianLocale(rent.rent)}`,
            `- Electricity: ${toIndianLocale(rent.electricity)}`,
            `- Wi-Fi: ${toIndianLocale(rent.wifi)}`
        ];

        if (rent.previousOutstanding > 0) lines.push(`- Prev. Due: ${toIndianLocale(rent.previousOutstanding)}`);
        if (rent.expenses.length)
            lines.push(
                `- Expenses: ${rent.expenses.map((e) => `${e.description}: ${toIndianLocale(e.amount)}`).join(', ')}`
            );

        const message =
            rent.currentOutstanding > 0 ? [...lines, '\r\nPlease pay by the 10th.'].join('\r\n') : lines.join('\r\n');

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            navigator
                .share?.({ title: `Rent: ${name} (${month})`, text: message.replace(/\*/g, '') })
                .catch(() => notifyError('Sharing not supported'));
        }
    };

    return {
        recordPaymentModal: {
            recordPaymentModalOpened,
            openRecordPayment,
            closeRecordPayment
        },
        addExpenseModal: {
            addExpenseModalOpened,
            openAddExpense,
            closeAddExpense
        },
        derivedRents,
        handleShareRent
    };
};
