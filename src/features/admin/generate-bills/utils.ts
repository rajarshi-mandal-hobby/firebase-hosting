import { toNumber } from "../../../shared/utils";

/**
 * Computes the per head bill amount by dividing the total bill by the number of members.
 * @param totalBill - The total bill amount.
 * @param memberCount - The number of members.
 * @returns The per head bill amount, rounded up to the nearest integer.
 */
export const computePerHeadBill = (totalBill: number | string | undefined, memberCount: number | string | undefined) =>
   totalBill && memberCount ? Math.ceil(toNumber(totalBill) / toNumber(memberCount)) : 0;
