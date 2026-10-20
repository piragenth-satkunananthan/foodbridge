require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initCronJobs } = require('./services/cronService');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const impactRoutes = require('./routes/impactRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const donationRoutes = require('./routes/donationRoutes');
const wasteRoutes = require('./routes/wasteRoutes');
const matchRoutes = require('./routes/matchRoutes');
const pickupRoutes = require('./routes/pickupRoutes');

const mongoSanitize = require('express-mongo-sanitize');
const app = express();

// Trust reverse proxy (Nginx container in front of Express)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// Rate Limiting (DDoS & Brute Force Protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests from this IP, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Limit auth attempts to 50 per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many login attempts. Please try again after 15 minutes.' }
});

app.use(globalLimiter);

// Secure CORS Whitelist
const defaultAllowedOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://54.234.233.124'
];
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: origin ${origin} not permitted`));
  },
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));
// NoSQL Query Injection Defense (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodBridge API is running', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FoodBridge Enterprise API Core', version: '2.0.0' });
});

// Mounted routes
app.use('/api/auth', authLimiter, authRoutes);          // Authentication with Brute Force Guard
app.use('/api/admin', adminRoutes);                    // Platform Governance & Compliance
app.use('/api/impact', impactRoutes);                  // Public ESG & Ecological Impact Analytics
app.use('/api/notifications', notificationRoutes);     // Real-time Event Notification Engine
app.use('/api/donations', donationRoutes);             // Surplus Food Dispatch
app.use('/api/waste', wasteRoutes);                    // Circular Waste Stream Routing
app.use('/api/match', matchRoutes);                    // Proximity-Based Smart Matching
app.use('/api/pickups', pickupRoutes);                 // Volunteer Logistics & Last-Mile Delivery

// Centralized 404 & Error Handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  initCronJobs();
  app.listen(PORT, () => {
    console.log(`FoodBridge Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err.message);
});

module.exports = app;
