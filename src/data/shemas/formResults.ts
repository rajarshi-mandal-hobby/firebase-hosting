import type z from 'zod';
import * as v from 'valibot';

// Define validation error type for client
// export type ValidationError = z.ZodFlattenedError<unknown, string>;
export type ValidationError = v.FlatErrors<any>;


export type SaveResult =
  | {
      success: true;
    }
  | {
      success: false;
      errors: ValidationError;
    };
