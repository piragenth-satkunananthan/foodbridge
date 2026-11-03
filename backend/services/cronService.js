/**
 * Background Scheduler & Data Integrity Service
 * Performs automated snapshot calculation and freshness checks.
 */

const Donation = require('../models/Donation');
const ImpactRecord = require('../models/ImpactRecord');
const { calculateImpactMetrics } = require('../controllers/impactController');

const runPeriodicFreshnessCheck = async () => {
  try {
    await require('./pickupService').expireOverdue();
  } catch (err) {
    console.error('[Cron] Error running freshness check:', err.message);
  }
};

const runMonthlyImpactSnapshot = async () => {
  try {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    const stats = await calculateImpactMetrics();
    await ImpactRecord.findOneAndUpdate(
      { period: currentPeriod },
      { $set: { ...stats, period: currentPeriod } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[Cron] Error executing monthly snapshot cron:', err.message);
  }
};

const initCronJobs = () => {
  console.log('[Cron] Initializing FoodBridge background scheduler...');
  // Run an immediate check on startup after 5 seconds
  setTimeout(() => {
    runPeriodicFreshnessCheck();
    runMonthlyImpactSnapshot();
  }, 5000);

  // Run every 15 minutes in production / background
  const interval = setInterval(() => {
    runPeriodicFreshnessCheck();
    runMonthlyImpactSnapshot();
  }, 15 * 60 * 1000);

  // Unref interval so it does not prevent clean process termination in test environments
  if (interval.unref) interval.unref();
};

module.exports = {
  initCronJobs,
  runPeriodicFreshnessCheck,
  runMonthlyImpactSnapshot
};
