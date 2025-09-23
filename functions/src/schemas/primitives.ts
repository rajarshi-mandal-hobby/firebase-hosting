import { z } from 'zod';

// Common building blocks
export const zInteger = z.number('Must be a number').int('Must be an integer');
export const zPositiveNumber = zInteger.positive('Must be a positive number');
export const zString = z.string().trim();

// Reusable validators (keep messages consistent with frontend)
export const ZodFourDigitPositiveNumber = zPositiveNumber.min(1600, { message: 'Must be at least 1600' }).max(9999, {
  message: 'Must be at most 4 digits',
});

export const zThreeToFourDigitsNumber = zPositiveNumber.min(100, { message: 'Must be at least 3 digits' }).max(9999, {
  message: 'Must be at most 4 digits',
});

export const zUpiVpa = zString.toLowerCase().refine((s) => /^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/.test(s), {
  message: 'Must be UPI VPA format (e.g. name@bank)',
});
