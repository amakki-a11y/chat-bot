const prisma = require('../config/database');
const { generateTicketNo } = require('../utils/helpers');

/**
 * Lists tickets for a tenant with filters and pagination.
 * @param {string} tenantId
 * @param {object} [filters]
 * @param {string} [filters.status]
 * @param {string} [filters.priority]
 * @param {string} [filters.category]
 * @param {string} [filters.email]
 * @param {string} [filters.search] - searches subject, description, ticketNo
 * @param {string} [filters.source]
 * @param {string} [filters.sortBy] - field to sort by
 * @param {string} [filters.sortOrder] - 'asc' or 'desc'
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @returns {Promise<{tickets: object[], total: number, page: number, totalPages: number}>}
 */
const listTickets = async (tenantId, filters = {}) => {
  const page = Math.max(parseInt(filters.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(filters.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const where = { tenantId };

  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  if (filters.email) {
    where.email = { contains: filters.email, mode: 'insensitive' };
  }
  if (filters.source) {
    where.source = filters.source;
  }
  if (filters.search && filters.search.trim()) {
    where.OR = [
      { subject: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { ticketNo: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Sortable fields whitelist
  const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'ticketNo'];
  const sortBy = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'createdAt';
  const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        _count: { select: { replies: true, files: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Gets a single ticket by ID with replies and files, scoped to tenant.
 * @param {string} tenantId
 * @param {string} ticketId
 * @returns {Promise<object|null>}
 */
const getTicket = async (tenantId, ticketId) => {
  return prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId },
    include: {
      replies: { orderBy: { createdAt: 'asc' } },
      files: true,
      chatSession: {
        select: { id: true, sessionKey: true, customerEmail: true, customerName: true },
      },
    },
  });
};

/**
 * Creates a new support ticket.
 * @param {object} data
 * @param {string} data.tenantId
 * @param {string} data.email
 * @param {string} data.subject
 * @param {string} data.description
 * @param {string} [data.category]
 * @param {string} [data.priority]
 * @param {string} [data.source]
 * @param {string} [data.chatSessionId]
 * @returns {Promise<object>}
 */
const createTicket = async (data) => {
  const ticketNo = generateTicketNo();

  const ticket = await prisma.supportTicket.create({
    data: {
      tenantId: data.tenantId,
      ticketNo,
      email: data.email,
      subject: data.subject,
      description: data.description,
      category: data.category || 'general',
      priority: data.priority || 'medium',
      source: data.source || 'web',
      chatSessionId: data.chatSessionId || null,
    },
    include: {
      replies: true,
      _count: { select: { replies: true, files: true } },
    },
  });

  return ticket;
};

/**
 * Updates a ticket's mutable fields (status, priority, category, assignedTo).
 * @param {string} tenantId
 * @param {string} ticketId
 * @param {object} data
 * @returns {Promise<object|null>}
 */
const updateTicket = async (tenantId, ticketId, data) => {
  const existing = await prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId },
  });
  if (!existing) return null;

  const allowedFields = {};
  if (data.status !== undefined) allowedFields.status = data.status;
  if (data.priority !== undefined) allowedFields.priority = data.priority;
  if (data.category !== undefined) allowedFields.category = data.category;
  if (data.assignedTo !== undefined) allowedFields.assignedTo = data.assignedTo;

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: allowedFields,
    include: {
      replies: { orderBy: { createdAt: 'asc' } },
      files: true,
      _count: { select: { replies: true, files: true } },
    },
  });
};

/**
 * Adds a reply to a ticket.
 * @param {string} tenantId
 * @param {string} ticketId
 * @param {string} from - 'admin' | 'customer' | 'ai'
 * @param {string} message
 * @returns {Promise<object|null>} The reply, or null if ticket not found
 */
const addReply = async (tenantId, ticketId, from, message) => {
  const existing = await prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId },
  });
  if (!existing) return null;

  const reply = await prisma.ticketReply.create({
    data: { ticketId, from, message },
  });

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { updatedAt: new Date() },
  });

  return reply;
};

/**
 * Deletes a ticket and all its replies/files (cascades).
 * @param {string} tenantId
 * @param {string} ticketId
 * @returns {Promise<boolean>}
 */
const deleteTicket = async (tenantId, ticketId) => {
  const existing = await prisma.supportTicket.findFirst({
    where: { id: ticketId, tenantId },
  });
  if (!existing) return false;

  await prisma.supportTicket.delete({ where: { id: ticketId } });
  return true;
};

/**
 * Returns distinct ticket categories for a tenant.
 * @param {string} tenantId
 * @returns {Promise<string[]>}
 */
const getCategories = async (tenantId) => {
  const result = await prisma.supportTicket.findMany({
    where: { tenantId },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return result.map((r) => r.category);
};

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  addReply,
  deleteTicket,
  getCategories,
};
