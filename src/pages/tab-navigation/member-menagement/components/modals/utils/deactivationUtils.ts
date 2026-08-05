type SettlementStatus = 'REFUND' | 'PAYMENT' | 'SETTLED';
type SettlementMessage = 'Refund Due' | 'Payment Due' | 'Settled';

const GET_SETTLEMENT_CONFIG: Record<SettlementStatus, { status: SettlementMessage; color: string; text: string }> = {
    REFUND: { status: 'Refund Due', color: 'green.9', text: 'I Give (Approx)' },
    PAYMENT: { status: 'Payment Due', color: 'red', text: 'I Get' },
    SETTLED: { status: 'Settled', color: 'gray', text: 'Settled' }
} as const;

export const getSettlementStatus = (refundAmount: number) => {
    if (refundAmount > 0) return GET_SETTLEMENT_CONFIG.REFUND;
    if (refundAmount < 0) return GET_SETTLEMENT_CONFIG.PAYMENT;
    return GET_SETTLEMENT_CONFIG.SETTLED;
};
