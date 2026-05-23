import { Expense, PaymentStatus } from '../types/index.js';

export const getNumber = (value: unknown): number => {
    if (!value) return 0;
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

export const calculatePerHeadBill = (billAmount: number, memberCount: number): number =>
    getNumber(Math.ceil(billAmount / memberCount));

export const calculateTotalCharges = (
    rentAmount: number,
    electricityAmount: number,
    wifiAmount: number,
    expenses: Expense[],
    outstandingAmount: number
) => rentAmount + electricityAmount + wifiAmount + expenses.reduce((a, b) => a + b.amount, 0) + outstandingAmount;

export const calculateTotalAgreedDeposit = (
    rentAmount: number,
    securityDeposit: number,
    advanceDeposit: number
) => rentAmount + securityDeposit + advanceDeposit;

export const getPaymentStatus = (amountPaid: number, totalCharges: number): PaymentStatus =>
    amountPaid === totalCharges ? 'Paid'
    : amountPaid > totalCharges ? 'Overpaid'
    : amountPaid < totalCharges && amountPaid > 0 ? 'Partial'
    : 'Due';
