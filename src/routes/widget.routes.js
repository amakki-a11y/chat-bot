const express = require('express');
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

module.exports = router;
