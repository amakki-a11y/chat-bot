/**
 * Strips HTML tags from a string to prevent XSS.
 * @param {string} input
 * @returns {string}
 */
const stripHtml = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/<[^>]*>/g, '');
};

/**
 * Trims and sanitizes a string input.
 * @param {string} input
 * @returns {string}
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return stripHtml(input.trim());
};

/**
 * Sanitizes an object's string values recursively.
 * @param {object} obj
 * @returns {object}
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

module.exports = { stripHtml, sanitizeString, sanitizeObject };
