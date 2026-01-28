const num = '2026-01-06'



// Add space after +91, then add space after every 5 digits
const regex = /^(\d{4})-(\d{2})$/;  
console.log(regex.test(num))

