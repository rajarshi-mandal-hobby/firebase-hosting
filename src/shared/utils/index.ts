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

// Utility function to format numbers as per Indian locale
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


const enOrdinalRules = new Intl.PluralRules('en-US', { type: 'ordinal' });
const suffixes = new Map([
  ['one', 'st'],
  ['two', 'nd'],
  ['few', 'rd'],
  ['other', 'th'],
]);

export const formatNumberWithOrdinal = (n: number) => {
  const rule = enOrdinalRules.select(n);
  const suffix = suffixes.get(rule);
  return `${n}${suffix}`;
};
