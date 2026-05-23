import dayjs from 'dayjs';
import type { Member } from '../../../../../../data/types';
import { toIndianLocale, notify } from '../../../../../../shared/utils';

type MessagesPlatform = 'whatsapp' | 'share';

const getRentMessage = (member: Member) => {
    const { name, currentMonthRent: rent } = member;
    const month = dayjs(rent.id).format('MMMM YY');
    const status = rent.outstanding > 0 ? 'is due' : 'has been paid';

    const lines = [
        `Hi ${name.split(' ')[0]}, the rent of *${toIndianLocale(rent.totalCharges)}* for *${month}* ${status}.`,
        '\r\n*Details:*',
        `- Rent: ${toIndianLocale(rent.rent)}`,
        `- Electricity: ${toIndianLocale(rent.electricity)}`,
        `- Wi-Fi: ${toIndianLocale(rent.wifi)}`
    ];

    if (rent.prevOutstanding > 0) lines.push(`- Prev. Due: ${toIndianLocale(rent.prevOutstanding)}`);
    if (rent.expenses.length)
        lines.push(
            `- Expenses: ${rent.expenses.map((e) => `${e.description}: ${toIndianLocale(e.amount)}`).join(', ')}`
        );

    const message = rent.prevOutstanding > 0 ? [...lines, '\n*Please pay by the 10th.*'].join('\n') : lines.join('\n');

    return message;
};

const handleShareRent = (member: Member, platform: MessagesPlatform) => {
    const { name, phone, currentMonthRent: rent } = member;
    const month = dayjs(rent.id).format('MMMM YY');
    const message = getRentMessage(member);

    if (platform === 'whatsapp') {
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
        const shareMessage = message.replaceAll('*', '');
        if (!navigator.share) {
            navigator.clipboard.writeText(shareMessage);
            notify({
                title: 'Rent Copied!',
                message: `Send it to ${name}`
            });
            return;
        }

        navigator.share({ title: `Rent: ${name} (${month})`, text: shareMessage });
    }
};

export const shareRentOnWhatsApp = (member: Member) => handleShareRent(member, 'whatsapp');

export const shareRent = (member: Member) => handleShareRent(member, 'share');
