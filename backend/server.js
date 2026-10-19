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

const app = express();

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
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
