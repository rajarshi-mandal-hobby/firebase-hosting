const old = [1, 2];
const newValues = [1, 2, 3];

// Find added values
const added = newValues.filter(x => !old.includes(x));
console.log('Added values:', added); // Output: [3]