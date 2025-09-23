import { HttpsError } from "firebase-functions/https";

// Compare two billing months in "YYYY-MM" format
// Returns true if nextBillingMonth is after currentBillingMonth
export function compareDates(a: Date, b: Date): boolean {

    const currentYear = a.getFullYear();
    const currentMonth = a.getMonth();
    const nextYear = b.getFullYear();
    const nextMonth = b.getMonth();

    return nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth);
}