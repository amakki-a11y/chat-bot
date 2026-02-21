require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const createCorsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth.routes');
const ownerRoutes = require('./routes/owner.routes');
const chatRoutes = require('./routes/chat.routes');
const ticketRoutes = require('./routes/ticket.routes');
const kbRoutes = require('./routes/kb.routes');
const faqRoutes = require('./routes/faq.routes');
const webhookRoutes = require('./routes/webhook.routes');
const widgetRoutes = require('./routes/widget.routes');
const fileRoutes = require('./routes/file.routes');
const { startRetryJob } = require('./jobs/webhookRetry');

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
      : ['http://localhost:5173'],
    methods: ['GET', 'POST'],
  },
});

// Make io accessible in routes
app.set('io', io);

// Global middleware
app.use(createCorsMiddleware());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/files', fileRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'API endpoint not found',
    statusCode: 404,
  });
});

// Serve static files
const path = require('path');

if (process.env.NODE_ENV === 'production') {
  // Production: serve built React frontend
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // Development: serve test console from /public
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Global error handler (must be last)
app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('join_tenant', (tenantId) => {
    socket.join(`tenant_${tenantId}`);
  });

  socket.on('join_session', (sessionId) => {
    socket.join(`session_${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Support Hub running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
  startRetryJob();
  console.log('[Server] Webhook retry job started (60s interval)');
});

module.exports = { app, httpServer, io };
