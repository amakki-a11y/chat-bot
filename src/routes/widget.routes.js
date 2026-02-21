const express = require('express');
const prisma = require('../config/database');
const { authenticateApiKey } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/widget/config
 * Returns the tenant's widget configuration (branding, channels, FAQs).
 * Authenticated by API key (used by embedded widget).
 */
router.get(
  '/config',
  authenticateApiKey,
  asyncHandler(async (req, res) => {
    const tenant = req.tenant;

    res.json({
      botConfig: tenant.botConfig,
      brandConfig: tenant.brandConfig,
      channelConfig: tenant.channelConfig,
    });
  })
);

/**
 * GET /api/widget/faqs
 * Returns active FAQs for the tenant (public, API-key authenticated).
 */
router.get(
  '/faqs',
  authenticateApiKey,
  asyncHandler(async (req, res) => {
    const faqs = await prisma.fAQ.findMany({
      where: { tenantId: req.tenantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        question: true,
        answer: true,
        category: true,
      },
    });
    res.json({ faqs });
  })
);

/**
 * GET /api/widget/demo-key
 * Returns the first tenant's API key for the widget test page.
 * Only available when demo data exists.
 */
router.get(
  '/demo-key',
  asyncHandler(async (_req, res) => {
    const tenant = await prisma.tenant.findFirst({
      select: { apiKey: true, name: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!tenant) {
      return res.status(404).json({ error: 'No tenant found. Run the seed script first.' });
    }
    res.json({ apiKey: tenant.apiKey, name: tenant.name });
  })
);

module.exports = router;
