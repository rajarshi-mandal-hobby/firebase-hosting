import dayjs from 'dayjs';
import { lazy } from 'react';
import { type FloorLabel, type FloorAndAll, type Floor, type Bed, BED_LABEL, FLOOR_LABEL } from '../../data/types';
import type { DefaultMantineColor } from '@mantine/core';

export {
    notify,
    notifyClose,
    notifyCloseAll,
    notifyError,
    notifyInfo,
    notifyLoading,
    notifySuccess,
    notifyUpdate
} from './notification-utils';
export {
    getPaymentStatus,
    getPaymentStatusColor,
    getPaymentStatusConfig,
    getPaymentStatusIcon,
    getPaymentStatusTitle
} from './payment-status';
export * from '../hooks/useGlobalFormResult';
export * from './auth';
export * from './validation-utils';
export { getInputResetProps, setFormValues } from './form-utils';
export { calcOutstanding, calcTotalCharges, calcTotalAdjustments } from './member-utils';

export const toNumber = (value: unknown) => {
    if (!value) return 0;
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
        const num = Number(value);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

export const getMemberFirstname = (name: string) => name.split(' ')[0];

/**
 * Utility function to format numbers as per Indian locale
 * @param number - The number to format
 * @param isCurrency - Whether to format as currency (default: true)
 * @returns Formatted number string
 */
export const toIndianLocale = (number: unknown, isCurrency = true): string => {
    // Check if the number has a decimal part using Math.floor()
    const num = toNumber(number);
    const hasDecimal = num % 1 !== 0;

    // Define base options for currency formatting
    const numberFormatOptions: Intl.NumberFormatOptions | undefined =
        isCurrency ?
            {
                style: 'currency',
                currency: 'INR',
                currencyDisplay: 'narrowSymbol',
                minimumFractionDigits: hasDecimal ? 2 : 0,
                maximumFractionDigits: hasDecimal ? 2 : 0
            }
        :   undefined;

    // Create and use the formatter
    return num.toLocaleString('en-IN', numberFormatOptions);
};

// == Ordinal Suffix Formatting ==
const enOrdinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });
const suffixes = new Map([
    ['one', 'st'],
    ['two', 'nd'],
    ['few', 'rd'],
    ['other', 'th']
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
 * Normalizes a phone input by removing non-digit characters and ensuring it is 10 digits long.
 * @param value - The phone number input as a string or number.
 * @returns The normalized phone number as a string.
 */
export const normalizePhoneInput = (value: number | string): string => {
    const phoneStr = String(value).replaceAll(/\D/g, '').slice(-10);
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
    const parts = [];
    if (noSpacesOrLetters.length > 0) parts.push(noSpacesOrLetters.substring(0, 4));
    if (noSpacesOrLetters.length > 4) parts.push(noSpacesOrLetters.substring(4, 7));
    if (noSpacesOrLetters.length > 7) parts.push(noSpacesOrLetters.substring(7));

    return parts.join(' ');
};

/** Formats a phone number for display by adding the country code prefix.
 * @param value - The phone number input as a string or number.
 * @returns The formatted phone number with country code as a string.
 */
export const displayPhoneNumber = (value: number | string) => {
    const phoneString = String(value);
    return phoneString.startsWith('+91') ?
            phoneString.replace(/(\d{2})(\d{4})(\d{3})(\d{3})/g, '$1 $2 $3 $4')
        :   `+91 ${formatPhoneNumber(value)}`;
};

/**
 * Safely retrieves a date string in 'YYYY-MM' format from various date representations.
 * Handles Firestore Timestamps, serialized Timestamps, Date objects, and strings.
 * @param dateVal - The date value to format.
 * @returns The formatted date string in 'YYYY-MM' format.
 */
export const getSafeDate = (dateVal: any): string => {
    if (!dateVal) return dayjs().format('YYYY-MM-DD');

    // If it's a real Firestore Timestamp
    if (typeof dateVal.toDate === 'function') {
        return dayjs(dateVal.toDate()).format('YYYY-MM-DD');
    }

    // If it's a serialized Timestamp (from Router state)
    if (dateVal.seconds) {
        return dayjs.unix(dateVal.seconds).format('YYYY-MM-DD');
    }

    // Fallback for strings or Date objects
    return dayjs(dateVal).format('YYYY-MM-DD');
};

/**
 * Safely retrieves a date string in 'MMM YYYY' format from various date representations.
 * Handles Firestore Timestamps, serialized Timestamps, Date objects, and strings.
 * @param dateVal - The date value to format.
 * @returns The formatted date string in 'MMM YYYY' format.
 */
export const formatDate = (dateVal: any): string => dayjs(getSafeDate(dateVal)).format('MMM YYYY');

/** Checks if a sentence contains at least one word with two or more letters.
 * @param sentence - The sentence to check.
 * @returns True if the sentence contains at least one word with two or more letters, false otherwise.
 */
export const hasTwoLetterWord = (sentence: string): boolean => {
    const words = sentence.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
    return words.some((word) => word.length >= 2); // Check if any word has a length >= 2
};

/**
 * A helper to lazy load named exports with full TypeScript support.
 * @param factory A function that returns a dynamic import promise.
 * @param name The name of the export to load.
 */
export const lazyImport = <T extends Record<string, any>, K extends keyof T>(factory: () => Promise<T>, name: K) =>
    lazy(() => factory().then((module) => ({ default: module[name] })));

/** Checks if a sentence contains at least one word with two or more letters.
 * @param value - The sentence to check.
 * @returns True if the sentence contains at least one word with two or more letters, false otherwise.
 */
export const hasTwoWords = (value: string): boolean => {
    const words = value.split(/\s+/).filter(Boolean);
    return words.length > 1 && words.some((word) => word.length >= 2);
};

/** Checks if a sentence contains at least two words with two or more letters.
 * @param sentence - The sentence to check.
 * @returns True if the sentence contains at least two words with two or more letters, false otherwise.
 */
export const hasTwoLetterTwoWord = (sentence: string): boolean => {
    const words = sentence.split(/\s+/).filter(Boolean);
    return words.length >= 2 && words.every((word) => word.length >= 2);
};

/**
 * Checks if a string is a sentence (has at least two words with two or more letters).
 * @param str - The string to check.
 * @returns True if the string is a sentence, false otherwise.
 */
export const isSentence = (str: string): boolean => {
    const words = str.trim().split(/\s+/);
    const hasTwoOrMoreWords = words.length >= 2;
    return hasTwoOrMoreWords && words.some((word) => word.length >= 2);
};

/**
 * Get Formatted Floor Number
 */
export const convertToFloorOrdinal = (floor: FloorAndAll): FloorLabel =>
    floor === 'second' ? '2nd'
    : floor === 'third' ? '3rd'
    : 'All';

export const convertToFloor = (floor: FloorLabel): FloorAndAll =>
    floor === '2nd' ? 'second'
    : floor === '3rd' ? 'third'
    : 'all';

export const getLightBgColor = (color: DefaultMantineColor) => color.split('.')[0] + '.0';

export const displayFloorBed = (floor: Floor, bed: Bed) => `${FLOOR_LABEL[floor]} Floor — ${BED_LABEL[bed]}`;
