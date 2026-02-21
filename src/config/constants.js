module.exports = {
  DEFAULT_BOT_CONFIG: {
    name: 'Support Bot',
    greeting: 'Hello! How can I help you today?',
    systemPrompt: 'You are a helpful customer support assistant.',
    tone: 'professional',
    language: 'en',
  },

  DEFAULT_BRAND_CONFIG: {
    name: '',
    logo: '',
    accent: '#2563eb',
  },

  DEFAULT_CHANNEL_CONFIG: {
    chat: true,
    voice: false,
    voiceNote: false,
    call: false,
    faq: true,
    tickets: true,
    fileAttach: true,
  },

  DEFAULT_FILE_CONFIG: {
    maxSizeMb: 10,
    allowedTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'],
    maxFiles: 5,
  },

  DEFAULT_RATE_LIMIT_CONFIG: {
    messagesPerMin: 10,
    messagesPerDay: 100,
    tokensPerMsg: 2000,
  },

  WEBHOOK_EVENTS: [
    'chat_message',
    'chat_session_started',
    'chat_session_closed',
    'ticket_created',
    'ticket_updated',
    'ticket_replied',
    'ticket_closed',
  ],

  CLAUDE_MODEL: 'claude-sonnet-4-20250514',

  RAG_TOP_K: 5,
  RAG_SCORE_THRESHOLD: 0.3,
};
