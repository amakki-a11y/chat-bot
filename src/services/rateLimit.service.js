/**
 * In-memory token bucket rate limiter per tenant.
 * Tracks messages per minute and messages per day.
 */

/** @type {Map<string, {minute: {tokens: number, lastRefill: number}, day: {tokens: number, lastRefill: number}}>} */
const buckets = new Map();

/**
 * Checks and consumes a rate limit token for a tenant.
 * @param {string} tenantId
 * @param {object} config - Rate limit config from tenant
 * @param {number} config.messagesPerMin
 * @param {number} config.messagesPerDay
 * @returns {{allowed: boolean, retryAfter?: number}}
 */
const checkRateLimit = (tenantId, config) => {
  const now = Date.now();
  const { messagesPerMin = 10, messagesPerDay = 100 } = config;

  if (!buckets.has(tenantId)) {
    buckets.set(tenantId, {
      minute: { tokens: messagesPerMin, lastRefill: now },
      day: { tokens: messagesPerDay, lastRefill: now },
    });
  }

  const bucket = buckets.get(tenantId);

  // Refill minute bucket
  const minuteElapsed = (now - bucket.minute.lastRefill) / 60000;
  if (minuteElapsed >= 1) {
    bucket.minute.tokens = messagesPerMin;
    bucket.minute.lastRefill = now;
  }

  // Refill day bucket
  const dayElapsed = (now - bucket.day.lastRefill) / 86400000;
  if (dayElapsed >= 1) {
    bucket.day.tokens = messagesPerDay;
    bucket.day.lastRefill = now;
  }

  // Check minute limit
  if (bucket.minute.tokens <= 0) {
    const retryAfter = Math.ceil(60 - ((now - bucket.minute.lastRefill) / 1000));
    return { allowed: false, retryAfter };
  }

  // Check day limit
  if (bucket.day.tokens <= 0) {
    const retryAfter = Math.ceil(86400 - ((now - bucket.day.lastRefill) / 1000));
    return { allowed: false, retryAfter };
  }

  // Consume tokens
  bucket.minute.tokens--;
  bucket.day.tokens--;

  return { allowed: true };
};

/**
 * Resets rate limit for a tenant (e.g. for testing).
 * @param {string} tenantId
 */
const resetRateLimit = (tenantId) => {
  buckets.delete(tenantId);
};

module.exports = { checkRateLimit, resetRateLimit };
