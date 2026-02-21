const Anthropic = require('@anthropic-ai/sdk');
const { CLAUDE_MODEL } = require('../config/constants');
const kbService = require('./kb.service');
const prisma = require('../config/database');

let client;

/**
 * Gets or creates the Anthropic client singleton.
 * @returns {Anthropic}
 */
const getClient = () => {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
};

/**
 * Builds an enhanced system prompt from:
 *  1. Tenant's botConfig.systemPrompt (base)
 *  2. RAG knowledge base context (top 5 matching articles)
 *  3. FAQ context (active FAQs for the tenant)
 *  4. Ticket creation instructions
 *
 * @param {object} tenant - Full tenant record
 * @param {string} userMessage - Latest user message for KB search
 * @returns {Promise<string>} Enhanced system prompt
 */
const buildEnhancedPrompt = async (tenant, userMessage) => {
  const botConfig = tenant.botConfig || {};
  const basePrompt = botConfig.systemPrompt || 'You are a helpful customer support assistant.';
  const botName = botConfig.name || 'Support Bot';
  const tone = botConfig.tone || 'professional';
  const language = botConfig.language || 'en';

  // Search KB for relevant context
  const kbResults = await kbService.searchKnowledgeBase(tenant.id, userMessage);

  // Fetch active FAQs
  const faqs = await prisma.fAQ.findMany({
    where: { tenantId: tenant.id, isActive: true },
    orderBy: { sortOrder: 'asc' },
    take: 15,
  });

  const parts = [];

  parts.push(basePrompt);
  parts.push('');
  parts.push(`Your name is "${botName}". Respond in a ${tone} tone. Language: ${language}.`);

  // KB context
  if (kbResults.length > 0) {
    parts.push('');
    parts.push('=== KNOWLEDGE BASE (use this to answer questions) ===');
    for (const article of kbResults) {
      parts.push('');
      parts.push(`--- ${article.title} [${article.category}] (relevance: ${(article.score * 100).toFixed(0)}%) ---`);
      const content = article.content.length > 1500
        ? article.content.substring(0, 1500) + '...'
        : article.content;
      parts.push(content);
    }
    parts.push('');
    parts.push('=== END KNOWLEDGE BASE ===');
  }

  // FAQ context
  if (faqs.length > 0) {
    parts.push('');
    parts.push('=== FREQUENTLY ASKED QUESTIONS ===');
    for (const faq of faqs) {
      parts.push(`Q: ${faq.question}`);
      parts.push(`A: ${faq.answer}`);
      parts.push('');
    }
    parts.push('=== END FAQ ===');
  }

  // Ticket creation instructions
  parts.push('');
  parts.push('=== TICKET CREATION ===');
  parts.push('If the customer wants to create a support ticket, report a bug, file a complaint, or escalate an issue, respond with a ticket block like this:');
  parts.push('');
  parts.push('```ticket');
  parts.push(JSON.stringify({
    subject: '<brief summary of the issue>',
    description: '<detailed description>',
    category: '<general|shipping|billing|technical|account|warranty>',
    priority: '<low|medium|high|urgent>',
  }, null, 2));
  parts.push('```');
  parts.push('');
  parts.push('Include the ticket block ALONG WITH a human-readable message to the customer confirming you are creating the ticket.');
  parts.push('Only create a ticket if the customer explicitly asks or if the issue clearly requires one.');
  parts.push('=== END TICKET CREATION ===');

  return parts.join('\n');
};

/**
 * Formats the last N messages from chat history into Claude API format.
 * @param {Array<object>} messages - ChatMessage records from DB
 * @param {number} maxMessages - Maximum messages to include
 * @returns {Array<{role: string, content: string}>}
 */
const formatConversationHistory = (messages, maxMessages = 20) => {
  const recent = messages.slice(-maxMessages);

  return recent
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
};

/**
 * Parses ```ticket JSON blocks from an AI response.
 * @param {string} content - AI response content
 * @returns {object|null} Parsed ticket data or null
 */
const parseTicketBlock = (content) => {
  const ticketRegex = /```ticket\s*\n([\s\S]*?)\n```/;
  const match = content.match(ticketRegex);

  if (!match) return null;

  try {
    const ticketData = JSON.parse(match[1]);

    if (!ticketData.subject || !ticketData.description) return null;

    return {
      subject: String(ticketData.subject).slice(0, 300),
      description: String(ticketData.description).slice(0, 10000),
      category: ticketData.category || 'general',
      priority: ['low', 'medium', 'high', 'urgent'].includes(ticketData.priority)
        ? ticketData.priority
        : 'medium',
    };
  } catch {
    return null;
  }
};

/**
 * Strips ticket blocks from AI response for clean display.
 * @param {string} content
 * @returns {string}
 */
const stripTicketBlock = (content) => {
  return content.replace(/```ticket\s*\n[\s\S]*?\n```/g, '').trim();
};

/**
 * Ensures messages alternate between user and assistant roles
 * as required by the Claude API.
 * @param {Array<{role: string, content: string}>} messages
 * @returns {Array<{role: string, content: string}>}
 */
const sanitizeMessageOrder = (messages) => {
  if (messages.length === 0) return [];

  const result = [];
  let lastRole = null;

  for (const msg of messages) {
    if (msg.role === lastRole) {
      // Merge consecutive same-role messages
      result[result.length - 1].content += '\n' + msg.content;
    } else {
      result.push({ ...msg });
      lastRole = msg.role;
    }
  }

  // Claude requires first message to be from 'user'
  if (result.length > 0 && result[0].role !== 'user') {
    result.shift();
  }

  return result;
};

/**
 * Sends a message to Claude with full RAG context and conversation history.
 * @param {object} tenant - Full tenant record
 * @param {string} userMessage - Latest user message
 * @param {Array<object>} chatHistory - Previous ChatMessage records
 * @param {number} [maxTokens]
 * @returns {Promise<{content: string, tokenCount: number, ticketData: object|null, cleanContent: string}>}
 */
const chat = async (tenant, userMessage, chatHistory, maxTokens) => {
  const rateLimitConfig = tenant.rateLimitConfig || {};
  const tokensPerMsg = maxTokens || rateLimitConfig.tokensPerMsg || 2000;

  const systemPrompt = await buildEnhancedPrompt(tenant, userMessage);

  const messages = formatConversationHistory(chatHistory);
  messages.push({ role: 'user', content: userMessage });

  const sanitized = sanitizeMessageOrder(messages);

  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: tokensPerMsg,
    system: systemPrompt,
    messages: sanitized,
  });

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const tokenCount =
    (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  const ticketData = parseTicketBlock(content);
  const cleanContent = ticketData ? stripTicketBlock(content) : content;

  return { content, cleanContent, tokenCount, ticketData };
};

/**
 * Simple sendMessage for direct API calls (backward compatibility).
 * @param {string} systemPrompt
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} maxTokens
 * @returns {Promise<{content: string, tokenCount: number}>}
 */
const sendMessage = async (systemPrompt, messages, maxTokens = 2000) => {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: sanitizeMessageOrder(messages),
  });

  const content = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const tokenCount =
    (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

  return { content, tokenCount };
};

module.exports = {
  chat,
  sendMessage,
  buildEnhancedPrompt,
  formatConversationHistory,
  parseTicketBlock,
  stripTicketBlock,
};
