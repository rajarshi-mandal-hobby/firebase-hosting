import type { Adjustment } from '../../data/types';

/**
 * Calculates the total amount of adjustments by summing up the amounts of all adjustments.
 *
 * @param adjustments A list of adjustments.
 * @returns The total amount of all adjustments combined.
 */
export const calcTotalAdjustments = (adjustments: Adjustment[]) =>
    adjustments.reduce((acc, adj) => acc + adj.amount, 0);

interface CalcTotalChargesProps {
    rent: number;
    electricity: number;
    wifi: number;
    adjustments: Adjustment[];
}

/**
 * Calculates the total charges for a member by adding rent, electricity, wifi, and the total amount of adjustments.
 *
 * @param totalCharges - An object containing the rent, electricity, wifi, and a list of adjustments.
 * @returns The total charges for the member.
 */
export const calcTotalCharges = ({ rent, electricity, wifi, adjustments }: CalcTotalChargesProps) =>
    rent + electricity + wifi + calcTotalAdjustments(adjustments);

/**
 * Calculates the outstanding amount for a member by subtracting the amount paid from the total charges.
 *
 * @param totalCharges The total charges for the member (rent + electricity + wifi + adjustments).
 * @param amountPaid The amount paid by the member towards the total charges.
 * @returns The outstanding amount (amount remaining to be paid by the member).
 */
export const calcOutstanding = (totalCharges: number, amountPaid: number) => totalCharges - amountPaid;
