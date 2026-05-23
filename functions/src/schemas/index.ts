import * as v from 'valibot';

export const IntegerSchema = v.pipe(
    v.union([v.string(), v.number()]),
    v.toNumber('Must be a number'),
    v.integer('Must be an integer')
);

export const FourDigitSchema = v.pipe(
    IntegerSchema,
    v.minValue(1000, 'Must be at least ₹1000'),
    v.maxValue(9999, 'Can be at most ₹9999')
);

export const MinMaxFourDigitSchema = v.pipe(
    IntegerSchema,
    v.minValue(1000, 'Must be at least ₹1000'),
    v.maxValue(20000, 'Can be at most ₹20000')
);

export const ThreeToFourDigitSchema = v.pipe(
    IntegerSchema,
    v.minValue(100, 'Must be at least ₹100'),
    v.maxValue(9999, 'Can be at most ₹9999')
);
