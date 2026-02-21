const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');

/**
 * Creates a new chat session for a tenant.
 * @param {object} data
 * @param {string} data.tenantId
 * @param {string} [data.customerEmail]
 * @param {string} [data.customerName]
 * @param {string} [data.userAgent]
 * @param {string} [data.ipAddress]
 * @returns {Promise<object>} Created session with sessionKey
 */
const createSession = async (data) => {
  const session = await prisma.chatSession.create({
    data: {
      tenantId: data.tenantId,
      sessionKey: uuidv4(),
      customerEmail: data.customerEmail || null,
      customerName: data.customerName || null,
      userAgent: data.userAgent || null,
      ipAddress: data.ipAddress || null,
    },
  });

  return session;
};

/**
 * Gets a session by sessionKey, scoped to tenant.
 * @param {string} tenantId
 * @param {string} sessionKey
 * @returns {Promise<object|null>}
 */
const getSessionByKey = async (tenantId, sessionKey) => {
  return prisma.chatSession.findFirst({
    where: { tenantId, sessionKey },
  });
};

/**
 * Gets a session by ID, scoped to tenant.
 * @param {string} tenantId
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
const getSession = async (tenantId, sessionId) => {
  return prisma.chatSession.findFirst({
    where: { tenantId, id: sessionId },
  });
};

/**
 * Gets or creates a chat session.
 * If sessionKey is provided and valid, returns existing session.
 * Otherwise creates a new one.
 * @param {string} tenantId
 * @param {object} data
 * @param {string} [data.sessionKey]
 * @param {string} [data.customerEmail]
 * @param {string} [data.customerName]
 * @param {string} [data.userAgent]
 * @param {string} [data.ipAddress]
 * @returns {Promise<{session: object, isNew: boolean}>}
 */
const getOrCreateSession = async (tenantId, data) => {
  if (data.sessionKey) {
    const existing = await getSessionByKey(tenantId, data.sessionKey);
    if (existing && existing.status !== 'closed') {
      return { session: existing, isNew: false };
    }
  }

  const session = await createSession({
    tenantId,
    customerEmail: data.customerEmail,
    customerName: data.customerName,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
  });

  return { session, isNew: true };
};

/**
 * Adds a message to a chat session.
 * @param {object} data
 * @param {string} data.sessionId
 * @param {string} data.role - 'user' | 'assistant' | 'system'
 * @param {string} data.content
 * @param {string} [data.inputMethod] - 'text' | 'voice'
 * @param {number} [data.tokenCount]
 * @param {object} [data.metadata]
 * @returns {Promise<object>} Created message
 */
const addMessage = async (data) => {
  const message = await prisma.chatMessage.create({
    data: {
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      inputMethod: data.inputMethod || 'text',
      tokenCount: data.tokenCount || 0,
      metadata: data.metadata || {},
    },
  });

  // Touch the session's updatedAt
  await prisma.chatSession.update({
    where: { id: data.sessionId },
    data: { updatedAt: new Date() },
  });

  return message;
};

/**
 * Gets the full message history for a chat session.
 * @param {string} sessionId
 * @returns {Promise<Array<object>>}
 */
const getSessionMessages = async (sessionId) => {
  return prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
};

/**
 * Gets the message history for a session by sessionKey (public lookup).
 * @param {string} tenantId
 * @param {string} sessionKey
 * @returns {Promise<{session: object, messages: object[]}|null>}
 */
const getHistoryByKey = async (tenantId, sessionKey) => {
  const session = await prisma.chatSession.findFirst({
    where: { tenantId, sessionKey },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!session) return null;

  return {
    session: {
      id: session.id,
      sessionKey: session.sessionKey,
      status: session.status,
      customerEmail: session.customerEmail,
      customerName: session.customerName,
      createdAt: session.createdAt,
    },
    messages: session.messages,
  };
};

/**
 * Updates a session's status.
 * @param {string} tenantId
 * @param {string} sessionId
 * @param {string} status - 'active' | 'escalated' | 'closed'
 * @returns {Promise<object|null>}
 */
const updateSessionStatus = async (tenantId, sessionId, status) => {
  const existing = await getSession(tenantId, sessionId);
  if (!existing) return null;

  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { status },
  });
};

/**
 * Updates a session's customer info.
 * @param {string} sessionId
 * @param {object} data
 * @param {string} [data.customerEmail]
 * @param {string} [data.customerName]
 * @returns {Promise<object>}
 */
const updateSessionCustomer = async (sessionId, data) => {
  const updateData = {};
  if (data.customerEmail !== undefined) updateData.customerEmail = data.customerEmail;
  if (data.customerName !== undefined) updateData.customerName = data.customerName;

  return prisma.chatSession.update({
    where: { id: sessionId },
    data: updateData,
  });
};

/**
 * Closes a chat session.
 * @param {string} tenantId
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
const closeSession = async (tenantId, sessionId) => {
  return updateSessionStatus(tenantId, sessionId, 'closed');
};

/**
 * Escalates a chat session.
 * @param {string} tenantId
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
const escalateSession = async (tenantId, sessionId) => {
  return updateSessionStatus(tenantId, sessionId, 'escalated');
};

module.exports = {
  createSession,
  getSession,
  getSessionByKey,
  getOrCreateSession,
  addMessage,
  getSessionMessages,
  getHistoryByKey,
  updateSessionStatus,
  updateSessionCustomer,
  closeSession,
  escalateSession,
};
