const express = require('express');
const { z } = require('zod');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');

const router = express.Router();

// All FAQ routes require JWT authentication
router.use(authenticate);

// ─── Validation Schemas ──────────────────────────────────────────────

const createFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(5000),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const updateFaqSchema = z.object({
  question: z.string().min(1).max(500).optional(),
  answer: z.string().min(1).max(5000).optional(),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * GET /api/faq
 * Lists all FAQs for the tenant.
 * Query: ?category=&isActive=&page=1&limit=50
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const skip = (page - 1) * limit;

    const where = { tenantId: req.tenantId };

    if (req.query.category) {
      where.category = req.query.category;
    }
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }

    const [faqs, total] = await Promise.all([
      prisma.fAQ.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      prisma.fAQ.count({ where }),
    ]);

    res.json({
      faqs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  })
);

/**
 * GET /api/faq/categories
 * Returns distinct FAQ categories for the tenant.
 */
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const result = await prisma.fAQ.findMany({
      where: { tenantId: req.tenantId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    res.json({ categories: result.map((r) => r.category) });
  })
);

/**
 * PUT /api/faq/reorder
 * Reorders FAQs by setting sortOrder based on the order of IDs provided.
 * Body: { orderedIds: ["id1", "id2", "id3"] }
 */
router.put(
  '/reorder',
  asyncHandler(async (req, res) => {
    const { orderedIds } = reorderSchema.parse(req.body);

    // Verify all IDs belong to the tenant
    const faqs = await prisma.fAQ.findMany({
      where: { tenantId: req.tenantId, id: { in: orderedIds } },
      select: { id: true },
    });

    const existingIds = new Set(faqs.map((f) => f.id));
    const invalidIds = orderedIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length > 0) {
      throw createError(`FAQs not found: ${invalidIds.join(', ')}`, 404);
    }

    // Update sort orders in a transaction
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.fAQ.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    const updated = await prisma.fAQ.findMany({
      where: { tenantId: req.tenantId },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ faqs: updated });
  })
);

/**
 * GET /api/faq/:id
 * Returns a single FAQ by ID.
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const faq = await prisma.fAQ.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!faq) {
      throw createError('FAQ not found', 404);
    }
    res.json({ faq });
  })
);

/**
 * POST /api/faq
 * Creates a new FAQ entry.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createFaqSchema.parse(req.body);

    // If no sortOrder given, append to end
    if (data.sortOrder === undefined) {
      const maxOrder = await prisma.fAQ.findFirst({
        where: { tenantId: req.tenantId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });
      data.sortOrder = (maxOrder?.sortOrder ?? -1) + 1;
    }

    const faq = await prisma.fAQ.create({
      data: {
        tenantId: req.tenantId,
        question: data.question,
        answer: data.answer,
        category: data.category || 'general',
        sortOrder: data.sortOrder,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    res.status(201).json({ faq });
  })
);

/**
 * PUT /api/faq/:id
 * Updates an existing FAQ entry.
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateFaqSchema.parse(req.body);

    const existing = await prisma.fAQ.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!existing) {
      throw createError('FAQ not found', 404);
    }

    const faq = await prisma.fAQ.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ faq });
  })
);

/**
 * DELETE /api/faq/:id
 * Deletes a FAQ entry.
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await prisma.fAQ.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    });
    if (!existing) {
      throw createError('FAQ not found', 404);
    }

    await prisma.fAQ.delete({ where: { id: req.params.id } });
    res.json({ message: 'FAQ deleted successfully' });
  })
);

module.exports = router;
