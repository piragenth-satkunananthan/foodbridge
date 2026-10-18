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
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);                  // Module 5 (Admin & Verification)
app.use('/api/impact', impactRoutes);                // Module 5 (Public Impact Dashboard)
app.use('/api/notifications', notificationRoutes);    // Module 5 (In-app Notification Layer)
app.use('/api/donations', donationRoutes);           // Module 1 (Donor & Surplus Posting)
app.use('/api/waste', wasteRoutes);                  // Module 3 (Waste Classification)
app.use('/api/match', matchRoutes);                  // Module 2 (Matching Engine)
app.use('/api/pickups', pickupRoutes);               // Module 4 (Volunteer & Pickup Tracking)

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`FoodBridge Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err.message);
});

module.exports = app;
