const express = require('express');
const { z } = require('zod');
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');

const router = express.Router();

// All owner routes require JWT authentication
router.use(authenticate);

// ─── Validation Schemas ──────────────────────────────────────────────

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

const botConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  greeting: z.string().max(500).optional(),
  systemPrompt: z.string().max(5000).optional(),
  tone: z.enum(['professional', 'friendly', 'casual', 'formal']).optional(),
  language: z.string().min(2).max(10).optional(),
});

const brandConfigSchema = z.object({
  name: z.string().max(100).optional(),
  logo: z.string().max(500).optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color').optional(),
});

const channelConfigSchema = z.object({
  chat: z.boolean().optional(),
  voice: z.boolean().optional(),
  voiceNote: z.boolean().optional(),
  call: z.boolean().optional(),
  faq: z.boolean().optional(),
  tickets: z.boolean().optional(),
  fileAttach: z.boolean().optional(),
});

const fileConfigSchema = z.object({
  maxSizeMb: z.number().min(1).max(100).optional(),
  allowedTypes: z.array(z.string()).optional(),
  maxFiles: z.number().min(1).max(20).optional(),
});

const rateLimitConfigSchema = z.object({
  messagesPerMin: z.number().min(1).max(120).optional(),
  messagesPerDay: z.number().min(1).max(10000).optional(),
  tokensPerMsg: z.number().min(100).max(8000).optional(),
});

// ─── Profile ─────────────────────────────────────────────────────────

/**
 * GET /api/owner/profile
 * Returns the owner's tenant profile.
 */
router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
    });
    const { passwordHash: _, ...tenantData } = tenant;
    res.json({ tenant: tenantData });
  })
);

/**
 * PUT /api/owner/profile
 * Updates the owner's name and/or email.
 */
router.put(
  '/profile',
  asyncHandler(async (req, res) => {
    const data = profileUpdateSchema.parse(req.body);

    if (data.email && data.email !== req.tenant.email) {
      const existing = await prisma.tenant.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        throw createError('A tenant with this email already exists', 409);
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data,
    });

    const { passwordHash: _, ...tenantData } = tenant;
    res.json({ tenant: tenantData });
  })
);

/**
 * PUT /api/owner/password
 * Changes the owner's password.
 */
router.put(
  '/password',
  asyncHandler(async (req, res) => {
    const data = passwordUpdateSchema.parse(req.body);

    const valid = await bcrypt.compare(data.currentPassword, req.tenant.passwordHash);
    if (!valid) {
      throw createError('Current password is incorrect', 400);
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  })
);

// ─── Bot Config ──────────────────────────────────────────────────────

/**
 * GET /api/owner/bot-config
 * Returns the tenant's bot configuration.
 */
router.get(
  '/bot-config',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { botConfig: true },
    });
    res.json({ botConfig: tenant.botConfig });
  })
);

/**
 * PUT /api/owner/bot-config
 * Updates the tenant's bot configuration (partial merge).
 */
router.put(
  '/bot-config',
  asyncHandler(async (req, res) => {
    const data = botConfigSchema.parse(req.body);
    const current = req.tenant.botConfig || {};
    const merged = { ...current, ...data };

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { botConfig: merged },
      select: { botConfig: true },
    });

    res.json({ botConfig: tenant.botConfig });
  })
);

// ─── Branding ────────────────────────────────────────────────────────

/**
 * GET /api/owner/branding
 * Returns the tenant's brand configuration.
 */
router.get(
  '/branding',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { brandConfig: true },
    });
    res.json({ brandConfig: tenant.brandConfig });
  })
);

/**
 * PUT /api/owner/branding
 * Updates the tenant's brand configuration (partial merge).
 */
router.put(
  '/branding',
  asyncHandler(async (req, res) => {
    const data = brandConfigSchema.parse(req.body);
    const current = req.tenant.brandConfig || {};
    const merged = { ...current, ...data };

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { brandConfig: merged },
      select: { brandConfig: true },
    });

    res.json({ brandConfig: tenant.brandConfig });
  })
);

// ─── Channels ────────────────────────────────────────────────────────

/**
 * GET /api/owner/channels
 * Returns the tenant's channel toggles.
 */
router.get(
  '/channels',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { channelConfig: true },
    });
    res.json({ channelConfig: tenant.channelConfig });
  })
);

/**
 * PUT /api/owner/channels
 * Updates the tenant's channel toggles (partial merge).
 */
router.put(
  '/channels',
  asyncHandler(async (req, res) => {
    const data = channelConfigSchema.parse(req.body);
    const current = req.tenant.channelConfig || {};
    const merged = { ...current, ...data };

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { channelConfig: merged },
      select: { channelConfig: true },
    });

    res.json({ channelConfig: tenant.channelConfig });
  })
);

// ─── File Settings ───────────────────────────────────────────────────

/**
 * GET /api/owner/file-settings
 * Returns the tenant's file upload settings.
 */
router.get(
  '/file-settings',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { fileConfig: true },
    });
    res.json({ fileConfig: tenant.fileConfig });
  })
);

