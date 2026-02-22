// PropFlow API Server
// Express + Supabase + Anthropic AI
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Middleware ──────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Global Rate Limiter ────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ── Routes ─────────────────────────────────────
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/listings',   require('./routes/listings.routes'));
app.use('/api/enquiries',  require('./routes/enquiries.routes'));
app.use('/api/agents',     require('./routes/agents.routes'));
app.use('/api/analytics',  require('./routes/analytics.routes'));
app.use('/api/chat',       require('./routes/chat.routes'));
app.use('/api/uploads',    require('./routes/uploads.routes'));

// ── Health Check ───────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
  });
});

// ── 404 Handler ────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ───────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message, err.stack);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ── Start ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏠 PropFlow API running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV}`);
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

module.exports = app;
