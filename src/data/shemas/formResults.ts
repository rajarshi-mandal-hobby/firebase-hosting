import type z from 'zod';

// Define validation error type for client
export type ValidationError = z.ZodFlattenedError<unknown, string>;

export type SaveResult =
  | {
      success: true;
    }
  | {
      success: false;
      errors: ValidationError;
    };