/**
 * PUT /api/owner/file-settings
 * Updates the tenant's file upload settings (partial merge).
 */
router.put(
  '/file-settings',
  asyncHandler(async (req, res) => {
    const data = fileConfigSchema.parse(req.body);
    const current = req.tenant.fileConfig || {};
    const merged = { ...current, ...data };

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { fileConfig: merged },
      select: { fileConfig: true },
    });

    res.json({ fileConfig: tenant.fileConfig });
  })
);

// ─── Rate Limits ─────────────────────────────────────────────────────

/**
 * GET /api/owner/rate-limits
 * Returns the tenant's rate limit configuration.
 */
router.get(
  '/rate-limits',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { rateLimitConfig: true },
    });
    res.json({ rateLimitConfig: tenant.rateLimitConfig });
  })
);

/**
 * PUT /api/owner/rate-limits
 * Updates the tenant's rate limit configuration (partial merge).
 */
router.put(
  '/rate-limits',
  asyncHandler(async (req, res) => {
    const data = rateLimitConfigSchema.parse(req.body);
    const current = req.tenant.rateLimitConfig || {};
    const merged = { ...current, ...data };

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { rateLimitConfig: merged },
      select: { rateLimitConfig: true },
    });

    res.json({ rateLimitConfig: tenant.rateLimitConfig });
  })
);

// ─── API Key ─────────────────────────────────────────────────────────

/**
 * GET /api/owner/api-key
 * Returns the tenant's API key.
 */
router.get(
  '/api-key',
  asyncHandler(async (req, res) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      select: { apiKey: true },
    });
    res.json({ apiKey: tenant.apiKey });
  })
);

/**
 * POST /api/owner/api-key/regenerate
 * Regenerates the tenant's API key.
 */
router.post(
  '/api-key/regenerate',
  asyncHandler(async (req, res) => {
    const { v4: uuidv4 } = require('uuid');
    const newKey = `tk_${uuidv4().replace(/-/g, '')}`;

    const tenant = await prisma.tenant.update({
      where: { id: req.tenantId },
      data: { apiKey: newKey },
      select: { apiKey: true },
    });

    res.json({ apiKey: tenant.apiKey });
  })
);

// ─── Analytics ───────────────────────────────────────────────────────

/**
 * GET /api/owner/analytics
 * Returns aggregated stats for the tenant's dashboard.
 * Query params: ?days=7 (default 30)
 */
router.get(
  '/analytics',
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const tenantId = req.tenantId;

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      ticketsByPriority,
      ticketsByCategory,
      totalSessions,
      activeSessions,
      totalMessages,
      kbArticleCount,
      faqCount,
      recentTickets,
      ticketsOverTime,
      sessionsOverTime,
    ] = await Promise.all([
      prisma.supportTicket.count({ where: { tenantId } }),
      prisma.supportTicket.count({
        where: { tenantId, status: { in: ['open', 'in_progress', 'waiting'] } },
      }),
      prisma.supportTicket.count({
        where: {
          tenantId,
          status: { in: ['resolved', 'closed'] },
          updatedAt: { gte: since },
        },
      }),
      prisma.supportTicket.groupBy({
        by: ['priority'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.supportTicket.groupBy({
        by: ['category'],
        where: { tenantId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.chatSession.count({ where: { tenantId } }),
      prisma.chatSession.count({ where: { tenantId, status: 'active' } }),
      prisma.chatMessage.count({
        where: {
          session: { tenantId },
          createdAt: { gte: since },
        },
      }),
      prisma.knowledgeBase.count({ where: { tenantId, isActive: true } }),
      prisma.fAQ.count({ where: { tenantId, isActive: true } }),
      prisma.supportTicket.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          ticketNo: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
      prisma.supportTicket.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.chatSession.findMany({
        where: { tenantId, createdAt: { gte: since } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const ticketsByDay = aggregateByDay(
      ticketsOverTime.map((t) => t.createdAt),
      since,
      days
    );
    const sessionsByDay = aggregateByDay(
      sessionsOverTime.map((s) => s.createdAt),
      since,
      days
    );

    res.json({
      overview: {
        totalTickets,
        openTickets,
        resolvedTickets,
        totalSessions,
        activeSessions,
        totalMessages,
        kbArticleCount,
        faqCount,
      },
      ticketsByPriority: ticketsByPriority.map((g) => ({
        priority: g.priority,
        count: g._count.id,
      })),
      ticketsByCategory: ticketsByCategory.map((g) => ({
        category: g.category,
        count: g._count.id,
      })),
      recentTickets,
      charts: {
        ticketsByDay,
        sessionsByDay,
        period: { days, since: since.toISOString() },
      },
    });
  })
);

/**
 * Aggregates date array into per-day counts.
 * @param {Date[]} dates
 * @param {Date} since
 * @param {number} days
 * @returns {Array<{date: string, count: number}>}
 */
function aggregateByDay(dates, since, days) {
  const counts = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split('T')[0];
    counts[key] = 0;
  }
  for (const date of dates) {
    const key = new Date(date).toISOString().split('T')[0];
    if (counts[key] !== undefined) {
      counts[key]++;
    }
  }
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

module.exports = router;
