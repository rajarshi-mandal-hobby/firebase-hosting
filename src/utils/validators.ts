import { z } from 'zod/v4';

export const zInteger = z.number('Must be a number').int('Must be an integer');
export const zStringTrimmed = z.string().trim();

export const zFourDigit = zInteger
  .min(1600, { message: 'Must be at least 1600' })
  .max(9999, { message: 'Must be at most 4 digits' });

export const zThreeToFourDigit = zInteger
  .min(100, { message: 'Must be at least 3 digits' })
  .max(9999, { message: 'Must be at most 4 digits' });

export const zUpiVpa = zStringTrimmed.refine((value) => /^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/g.test(value), {
  message: 'Must be in format name@bank',
});

export const formValidator = {
  fourDigit: (value: number) => {
    const result = zFourDigit.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  threeToFourDigit: (value: number) => {
    const result = zThreeToFourDigit.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  upiVpa: (value: string) => {
    const result = zUpiVpa.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
};