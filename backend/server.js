require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// ── Route imports ──
const authRoutes = require('./routes/auth');
const predictRoutes = require('./routes/predict');
const dashboardRoutes = require('./routes/dashboard');
const chatbotRoutes = require('./routes/chatbot');
const diagnoseRoutes = require('./routes/diagnose');
const ocrRoutes = require('./routes/ocr');
const vitalsRoutes = require('./routes/vitals');

// ── Init ──
const app = express();
const PORT = process.env.PORT || 5001;

// ── Global middleware ──
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: true,  // Allow all origins (Android app + local network + frontend)
    credentials: true,
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Higher limit for real-time vitals (every 5s = 180/15min from each device)
const vitalsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, error: 'Vitals rate limit exceeded.' },
});
app.use('/api/vitals', vitalsLimiter);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'biotwin-ai-backend',
      status: 'running',
      timestamp: new Date().toISOString(),
    },
  });
});

// ── API routes ──
app.use('/api/auth', authRoutes);
app.use('/api/predict', predictRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/diagnose', diagnoseRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/vitals', vitalsRoutes);

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──
app.use((err, _req, res, _next) => {
  console.error('🔥 Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ── Start with Socket.IO ──
const http = require('http');
const { Server: SocketIO } = require('socket.io');

const start = async () => {
  await connectDB();
  await connectRedis();

  const server = http.createServer(app);

  // ── Socket.IO for real-time vitals ──
  const io = new SocketIO(server, {
    cors: {
      origin: true,  // Allow all origins for real-time connections
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io accessible from routes via req.app.get('io')
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Client joins their personal room for targeted pushes
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`👤 ${socket.id} joined room user:${userId}`);
    });

    // Join global vitals feed
    socket.on('join:feed', () => {
      socket.join('vitals:feed');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BioTwin API running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO ready for real-time vitals`);
  });
};

start();

module.exports = app; // for testing
