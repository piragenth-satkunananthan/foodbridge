/**
 * Background Scheduler & Data Integrity Service
 * Performs automated snapshot calculation and freshness checks.
 */

const Donation = require('../models/Donation');
const ImpactRecord = require('../models/ImpactRecord');
const { calculateAggregatedImpact } = require('../controllers/impactController');

const runPeriodicFreshnessCheck = async () => {
  try {
    const now = new Date();
    // Find active posted donations where expiryTime has passed
    const expiredDonations = await Donation.find({
      status: 'posted',
      expiryTime: { $lt: now }
    });

    if (expiredDonations.length > 0) {
      console.log(`[Cron] Found ${expiredDonations.length} expired donation(s). Transitioning status...`);
      for (const d of expiredDonations) {
        d.status = 'cancelled';
        await d.save();
      }
      console.log(`[Cron] Successfully updated ${expiredDonations.length} donation(s) to cancelled.`);
    }
  } catch (err) {
    console.error('[Cron] Error running freshness check:', err.message);
  }
};

const runMonthlyImpactSnapshot = async () => {
  try {
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    const existingSnapshot = await ImpactRecord.findOne({ period: currentPeriod });

    if (!existingSnapshot) {
      const stats = await calculateAggregatedImpact();
      await ImpactRecord.create({
        period: currentPeriod,
        mealsRescued: stats.mealsRescued,
        kgRecycled: stats.kgRecycled,
        kgOrganicDiverted: stats.kgOrganicDiverted,
        districtsCovered: stats.districtsCovered
      });
      console.log(`[Cron] Automatically recorded persistent monthly impact snapshot for period: ${currentPeriod}`);
    }
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
  }, 15 * 60 * 1000);

  // Unref interval so it does not prevent clean process termination in test environments
  if (interval.unref) interval.unref();
};

module.exports = {
  initCronJobs,
  runPeriodicFreshnessCheck,
  runMonthlyImpactSnapshot
};
