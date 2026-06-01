require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');

const app = express();

// ======= Connect Database =======
connectDB().then(() => {
  const { generateSitemap } = require('./services/sitemap');
  generateSitemap(process.env.FRONTEND_URL || 'http://localhost:5000').catch(
    () => {},
  );
});
initFirebase();

// ======= Security Middleware =======
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow inline scripts for the frontend
    crossOriginEmbedderPolicy: false,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, try again later.',
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many auth attempts.',
});
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5500', // Live Server
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// HPP — Prevent HTTP parameter pollution
app.use(hpp());

// ======= Body Parsers =======
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ======= Logging =======
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// ======= Static Files (Frontend) =======
app.use(express.static(path.join(__dirname, '..')));

// ======= API Routes =======
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/dealer', require('./routes/dealer'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

// ======= Health Check =======
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '⚙ Lohar Auto Garage API is running',
    timestamp: new Date().toISOString(),
  });
});

// ======= SPA Fallback (serve frontend for non-API routes) =======
app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  } else {
    res.status(404).json({ success: false, message: 'API route not found' });
  }
});

// ======= Global Error Handler =======
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(400)
      .json({ success: false, message: `${field} already exists` });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ======= Start Server =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Lohar Auto Garage Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}\n`);
});

module.exports = app;
