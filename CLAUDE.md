# Support Hub SaaS — AI Customer Support Platform

## Project Overview
A white-label, multi-tenant SaaS platform where business owners can set up, train, and manage their own AI-powered customer support system. Built with React frontend + Node.js/Express/Prisma/PostgreSQL backend.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Auth**: JWT + bcrypt
- **File Storage**: Local disk (dev) / S3-compatible (prod)
- **Hosting**: Railway (or any Node.js host)
- **Real-time**: Socket.io (for live chat agent view)

## Architecture

```
support-hub/
├── CLAUDE.md                    # This file — project instructions
├── package.json
├── .env
├── prisma/
│   └── schema.prisma            # Full database schema
├── src/
│   ├── server.js                # Express entry point
│   ├── config/
│   │   ├── database.js          # Prisma client singleton
│   │   └── constants.js         # App-wide constants
│   ├── middleware/
│   │   ├── auth.js              # JWT auth + role-based access
│   │   ├── rateLimiter.js       # Per-tenant rate limiting
│   │   ├── fileUpload.js        # Multer config per tenant settings
│   │   └── cors.js              # Dynamic CORS per tenant
│   ├── routes/
│   │   ├── auth.routes.js       # Register, login, refresh token
│   │   ├── owner.routes.js      # Owner dashboard APIs
│   │   ├── chat.routes.js       # Public chat + AI endpoints
│   │   ├── ticket.routes.js     # Ticket CRUD (public + admin)
│   │   ├── kb.routes.js         # Knowledge base CRUD
│   │   ├── faq.routes.js        # FAQ management
│   │   ├── webhook.routes.js    # Webhook config + logs
│   │   ├── widget.routes.js     # Widget embed config endpoint
│   │   └── file.routes.js       # File upload/download
│   ├── services/
│   │   ├── ai.service.js        # Claude API + RAG context building
│   │   ├── kb.service.js        # Knowledge base search (keyword + fuzzy)
│   │   ├── ticket.service.js    # Ticket lifecycle management
│   │   ├── webhook.service.js   # Event dispatch + HMAC + retry
│   │   ├── chat.service.js      # Session management + message logging
│   │   ├── file.service.js      # File storage abstraction
│   │   └── rateLimit.service.js # Token bucket per tenant
│   ├── utils/
│   │   ├── embeddings.js        # Lightweight keyword-based search
│   │   ├── sanitize.js          # Input sanitization
│   │   └── helpers.js           # General utilities
│   └── jobs/
│       └── webhookRetry.js      # Background retry for failed webhooks
├── client/                      # React frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx              # Router setup
│   │   ├── api/
│   │   │   └── client.js        # Axios instance with auth interceptor
│   │   ├── stores/
│   │   │   └── authStore.js     # Zustand auth state
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx    # Main owner dashboard shell
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Topbar.jsx
│   │   │   │   └── DashboardLayout.jsx
│   │   │   ├── training/
│   │   │   │   ├── BotPersonality.jsx
│   │   │   │   ├── SystemPrompt.jsx
│   │   │   │   └── RateLimits.jsx
│   │   │   ├── kb/
│   │   │   │   ├── KBList.jsx
│   │   │   │   ├── KBForm.jsx       # Text/URL/File source types
│   │   │   │   └── KBSourceUpload.jsx
│   │   │   ├── faq/
│   │   │   │   ├── FAQList.jsx
│   │   │   │   └── FAQForm.jsx
│   │   │   ├── tickets/
│   │   │   │   ├── TicketList.jsx
│   │   │   │   ├── TicketDetail.jsx
│   │   │   │   └── TicketReply.jsx
│   │   │   ├── webhooks/
│   │   │   │   ├── WebhookEndpoints.jsx
│   │   │   │   ├── WebhookForm.jsx
│   │   │   │   └── WebhookLogs.jsx
│   │   │   ├── channels/
│   │   │   │   ├── ChannelToggles.jsx
│   │   │   │   └── FileSettings.jsx
│   │   │   ├── branding/
│   │   │   │   └── BrandingForm.jsx
│   │   │   ├── analytics/
│   │   │   │   └── AnalyticsDashboard.jsx
│   │   │   └── preview/
│   │   │       └── WidgetPreview.jsx  # Live widget preview
│   │   └── widget/                   # Embeddable client widget
│   │       ├── SupportWidget.jsx      # Standalone deployable widget
│   │       ├── ChatPanel.jsx
│   │       ├── FAQPanel.jsx
│   │       ├── TicketPanel.jsx
│   │       └── widget-embed.js        # <script> embed loader
│   └── public/
└── scripts/
    ├── seed.js                  # Seed demo data
    └── migrate.js               # Migration helper
```

## Database Schema (Prisma)

### Core Models:

**Tenant** — Each business owner is a tenant
- id, name, email, passwordHash, plan (free/pro/enterprise)
- botConfig (JSON): { name, greeting, systemPrompt, tone, language }
- brandConfig (JSON): { name, logo, accent }
- channelConfig (JSON): { chat, voice, voiceNote, call, faq, tickets, fileAttach }
- fileConfig (JSON): { maxSizeMb, allowedTypes, maxFiles }
- rateLimitConfig (JSON): { messagesPerMin, messagesPerDay, tokensPerMsg }
- apiKey (for widget authentication)
- createdAt, updatedAt

**KnowledgeBase** — RAG documents per tenant
- id, tenantId, title, content, category, tags[], sourceType (text/url/file)
- sourceUrl, fileName, filePath, isActive
- createdAt, updatedAt

**FAQ** — Per-tenant FAQs
- id, tenantId, question, answer, category, sortOrder, isActive

