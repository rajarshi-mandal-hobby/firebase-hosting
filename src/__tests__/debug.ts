const numberString4 = '+91 98 765 432 10';

// Improved: Handles spaces, dashes, and various country code formats
const splitMobileNoChunks = (input: string) => {
  // Remove spaces, dashes, and parentheses for normalization
  const normalized = input.replace(/[\s\-()]/g, '');

  // Match country code (+91, 91, 0091, 0) and 10-digit mobile number
  const match = normalized.match(/^(\+91|0091|91|0)?([6789]\d{9})$/);
  if (!match) return input; // fallback if not matching expected pattern

  const countryCode = match[1] || '+91';
  const mobile = match[2];
  // Format as 5-5 chunks: 98765 43210
  return `${countryCode} ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
};

console.log(splitMobileNoChunks(numberString4));
