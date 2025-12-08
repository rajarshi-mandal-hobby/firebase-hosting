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

export const toNumber = (value: string | number): number => {
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

/**
 * Utility function to format numbers as per Indian locale
 * @param number - The number to format
 * @param isCurrency - Whether to format as currency (default: true)
 * @returns Formatted number string
 */
export const formatNumberIndianLocale = (number: number | string, isCurrency = true): string => {
  // Check if the number has a decimal part using Math.floor()
  const num = toNumber(number);
  const hasDecimal = num % 1 !== 0;

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
  return formatter.format(num);
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
 * Normalizes a phone input by removing non-digit characters and ensuring it is 10 digits long.
 * @param value - The phone number input as a string or number.
 * @returns The normalized phone number as a string.
 */
export const normalizePhoneInput = (value: number | string): string => {
  const phoneStr = String(value).replace(/\D/g, '').slice(-10);
  return phoneStr;
};

/** Formats a phone number by inserting a space after every 5 digits.
 * @param inputValue - The phone number input as a string or number.
 * @returns The formatted phone number as a string.
 */
export const formatPhoneNumber = (inputValue: any) => {
  // 1. Remove all non-numeric characters (enforce numbers only) AND remove spaces
  const noSpacesOrLetters = normalizePhoneInput(inputValue);

  // 2. Insert a space after every 5 digits using regex
  const formatted = noSpacesOrLetters.replace(/(\d{5})/g, '$1 ').trim();

  return formatted;
};

/** Formats a phone number for display by adding the country code prefix.
 * @param value - The phone number input as a string or number.
 * @returns The formatted phone number with country code as a string.
 */
export const displayPhoneNumber = (value: number | string) => `+91 ${formatPhoneNumber(value)}`;

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

/** Checks if a sentence contains at least one word with two or more letters.
 * @param sentence - The sentence to check.
 * @returns True if the sentence contains at least one word with two or more letters, false otherwise.
 */
export const hasTwoLetterWord = (sentence: string): boolean => {
  const words = sentence.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
  return words.some((word) => word.length >= 2); // Check if any word has a length >= 2
};
