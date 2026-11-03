const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const ImpactRecord = require('../models/ImpactRecord');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { parseMealsCount, parseWeightKg } = require('../utils/quantity');
const { endpoint, fail } = require('../utils/domain');
const confirmedFilter = {
  status: 'completed',
  isDemo: { $ne: true },
  completedAt: { $type: 'date' }
};
async function calculateImpactMetrics(extra = {}) {
  const [food, waste] = await Promise.all([
    Donation.find({ ...confirmedFilter, ...extra }).select('quantity district'),
    WasteRequest.find({ ...confirmedFilter, ...extra }).select(
      'wasteCategory quantity district processingOutcome'
    )
  ]);
  const stats = {
    mealsRescued: 0,
    kgRecycled: { plastic: 0, glass: 0, paper: 0, metal: 0 },
    kgOrganicDiverted: 0,
    districtsCovered: []
  };
  const districts = new Set();
  for (const item of food) {
    stats.mealsRescued += parseMealsCount(item.quantity);
    if (item.district) districts.add(item.district);
  }
  for (const item of waste) {
    const kg = parseWeightKg(item.quantity);
    if (
      item.wasteCategory === 'organic' &&
      item.processingOutcome === 'composted'
    ) {
      stats.kgOrganicDiverted += kg;
      if (item.district) districts.add(item.district);
    } else if (
      stats.kgRecycled[item.wasteCategory] !== undefined &&
      item.processingOutcome === 'recycled'
    ) {
      stats.kgRecycled[item.wasteCategory] += kg;
      if (item.district) districts.add(item.district);
    }
  }
  stats.districtsCovered = [...districts].sort();
  return stats;
}
const getPublicImpact = endpoint(async (req, res) => {
  const stats = await calculateImpactMetrics();
  const activeIds = await User.find({
    status: 'active',
    isDemo: { $ne: true }
  }).distinct('_id');
  const orgFilter = {
    verificationStatus: 'verified',
    isDemo: { $ne: true },
    linkedUser: { $in: activeIds }
  };
  const [
    verifiedNGOs,
    verifiedRecyclers,
    activeVolunteers,
    totalDonationsLogged,
    totalWasteLogged,
    completedDonationsCount,
    completedWasteCount,
    monthlyHistory
  ] = await Promise.all([
    Organization.countDocuments({
      ...orgFilter,
      type: { $in: ['ngo', 'charity', 'shelter'] }
    }),
    Organization.countDocuments({
      ...orgFilter,
      type: { $in: ['recycler', 'composting_facility'] }
    }),
    User.countDocuments({
      role: 'volunteer',
      status: 'active',
      isDemo: { $ne: true }
    }),
    Donation.countDocuments({ isDemo: { $ne: true } }),
    WasteRequest.countDocuments({ isDemo: { $ne: true } }),
    Donation.countDocuments(confirmedFilter),
    WasteRequest.countDocuments(confirmedFilter),
    ImpactRecord.find({ isDemo: { $ne: true } })
      .sort({ period: -1 })
      .limit(12)
  ]);
  res.json({
    summary: {
      ...stats,
      totalKgRecycled: Object.values(stats.kgRecycled).reduce(
        (a, b) => a + b,
        0
      ),
      districtsCoveredCount: stats.districtsCovered.length
    },
    ecosystem: {
      verifiedNGOs,
      verifiedRecyclers,
      activeVolunteers,
      totalDonationsLogged,
      totalWasteLogged,
      completedDonationsCount,
      completedWasteCount
    },
    snapshotType: 'cumulative',
    quantityBasis:
      'organization-confirmed donor quantities; meals estimated at 2.5 per kg',
    monthlyHistory: monthlyHistory.reverse()
  });
});
const recordMonthlySnapshot = endpoint(async (req, res) => {
  const currentPeriod = new Date().toISOString().slice(0, 7);
  if (req.body.period && req.body.period !== currentPeriod)
    fail(400, 'Cumulative snapshots can only be saved for the current month.');
  const stats = await calculateImpactMetrics();
  const record = await ImpactRecord.findOneAndUpdate(
    { period: currentPeriod, isDemo: false },
    { $set: { ...stats, period: currentPeriod, isDemo: false } },
    { returnDocument: 'after', upsert: true }
  );
  res.json({
    message: `Cumulative impact snapshot saved for period ${currentPeriod}`,
    record
  });
});
module.exports = {
  getPublicImpact,
  calculateImpactMetrics,
  recordMonthlySnapshot,
  parseMealsCount,
  parseWeightKg,
  confirmedFilter
};