**ChatSession** — Customer chat sessions
- id, tenantId, sessionKey, customerEmail, customerName
- userAgent, ipAddress, status (active/escalated/closed)
- metadata (JSON)

**ChatMessage** — Messages within sessions
- id, sessionId, role (user/assistant/system), content
- inputMethod (text/voice), tokenCount, metadata

**SupportTicket** — Customer tickets
- id, tenantId, ticketNo, email, subject, category, priority, status
- description, source (web/chat/voice/api), assignedTo
- chatSessionId (link to originating chat)

**TicketReply** — Replies on tickets
- id, ticketId, from (admin/customer/ai), message, metadata

**TicketFile** — File attachments on tickets/chat
- id, tenantId, ticketId (optional), chatMessageId (optional)
- originalName, storedPath, mimeType, sizeBytes

**WebhookEndpoint** — Per-tenant webhook config
- id, tenantId, name, url, secret, events[], isActive

**WebhookLog** — Delivery log
- id, endpointId, event, payload, statusCode, success, retries, error

## Key Business Logic

### RAG Flow:
1. Customer sends message
2. Extract keywords from message
3. Search tenant's KnowledgeBase (keyword + fuzzy match, scored)
4. Take top 5 results above threshold
5. Build enhanced system prompt: tenant.botConfig.systemPrompt + KB context + FAQ context
6. Call Claude API with conversation history
7. Parse response for ticket creation triggers
8. Log everything to ChatMessage table
9. Fire webhooks (chat_message event)

### Ticket Creation from Chat:
- AI detects intent (phrases like "create ticket", "report bug", etc.)
- AI responds with ```ticket JSON block
- Frontend parses and shows inline ticket preview
- Customer confirms → POST /api/tickets/from-chat
- Webhook fires: ticket_created

### Rate Limiting:
- Per-tenant configurable limits
- Token bucket algorithm
- Track: messages per minute, messages per day, tokens per message
- Return 429 with retry-after header when exceeded

### Webhook System:
- Owner configures endpoints + selects events
- On event → sign payload with HMAC-SHA256 → POST to URL
- Retry with exponential backoff (3 attempts)
- Log every attempt with status

### File Uploads:
- Multer middleware configured per-tenant settings
- Validate: file type, size, count against tenant.fileConfig
- Store to /uploads/{tenantId}/{year}/{month}/ (or S3)
- Reference in TicketFile or ChatMessage metadata

## Coding Standards
- Use async/await everywhere, no callbacks
- Prisma for all DB access (no raw SQL)
- Input validation with express-validator or zod
- Error handling: wrap routes in asyncHandler utility
- Environment variables for all secrets
- Use service layer pattern: routes → services → prisma
- Keep controllers thin, business logic in services
- Use JSDoc comments on service methods

## API Authentication
- **Owner routes**: JWT Bearer token (from login)
- **Widget/chat routes**: Tenant API key in X-API-Key header
- **Public routes**: Rate limited by IP

## Widget Embed System
The client widget is built as a standalone React component that business owners embed on their site:
```html
<script src="https://yourdomain.com/widget.js" data-tenant-key="tk_xxxxx"></script>
```
The widget.js script:
1. Creates an iframe or shadow DOM container
2. Loads the widget React app
3. Passes the tenant API key for authentication
4. Fetches tenant config (brand, channels, FAQs) on mount
5. All chat/ticket APIs go through the tenant's API key

## Development Commands
```bash
# Install dependencies
npm install && cd client && npm install && cd ..

# Set up database
npx prisma migrate dev --name init
npx prisma generate
node scripts/seed.js

# Development
npm run dev          # Runs backend on :3001
cd client && npm run dev  # Runs frontend on :5173

# Production build
cd client && npm run build  # Outputs to client/dist
npm start            # Serves API + static frontend
```

## Build Phases

### Phase 1: Foundation (Start Here)
1. Initialize project: npm init, install deps, set up Express
2. Create Prisma schema with ALL models
3. Set up auth routes (register/login/JWT)
4. Create basic middleware (auth, error handler, cors)
5. Seed script with demo tenant

### Phase 2: Owner Dashboard Backend
6. Owner profile/settings CRUD
7. Bot training endpoints (save/get config)
8. Knowledge base CRUD + search service
9. FAQ CRUD
10. Ticket CRUD + reply + status updates
11. Channel & file settings endpoints

### Phase 3: AI & Chat
12. AI service (Claude API integration)
13. RAG search + context building
14. Chat session management
15. Ticket creation from chat
16. Rate limiting middleware

### Phase 4: Webhooks & Files
17. Webhook endpoint CRUD
18. Webhook dispatch service + retry
19. Webhook log viewing
20. File upload middleware + storage
21. File settings per tenant

### Phase 5: Frontend (React)
22. Auth pages (login/register)
23. Dashboard layout (sidebar, topbar)
24. Bot training page
25. Knowledge base page (3 source types)
26. FAQ manager page
27. Ticket list + detail + reply
28. Webhook manager (endpoints + logs)
29. Channel controls + file settings
30. Branding page
31. Analytics dashboard
32. Widget preview

### Phase 6: Embeddable Widget
33. Standalone widget component
34. Chat with AI (uses tenant API key)
35. FAQ browser
36. Ticket submission form
37. File attachment in chat
38. Voice input (Web Speech API)
39. widget-embed.js loader script

### Phase 7: Polish & Deploy
40. Error handling & validation everywhere
41. Loading states & optimistic updates
42. Mobile responsive
43. Environment config for Railway
44. Deploy backend + frontend to Railway
45. Custom domain setup
