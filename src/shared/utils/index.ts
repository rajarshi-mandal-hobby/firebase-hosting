import dayjs from 'dayjs';

// Utility exports
export * from './memberUtils.ts';
export * from './dateUtils.ts';
export * from './statusUtils.tsx';

/**
 * A utility type that makes all properties of a given type T optional, including nested properties.
 * This is useful for scenarios where you want to create a partial version of a complex object type.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility function to format numbers as per Indian locale
 * @param number - The number to format
 * @param isCurrency - Whether to format as currency (default: true)
 * @returns Formatted number string
 */
export const formatNumberIndianLocale = (number: number, isCurrency = true): string => {
  // Check if the number has a decimal part using Math.floor()
  const hasDecimal = number % 1 !== 0;

  // Define base options for currency formatting
  const numberFormatOptions: Intl.NumberFormatOptions | undefined = isCurrency
    ? {
        style: 'currency',
        currency: 'INR',
        currencyDisplay: 'symbol',
        minimumFractionDigits: hasDecimal ? 2 : 0,
        maximumFractionDigits: hasDecimal ? 2 : 0,
      }
    : undefined;

  // Create and use the formatter
  const formatter = new Intl.NumberFormat('en-IN', numberFormatOptions);
  return formatter.format(number);
};

// == Ordinal Suffix Formatting ==
const enOrdinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });
const suffixes = new Map([
  ['one', 'st'],
  ['two', 'nd'],
  ['few', 'rd'],
  ['other', 'th'],
]);

/**
 * Formats a number with its ordinal suffix (e.g., 1st, 2nd, 3rd, 4th).
 * @param n - The number to format.
 * @returns The formatted number with its ordinal suffix.
 */
export const formatNumberWithOrdinal = (n: number) => {
  const rule = enOrdinalRules.select(n);
  const suffix = suffixes.get(rule);
  return `${n}${suffix}`;
};

/**
 * Computes the per head bill amount by dividing the total bill by the number of members.
 * @param totalBill - The total bill amount.
 * @param memberCount - The number of members.
 * @returns The per head bill amount, rounded up to the nearest integer.
 */
export const computePerHeadBill = (totalBill: number | string | undefined, memberCount: number | string | undefined) =>
  totalBill && memberCount ? Math.ceil(Number(totalBill) / Number(memberCount)) : 0;

/**
 * Formats a mobile number into a standardized format.
 * Supports Indian mobile numbers with optional country codes.
 * @param input - The mobile number string to format.
 * @returns The formatted mobile number string.
 */
export const formatMobileNumber = (input?: string) => {
  if (!input) return input;
  // Remove spaces, dashes, and parentheses for normalization
  const normalized = input.replace(/[\s\-()]/g, '');

  // Match country code (+91, 91, 0091, 0) and 10-digit mobile number
  const match = normalized.match(/^(\+91|0091|91|0)?([6789]\d{9})$/);
  if (!match) return input; // fallback if not matching expected pattern

  const countryCode = match[1] || '+91';
  const mobile = match[2];
  // Format as 5-5 chunks: 98765 43210
  return `${countryCode} ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
};

/**
 * Safely retrieves a date string in 'YYYY-MM' format from various date representations.
 * Handles Firestore Timestamps, serialized Timestamps, Date objects, and strings.
 * @param dateVal - The date value to format.
 * @returns The formatted date string in 'YYYY-MM' format.
 */
export const getSafeDate = (dateVal: any): string => {
  if (!dateVal) return dayjs().format('YYYY-MM');

  // If it's a real Firestore Timestamp
  if (typeof dateVal.toDate === 'function') {
    return dayjs(dateVal.toDate()).format('YYYY-MM');
  }

  // If it's a serialized Timestamp (from Router state)
  if (dateVal.seconds) {
    return dayjs.unix(dateVal.seconds).format('YYYY-MM');
  }

  // Fallback for strings or Date objects
  return dayjs(dateVal).format('YYYY-MM');
};
