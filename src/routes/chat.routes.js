const express = require('express');
const { z } = require('zod');
const { authenticateApiKey } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/helpers');
const chatService = require('../services/chat.service');
const aiService = require('../services/ai.service');
const ticketService = require('../services/ticket.service');
const { checkRateLimit } = require('../services/rateLimit.service');
const { dispatchEvent } = require('../services/webhook.service');

const router = express.Router();

// All chat routes require API key authentication
router.use(authenticateApiKey);

// ─── Validation Schemas ──────────────────────────────────────────────

const messageSchema = z.object({
  message: z.string().min(1).max(10000),
  sessionKey: z.string().uuid().optional(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().max(100).optional(),
  inputMethod: z.enum(['text', 'voice']).optional(),
});

const createTicketSchema = z.object({
  sessionKey: z.string().uuid(),
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  description: z.string().min(1).max(10000),
  category: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const escalateSchema = z.object({
  sessionKey: z.string().uuid(),
  reason: z.string().max(1000).optional(),
});

// ─── Rate Limit Middleware ───────────────────────────────────────────

/**
 * Per-tenant rate limiting middleware using tenant's rateLimitConfig.
 */
const tenantRateLimit = (req, res, next) => {
  const config = req.tenant.rateLimitConfig || {};
  const result = checkRateLimit(req.tenantId, config);

  if (!result.allowed) {
    res.set('Retry-After', String(result.retryAfter));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
      statusCode: 429,
    });
  }

  next();
};

// ─── Routes ──────────────────────────────────────────────────────────

/**
 * POST /api/chat/message
 * Sends a message and gets an AI response.
 * Creates a new session if no sessionKey provided.
 * Fires webhooks on chat_message and chat_session_started.
 */
router.post(
  '/message',
  tenantRateLimit,
  asyncHandler(async (req, res) => {
    const data = messageSchema.parse(req.body);
    const tenant = req.tenant;

    // Get or create chat session
    const { session, isNew } = await chatService.getOrCreateSession(tenant.id, {
      sessionKey: data.sessionKey,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Update customer info if provided on an existing session
    if (!isNew && (data.customerEmail || data.customerName)) {
      await chatService.updateSessionCustomer(session.id, {
        customerEmail: data.customerEmail,
        customerName: data.customerName,
      });
    }

    // Fire webhook for new session
    if (isNew) {
      dispatchEvent(tenant.id, 'chat_session_started', {
        sessionId: session.id,
        sessionKey: session.sessionKey,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
      }).catch(() => {}); // Fire and forget
    }

    // Log user message
    const userMsg = await chatService.addMessage({
      sessionId: session.id,
      role: 'user',
      content: data.message,
      inputMethod: data.inputMethod || 'text',
    });

    // Get conversation history
    const history = await chatService.getSessionMessages(session.id);

    // Get AI response with RAG context
    const aiResponse = await aiService.chat(tenant, data.message, history);

    // Log assistant message
    const assistantMsg = await chatService.addMessage({
      sessionId: session.id,
      role: 'assistant',
      content: aiResponse.content,
      tokenCount: aiResponse.tokenCount,
      metadata: aiResponse.ticketData ? { ticketSuggestion: aiResponse.ticketData } : {},
    });

    // Fire webhook for chat message
    dispatchEvent(tenant.id, 'chat_message', {
      sessionId: session.id,
      sessionKey: session.sessionKey,
      userMessage: data.message,
      assistantMessage: aiResponse.cleanContent,
      tokenCount: aiResponse.tokenCount,
    }).catch(() => {});

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant_${tenant.id}`).emit('chat_message', {
        sessionId: session.id,
        sessionKey: session.sessionKey,
        userMessage: { id: userMsg.id, content: data.message, createdAt: userMsg.createdAt },
        assistantMessage: { id: assistantMsg.id, content: aiResponse.cleanContent, createdAt: assistantMsg.createdAt },
      });
    }

    // Build response
    const response = {
      sessionKey: session.sessionKey,
      message: {
        id: assistantMsg.id,
        content: aiResponse.cleanContent,
        tokenCount: aiResponse.tokenCount,
        createdAt: assistantMsg.createdAt,
      },
    };

    // If AI suggested a ticket, include the parsed data
    if (aiResponse.ticketData) {
      response.ticketSuggestion = aiResponse.ticketData;
    }

    res.json(response);
  })
);

/**
 * POST /api/chat/create-ticket
 * Creates a ticket from a chat session.
 * Fires ticket_created webhook.
 */
router.post(
  '/create-ticket',
  asyncHandler(async (req, res) => {
    const data = createTicketSchema.parse(req.body);
    const tenant = req.tenant;

    // Verify session exists and belongs to this tenant
    const session = await chatService.getSessionByKey(tenant.id, data.sessionKey);
    if (!session) {
      throw createError('Chat session not found', 404);
    }

    // Create the ticket linked to the chat session
    const ticket = await ticketService.createTicket({
      tenantId: tenant.id,
      email: data.email,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority,
      source: 'chat',
      chatSessionId: session.id,
    });

    // Log a system message in the chat
    await chatService.addMessage({
      sessionId: session.id,
      role: 'system',
      content: `Support ticket created: ${ticket.ticketNo} — "${ticket.subject}"`,
      metadata: { ticketId: ticket.id, ticketNo: ticket.ticketNo },
    });

    // Fire webhook
    dispatchEvent(tenant.id, 'ticket_created', {
      ticketId: ticket.id,
      ticketNo: ticket.ticketNo,
      email: ticket.email,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      source: 'chat',
      chatSessionId: session.id,
      sessionKey: data.sessionKey,
    }).catch(() => {});

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant_${tenant.id}`).emit('ticket_created', {
        ticketId: ticket.id,
        ticketNo: ticket.ticketNo,
        subject: ticket.subject,
        sessionKey: data.sessionKey,
      });
    }

    res.status(201).json({ ticket });
  })
);

/**
 * POST /api/chat/escalate
 * Escalates a chat session to a human agent.
 * Updates session status to 'escalated'.
 */
router.post(
  '/escalate',
  asyncHandler(async (req, res) => {
    const data = escalateSchema.parse(req.body);
    const tenant = req.tenant;

    const session = await chatService.getSessionByKey(tenant.id, data.sessionKey);
    if (!session) {
      throw createError('Chat session not found', 404);
    }

    if (session.status === 'closed') {
      throw createError('Cannot escalate a closed session', 400);
    }

    // Escalate the session
    const updated = await chatService.escalateSession(tenant.id, session.id);

    // Log a system message
    await chatService.addMessage({
      sessionId: session.id,
      role: 'system',
      content: `Session escalated to human agent.${data.reason ? ' Reason: ' + data.reason : ''}`,
      metadata: { escalationReason: data.reason || null },
    });

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`tenant_${tenant.id}`).emit('chat_escalated', {
        sessionId: session.id,
        sessionKey: session.sessionKey,
        reason: data.reason,
      });
    }

    res.json({
      message: 'Session escalated to human agent',
      session: {
        id: updated.id,
        sessionKey: updated.sessionKey,
        status: updated.status,
      },
    });
  })
);

/**
 * GET /api/chat/history/:sessionKey
 * Returns the full chat history for a session.
 */
router.get(
  '/history/:sessionKey',
  asyncHandler(async (req, res) => {
    const { sessionKey } = req.params;
    const tenant = req.tenant;

    const result = await chatService.getHistoryByKey(tenant.id, sessionKey);
    if (!result) {
      throw createError('Chat session not found', 404);
    }

    res.json(result);
  })
);

module.exports = router;
