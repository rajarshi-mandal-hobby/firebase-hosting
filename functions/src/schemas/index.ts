import * as v from 'valibot';

// Create a reusable base schema for number inputs that enforces a NUMBER output type
export const NumberSchema = v.pipe(
  v.number('Must be a number'), // Narrows the *inferred type* to strictly 'number'
  v.integer('Must be an integer') // Final validation
);
