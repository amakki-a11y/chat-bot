const crypto = require('crypto');
const prisma = require('../config/database');

/**
 * Dispatches a webhook event to all matching endpoints for a tenant.
 * @param {string} tenantId
 * @param {string} event - Event name (e.g. 'ticket_created')
 * @param {object} payload - Event payload data
 */
const dispatchEvent = async (tenantId, event, payload) => {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      tenantId,
      isActive: true,
      events: { has: event },
    },
  });

  for (const endpoint of endpoints) {
    await deliverWebhook(endpoint, event, payload);
  }
};

/**
 * Delivers a webhook to a single endpoint with HMAC signing.
 * @param {object} endpoint - WebhookEndpoint record
 * @param {string} event - Event name
 * @param {object} payload - Event data
 * @param {number} retryCount - Current retry number
 */
const deliverWebhook = async (endpoint, event, payload, retryCount = 0) => {
  const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
  const signature = crypto
    .createHmac('sha256', endpoint.secret)
    .update(body)
    .digest('hex');

  let statusCode = null;
  let success = false;
  let error = null;

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event,
      },
      body,
      signal: AbortSignal.timeout(10000),
    });

    statusCode = response.status;
    success = response.ok;

    if (!success) {
      error = `HTTP ${statusCode}`;
    }
  } catch (err) {
    error = err.message;
  }

  await prisma.webhookLog.create({
    data: {
      endpointId: endpoint.id,
      event,
      payload: { event, data: payload },
      statusCode,
      success,
      retries: retryCount,
      error,
    },
  });

  // Schedule retry if failed and under max retries
  const maxRetries = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10);
  if (!success && retryCount < maxRetries) {
    const delay = parseInt(process.env.WEBHOOK_RETRY_DELAY_MS || '5000', 10);
    setTimeout(() => {
      deliverWebhook(endpoint, event, payload, retryCount + 1);
    }, delay * Math.pow(2, retryCount));
  }
};

module.exports = { dispatchEvent, deliverWebhook };
