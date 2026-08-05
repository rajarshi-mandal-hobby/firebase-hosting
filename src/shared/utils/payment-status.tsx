import { type DefaultMantineColor } from '@mantine/core';
import { DEFAULT_SVG_SIZE, type PaymentStatus } from '../../data/types';
import { GoogleIcon, type GoogleIconName } from '../icons/factory';

interface PaymtentStatusEntry {
    iconName: GoogleIconName;
    color: DefaultMantineColor;
    paymentStatus: PaymentStatus;
    title: string;
}

const PaymtentStatusConfig: Record<PaymentStatus, PaymtentStatusEntry> = {
    Paid: {
        iconName: 'check',
        color: 'green',
        paymentStatus: 'Paid',
        title: 'Payment Complete'
    },
    Overpaid: {
        iconName: 'check_alert',
        color: 'teal',
        paymentStatus: 'Overpaid',
        title: 'Paid Extra'
    },
    Partial: {
        iconName: 'check_alert',
        color: 'orange',
        paymentStatus: 'Partial',
        title: 'Paid Partially'
    },
    Due: {
        iconName: 'priority_high',
        color: 'red',
        paymentStatus: 'Due',
        title: 'Payment Due'
    }
} as const;

export const getPaymentStatusConfig = (status: PaymentStatus) => PaymtentStatusConfig[status];

export const getPaymentStatusColor = (status: PaymentStatus) => PaymtentStatusConfig[status].color;

export const getPaymentStatusIcon = (status: PaymentStatus, size = DEFAULT_SVG_SIZE) => {
    const name = PaymtentStatusConfig[status].iconName;
    return <GoogleIcon iconName={name} size={size} />;
};

export const getPaymentStatusTitle = (status: PaymentStatus) => PaymtentStatusConfig[status].title;

export const getPaymentStatus = (amountPaid: number, totalCharges: number): PaymentStatus => {
    if (amountPaid === 0) return 'Due';
    if (amountPaid === totalCharges) return 'Paid';
    if (amountPaid < totalCharges) return 'Partial';
    if (amountPaid > totalCharges) return 'Overpaid';
    throw new Error(`Invalid amounts! amountPaid=${amountPaid}, totalCharges=${totalCharges}`);
};

export const getPaymentStatus2 = (outstanding: number, amountPaid: number): PaymentStatus => {
    if (outstanding < 0) return 'Overpaid';
    if (amountPaid === 0) return 'Due';
    if (outstanding === 0 && amountPaid > 0) return 'Paid';
    if (outstanding > 0 && amountPaid > 0) return 'Partial';

    throw new Error(`Invalid amounts! outstanding=${outstanding}, amountPaid=${amountPaid}`);
};
