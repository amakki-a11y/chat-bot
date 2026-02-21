-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('free', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'escalated', 'closed');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('text', 'voice');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('open', 'in_progress', 'waiting', 'resolved', 'closed');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('web', 'chat', 'voice', 'api');

-- CreateEnum
CREATE TYPE "ReplyFrom" AS ENUM ('admin', 'customer', 'ai');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('text', 'url', 'file');

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'free',
    "apiKey" TEXT NOT NULL,
    "botConfig" JSONB NOT NULL DEFAULT '{"name": "Support Bot", "greeting": "Hello! How can I help you today?", "systemPrompt": "You are a helpful customer support assistant.", "tone": "professional", "language": "en"}',
    "brandConfig" JSONB NOT NULL DEFAULT '{"name": "", "logo": "", "accent": "#2563eb"}',
    "channelConfig" JSONB NOT NULL DEFAULT '{"chat": true, "voice": false, "voiceNote": false, "call": false, "faq": true, "tickets": true, "fileAttach": true}',
    "fileConfig" JSONB NOT NULL DEFAULT '{"maxSizeMb": 10, "allowedTypes": ["image/png", "image/jpeg", "application/pdf", "text/plain"], "maxFiles": 5}',
    "rateLimitConfig" JSONB NOT NULL DEFAULT '{"messagesPerMin": 10, "messagesPerDay": 100, "tokensPerMsg": 2000}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceType" "SourceType" NOT NULL DEFAULT 'text',
    "sourceUrl" TEXT,
    "fileName" TEXT,
    "filePath" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeBase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FAQ" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionKey" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'active',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "inputMethod" "InputMethod" NOT NULL DEFAULT 'text',
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "priority" "TicketPriority" NOT NULL DEFAULT 'medium',
    "status" "TicketStatus" NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "source" "TicketSource" NOT NULL DEFAULT 'web',
    "assignedTo" TEXT,
    "chatSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketReply" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "from" "ReplyFrom" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketReply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketFile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ticketId" TEXT,
    "chatMessageId" TEXT,
    "originalName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "retries" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_email_key" ON "Tenant"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_apiKey_key" ON "Tenant"("apiKey");

-- CreateIndex
CREATE INDEX "KnowledgeBase_tenantId_idx" ON "KnowledgeBase"("tenantId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_tenantId_category_idx" ON "KnowledgeBase"("tenantId", "category");

-- CreateIndex
CREATE INDEX "KnowledgeBase_tenantId_isActive_idx" ON "KnowledgeBase"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "FAQ_tenantId_idx" ON "FAQ"("tenantId");

-- CreateIndex
CREATE INDEX "FAQ_tenantId_isActive_idx" ON "FAQ"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "FAQ_tenantId_category_idx" ON "FAQ"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_sessionKey_key" ON "ChatSession"("sessionKey");

-- CreateIndex
CREATE INDEX "ChatSession_tenantId_idx" ON "ChatSession"("tenantId");

-- CreateIndex
CREATE INDEX "ChatSession_tenantId_status_idx" ON "ChatSession"("tenantId", "status");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNo_key" ON "SupportTicket"("ticketNo");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_idx" ON "SupportTicket"("tenantId");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_status_idx" ON "SupportTicket"("tenantId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_tenantId_priority_idx" ON "SupportTicket"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_email_idx" ON "SupportTicket"("email");

-- CreateIndex
CREATE INDEX "TicketReply_ticketId_idx" ON "TicketReply"("ticketId");

-- CreateIndex
CREATE INDEX "TicketFile_tenantId_idx" ON "TicketFile"("tenantId");

-- CreateIndex
CREATE INDEX "TicketFile_ticketId_idx" ON "TicketFile"("ticketId");

-- CreateIndex
CREATE INDEX "TicketFile_chatMessageId_idx" ON "TicketFile"("chatMessageId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_tenantId_idx" ON "WebhookEndpoint"("tenantId");

-- CreateIndex
CREATE INDEX "WebhookEndpoint_tenantId_isActive_idx" ON "WebhookEndpoint"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "WebhookLog_endpointId_idx" ON "WebhookLog"("endpointId");

-- CreateIndex
CREATE INDEX "WebhookLog_endpointId_createdAt_idx" ON "WebhookLog"("endpointId", "createdAt");

-- AddForeignKey
ALTER TABLE "KnowledgeBase" ADD CONSTRAINT "KnowledgeBase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FAQ" ADD CONSTRAINT "FAQ_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketReply" ADD CONSTRAINT "TicketReply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFile" ADD CONSTRAINT "TicketFile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFile" ADD CONSTRAINT "TicketFile_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFile" ADD CONSTRAINT "TicketFile_chatMessageId_fkey" FOREIGN KEY ("chatMessageId") REFERENCES "ChatMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookLog" ADD CONSTRAINT "WebhookLog_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
