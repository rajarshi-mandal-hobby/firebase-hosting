import { array, number, optional, string, unknown, z } from 'zod/v4';
import * as v from 'valibot';

export const zInteger = number('Must be a number').int('Must be an integer');
export const zStringTrimmed = string().trim().min(1, 'Cannot be empty');

export const zFourDigit = zInteger
  .min(1600, 'Must be at least 1600')
  .max(9999, 'Must be at most 4 digits');

export const zThreeToFourDigit = zInteger
  .min(100, 'Must be at least 3 digits')
  .max(9999, 'Must be at most 4 digits');

  export const zNonNegativeInteger = zInteger.positive('Must be non-negative');

export const zUpiVpa = zStringTrimmed.refine((value) => /^[a-z0-9_-]{3,20}@[a-z0-9]{3,10}$/g.test(value), {
  message: 'Must be in format name@bank',
});

export const formValidator = {
  nonZero: (value?: number | null) => {
    const result = zInteger
      .refine((val) => val !== 0, { message: 'Cannot be zero' })
      .safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  activeMemberCount: (value?: number | null) => {
    const result = zInteger
      .nonnegative('Cannot be negative')
      .min(1, { message: 'Cannot be zero' })
      .max(10, { message: 'Cannot be more than 10' })
      .safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  fourDigit: (value: number) => {
    const result = zFourDigit.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  threeToFourDigit: (value: number | undefined | null) => {
    const result = zThreeToFourDigit.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  upiVpa: (value: string) => {
    const result = zUpiVpa.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  stringTrimmed: (value: string | undefined | null) => {
    const result = zStringTrimmed.safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
  arrayOfString: (value: unknown[]) => {
    const result = array(z.any()).min(1, { message: 'Select at least one' }).safeParse(value);
    return result.success ? null : result.error.issues[0].message;
  },
};


