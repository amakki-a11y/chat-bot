const express = require('express');
const { z } = require('zod');
const { authenticate, authenticateApiKey } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');
const ticketService = require('../services/ticket.service');

const router = express.Router();

// ─── Validation Schemas ──────────────────────────────────────────────

const createTicketSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  source: z.enum(['web', 'chat', 'voice', 'api']).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().max(100).optional(),
  assignedTo: z.string().max(200).optional().nullable(),
});

const replySchema = z.object({
  message: z.string().min(1).max(10000),
  from: z.enum(['admin', 'customer', 'ai']).optional(),
});

const fromChatSchema = z.object({
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  chatSessionId: z.string().uuid().optional(),
});

// ─── Owner (JWT) Routes ──────────────────────────────────────────────

/**
 * GET /api/tickets
 * Lists tickets with filtering, sorting, and pagination.
 * Query: ?status=open&priority=high&category=&email=&search=&source=&sortBy=createdAt&sortOrder=desc&page=1&limit=20
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await ticketService.listTickets(req.tenantId, {
      status: req.query.status,
      priority: req.query.priority,
      category: req.query.category,
      email: req.query.email,
      search: req.query.search,
      source: req.query.source,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page: req.query.page,
      limit: req.query.limit,
    });
    res.json(result);
  })
);

/**
 * GET /api/tickets/categories
 * Returns distinct ticket categories.
 */
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (req, res) => {
    const categories = await ticketService.getCategories(req.tenantId);
    res.json({ categories });
  })
);

/**
 * POST /api/tickets/from-chat
 * Creates a ticket from a chat session (widget/public).
 * Authenticated via X-API-Key.
 */
router.post(
  '/from-chat',
  authenticateApiKey,
  asyncHandler(async (req, res) => {
    const data = fromChatSchema.parse(req.body);
    const ticket = await ticketService.createTicket({
      tenantId: req.tenantId,
      email: data.email,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      source: 'chat',
      chatSessionId: data.chatSessionId,
    });
    res.status(201).json({ ticket });
  })
);

/**
 * GET /api/tickets/:id
 * Returns a single ticket with replies and files.
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.getTicket(req.tenantId, req.params.id);
    if (!ticket) {
      throw createError('Ticket not found', 404);
    }
    res.json({ ticket });
  })
);

/**
 * POST /api/tickets
 * Creates a new ticket (owner/admin creation).
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = createTicketSchema.parse(req.body);
    const ticket = await ticketService.createTicket({
      tenantId: req.tenantId,
      ...data,
    });
    res.status(201).json({ ticket });
  })
);

/**
 * PUT /api/tickets/:id
 * Updates a ticket's status, priority, category, or assignedTo.
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = updateTicketSchema.parse(req.body);
    const ticket = await ticketService.updateTicket(req.tenantId, req.params.id, data);
    if (!ticket) {
      throw createError('Ticket not found', 404);
    }
    res.json({ ticket });
  })
);

/**
 * POST /api/tickets/:id/reply
 * Adds a reply to a ticket. Default from=admin for owner routes.
 */
router.post(
  '/:id/reply',
  authenticate,
  asyncHandler(async (req, res) => {
    const data = replySchema.parse(req.body);
    const from = data.from || 'admin';

    const reply = await ticketService.addReply(
      req.tenantId,
      req.params.id,
      from,
      data.message
    );
    if (!reply) {
      throw createError('Ticket not found', 404);
    }
    res.status(201).json({ reply });
  })
);

/**
 * DELETE /api/tickets/:id
 * Deletes a ticket and all associated replies/files.
 */
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const deleted = await ticketService.deleteTicket(req.tenantId, req.params.id);
    if (!deleted) {
      throw createError('Ticket not found', 404);
    }
    res.json({ message: 'Ticket deleted successfully' });
  })
);

module.exports = router;
