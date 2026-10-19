require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

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

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FoodBridge API is running' });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'FoodBridge API root' });
});

// Mounted routes
app.use('/api/auth', authRoutes);                      // Authentication & JWT Sessions
app.use('/api/admin', adminRoutes);                    // Platform Governance & Compliance
app.use('/api/impact', impactRoutes);                  // Public ESG & Ecological Impact Analytics
app.use('/api/notifications', notificationRoutes);     // Real-time Event Notification Engine
app.use('/api/donations', donationRoutes);             // Surplus Food Dispatch
app.use('/api/waste', wasteRoutes);                    // Circular Waste Stream Routing
app.use('/api/match', matchRoutes);                    // Proximity-Based Smart Matching
app.use('/api/pickups', pickupRoutes);                 // Volunteer Logistics & Last-Mile Delivery

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`FoodBridge Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err.message);
});

module.exports = app;
