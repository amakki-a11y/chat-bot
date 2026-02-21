/**
 * Wraps an async route handler to catch errors and pass them to next().
 * @param {Function} fn - Async route handler
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Generates a ticket number with a prefix and random digits.
 * @returns {string} e.g. "TK-20240215-A3F8"
 */
const generateTicketNo = () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TK-${dateStr}-${rand}`;
};

/**
 * Creates an error with a status code.
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

module.exports = { asyncHandler, generateTicketNo, createError };
