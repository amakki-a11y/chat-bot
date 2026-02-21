const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/register
 * Creates a new tenant with hashed password and auto-generated API key.
 */
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.tenant.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A tenant with this email already exists',
        statusCode: 409,
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const apiKey = `tk_${uuidv4().replace(/-/g, '')}`;

    const tenant = await prisma.tenant.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        apiKey,
      },
    });

    const token = jwt.sign(
      { tenantId: tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { passwordHash: _, ...tenantData } = tenant;

    res.status(201).json({
      token,
      tenant: tenantData,
    });
  })
);

/**
 * POST /api/auth/login
 * Authenticates tenant by email + password, returns JWT.
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const tenant = await prisma.tenant.findUnique({
      where: { email: data.email },
    });

    if (!tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
    }

    const validPassword = await bcrypt.compare(data.password, tenant.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
    }

    const token = jwt.sign(
      { tenantId: tenant.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { passwordHash: _, ...tenantData } = tenant;

    res.json({
      token,
      tenant: tenantData,
    });
  })
);

/**
 * GET /api/auth/me
 * Returns the current authenticated tenant's profile.
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const { passwordHash: _, ...tenantData } = req.tenant;
    res.json({ tenant: tenantData });
  })
);

module.exports = router;
