import z from 'zod';

type ZodErrors<T> = z.ZodFlattenedError<T, string>;

export type SaveResponse<T> =
  | {
      success: true;
    }
  | {
      success: false;
      errors: ZodErrors<T>;
    };

export * from './config';
export * from './primitives';
