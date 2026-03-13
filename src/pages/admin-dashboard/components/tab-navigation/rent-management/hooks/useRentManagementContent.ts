import dayjs from 'dayjs';
import { useState, useEffectEvent, useEffect, startTransition } from 'react';
import type { Member } from '../../../../../../data/types';
import { toIndianLocale, notifyError } from '../../../../../../shared/utils';

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

const InitialRents = {
    totalRent: 0,
    totalPaid: 0,
    totalPartial: 0,
    totalOutstanding: 0,
    totalPaidPercentage: 0,
    totalPartialPercentage: 0,
    totalOutstandingPercentage: 0
} as const;

export const useRentManagementContent = (members: Member[]) => {
    const [derivedRents, setDerivedRents] = useState<DerivedRents>({ ...InitialRents });

    const updateDerivedRents = useEffectEvent(() => {
        if (!members.length) return;
        const calculatedDerivedRents = members.reduce<DerivedRents>(
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
        setDerivedRents((prev) =>
            prev.totalOutstanding === calculatedDerivedRents.totalOutstanding ? prev : calculatedDerivedRents
        );
    });

    useEffect(() => startTransition(updateDerivedRents), [members]);

    const handleShareRent = (member: Member, platform: MessagesPlatform) => {
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
        derivedRents,
        handleShareRent
    };
};
