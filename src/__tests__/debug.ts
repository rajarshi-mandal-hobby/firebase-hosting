const loading = false;
const error = 'error';
const obj = { a: 1 };

console.log(!obj && !!error || loading);