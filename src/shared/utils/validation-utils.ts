export const isInteger = (val: unknown): val is number => typeof val === 'number' && Number.isInteger(val);

export const isString = (val: unknown): val is string => typeof val === 'string';
