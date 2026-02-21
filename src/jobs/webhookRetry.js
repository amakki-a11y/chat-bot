const prisma = require('../config/database');
const { deliverWebhook } = require('../services/webhook.service');

/**
 * Background job that retries failed webhook deliveries.
 * Scans for recent failed webhook logs and retries them.
 */
const retryFailedWebhooks = async () => {
  const maxRetries = parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '3', 10);

  // Find failed logs from the last hour that haven't exhausted retries
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const failedLogs = await prisma.webhookLog.findMany({
    where: {
      success: false,
      retries: { lt: maxRetries },
      createdAt: { gte: oneHourAgo },
    },
    include: {
      endpoint: true,
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  for (const log of failedLogs) {
    if (!log.endpoint || !log.endpoint.isActive) continue;

    const payload = typeof log.payload === 'object' ? log.payload : {};
    await deliverWebhook(log.endpoint, log.event, payload.data || {}, log.retries + 1);
  }

  return failedLogs.length;
};

/**
 * Starts the webhook retry job on an interval.
 * @param {number} intervalMs - How often to check for failed webhooks (default: 60s)
 */
const startRetryJob = (intervalMs = 60000) => {
  setInterval(async () => {
    try {
      const count = await retryFailedWebhooks();
      if (count > 0) {
        console.log(`[WebhookRetry] Retried ${count} failed webhooks`);
      }
    } catch (err) {
      console.error('[WebhookRetry] Error:', err.message);
    }
  }, intervalMs);
};

module.exports = { retryFailedWebhooks, startRetryJob };
