const express = require('express');
const { z } = require('zod');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');
const kbService = require('../services/kb.service');

const router = express.Router();

// All KB routes require JWT authentication
router.use(authenticate);

// ─── Validation Schemas ──────────────────────────────────────────────

const createArticleSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().min(1),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  sourceType: z.enum(['text', 'url', 'file']).optional(),
  sourceUrl: z.string().url().optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  filePath: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

const updateArticleSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  content: z.string().min(1).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  sourceType: z.enum(['text', 'url', 'file']).optional(),
  sourceUrl: z.string().url().optional().nullable(),
  fileName: z.string().max(255).optional().nullable(),
  filePath: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * GET /api/kb
 * Lists KB articles with optional filters.
 * Query: ?category=&sourceType=&isActive=&search=&page=1&limit=20
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const result = await kbService.listArticles(req.tenantId, {
      category: req.query.category,
      sourceType: req.query.sourceType,
      isActive: req.query.isActive,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  })
);

/**
 * GET /api/kb/categories
 * Returns distinct categories for the tenant.
 */
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await kbService.getCategories(req.tenantId);
    res.json({ categories });
  })
);

/**
 * GET /api/kb/search
 * Searches KB articles using keyword + fuzzy scoring.
 * Query: ?q=search+terms&page=1&limit=20
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const query = req.query.q;
    if (!query || !query.trim()) {
      throw createError('Search query "q" is required', 400);
    }

    const result = await kbService.listArticles(req.tenantId, {
      search: query,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  })
);

/**
 * GET /api/kb/:id
 * Returns a single KB article by ID.
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const article = await kbService.getArticle(req.tenantId, req.params.id);
    if (!article) {
      throw createError('Knowledge base article not found', 404);
    }
    res.json({ article });
  })
);

/**
 * POST /api/kb
 * Creates a new KB article.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = createArticleSchema.parse(req.body);
    const article = await kbService.createArticle(req.tenantId, data);
    res.status(201).json({ article });
  })
);

/**
 * PUT /api/kb/:id
 * Updates an existing KB article.
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const data = updateArticleSchema.parse(req.body);
    const article = await kbService.updateArticle(req.tenantId, req.params.id, data);
    if (!article) {
      throw createError('Knowledge base article not found', 404);
    }
    res.json({ article });
  })
);

/**
 * DELETE /api/kb/:id
 * Deletes a KB article.
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const deleted = await kbService.deleteArticle(req.tenantId, req.params.id);
    if (!deleted) {
      throw createError('Knowledge base article not found', 404);
    }
    res.json({ message: 'Article deleted successfully' });
  })
);

module.exports = router;
