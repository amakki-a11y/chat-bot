const rateLimit = require('express-rate-limit');

/**
 * Global IP-based rate limiter for public endpoints.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429,
  },
});

/**
 * Stricter rate limiter for auth endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Too many auth attempts, please try again later',
    statusCode: 429,
  },
});

module.exports = { globalLimiter, authLimiter };
