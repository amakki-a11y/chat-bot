const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * JWT authentication middleware.
 * Extracts and verifies Bearer token, attaches tenant to req.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header',
        statusCode: 401,
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const tenant = await prisma.tenant.findUnique({
      where: { id: decoded.tenantId },
    });

    if (!tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Tenant not found',
        statusCode: 401,
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has expired',
        statusCode: 401,
      });
    }
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
      statusCode: 401,
    });
  }
};

/**
 * API key authentication middleware for widget/public endpoints.
 * Looks up tenant by X-API-Key header.
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing X-API-Key header',
        statusCode: 401,
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { apiKey },
    });

    if (!tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid API key',
        statusCode: 401,
      });
    }

    req.tenant = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role/plan checking middleware factory.
 * @param {string[]} allowedPlans - Array of plan names allowed access
 */
const requirePlan = (allowedPlans) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        statusCode: 401,
      });
    }

    if (!allowedPlans.includes(req.tenant.plan)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This feature requires one of: ${allowedPlans.join(', ')} plan`,
        statusCode: 403,
      });
    }

    next();
  };
};

module.exports = { authenticate, authenticateApiKey, requirePlan };
