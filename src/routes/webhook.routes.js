const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');
const prisma = require('../config/database');
const { WEBHOOK_EVENTS } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

// ─── Zod Schemas ──────────────────────────────────────────────

const createEndpointSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  secret: z.string().min(8).max(200),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
  isActive: z.boolean().optional().default(true),
});

const updateEndpointSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  secret: z.string().min(8).max(200).optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ─── Routes ───────────────────────────────────────────────────

/**
 * GET /api/webhooks
 * List all webhook endpoints for the tenant.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ endpoints, total: endpoints.length });
  })
);

/**
 * POST /api/webhooks
 * Create a new webhook endpoint.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createEndpointSchema.parse(req.body);

    const endpoint = await prisma.webhookEndpoint.create({
      data: { tenantId: req.tenantId, ...data },
    });

    res.status(201).json({ endpoint });
  })
);

/**
 * GET /api/webhooks/:id
 * Get a single webhook endpoint with recent logs.
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: {
        logs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!endpoint) throw createError('Webhook endpoint not found', 404);

    res.json({ endpoint });
  })
);

/**
 * PUT /api/webhooks/:id
 * Update a webhook endpoint.
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateEndpointSchema.parse(req.body);

    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!existing) throw createError('Webhook endpoint not found', 404);

    const endpoint = await prisma.webhookEndpoint.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ endpoint });
  })
);

/**
 * DELETE /api/webhooks/:id
 * Delete a webhook endpoint and its logs.
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!existing) throw createError('Webhook endpoint not found', 404);

    await prisma.webhookEndpoint.delete({ where: { id: req.params.id } });

    res.json({ message: 'Webhook endpoint deleted successfully' });
  })
);

/**
 * GET /api/webhooks/:id/logs
 * Get paginated delivery logs for a webhook endpoint.
 */
router.get(
  '/:id/logs',
  asyncHandler(async (req, res) => {
    const existing = await prisma.webhookEndpoint.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!existing) throw createError('Webhook endpoint not found', 404);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.webhookLog.findMany({
        where: { endpointId: req.params.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhookLog.count({
        where: { endpointId: req.params.id },
      }),
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

module.exports = router;
