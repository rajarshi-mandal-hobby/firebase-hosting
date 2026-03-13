import { pipe, union, string, number, toNumber, integer, minValue, maxValue, transform, check, minWords, trim } from "valibot";
import { hasAtLeastTwoWords } from "../../shared/utils";

export const IntegerSchema = pipe(
    union([string(), number()]),
    toNumber('Must be a number'),
    integer('Must be an integer')
);

export const FourDigitSchema = pipe(
    IntegerSchema,
    minValue(1000, 'Must be at least ₹1000'),
    maxValue(9999, 'Must be at most ₹9999')
);

export const ThreeToFourDigitSchema = pipe(
    IntegerSchema,
    minValue(100, 'Must be at least ₹100'),
    maxValue(9999, 'Must be at most ₹9999')
);

export const SentenceSchema = pipe(
    string(),
    transform((value) => value.trim().replaceAll(/\s+/g, ' ')),
    trim(),
    minWords('en', 2, 'Must contan at least 2 words'),
    check(hasAtLeastTwoWords, 'Must contain at least one word with two or more letters.')
);
