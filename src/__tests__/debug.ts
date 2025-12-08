import * as v from 'valibot';

const hasTwoLetterWord = (sentence: string): boolean => {
  const words = sentence.split(/\s+/).filter(Boolean); // Split by whitespace and remove empty strings
  return words.some((word) => word.length >= 2); // Check if any word has a length >= 2
};

const CustomSentenceSchema = v.pipe(
  v.string(),
    v.trim(),
    v.regex(/^[a-zA-Z\s]+$/, 'Must contain only letters and spaces'),
  v.check(hasTwoLetterWord, 'The sentence must contain at least one word with two or more letters.')
);

// Example usage:
try {
  v.parse(CustomSentenceSchema, 'Hi there');
  console.log('Valid');
} catch (error) {
  console.error(error.issues[0].message);
}

try {
  v.parse(CustomSentenceSchema, 'a b c');
} catch (error) {
  console.error(error.issues[0].message); // The sentence must contain at least one word with two or more letters.
}

try {
  v.parse(CustomSentenceSchema, 'aa asdf');
} catch (error) {
  console.error(error.issues[0].message); // The sentence must contain at least one word with two or more letters.
}
