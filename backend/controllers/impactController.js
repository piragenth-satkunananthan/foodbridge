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

const getLiveFeed = endpoint(async (req, res) => {
  const [recentDonations, recentWaste] = await Promise.all([
    Donation.find({ isDemo: { $ne: true } })
      .populate('donor', 'name district')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    WasteRequest.find({ isDemo: { $ne: true } })
      .populate('donor', 'name district')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean()
  ]);

  const items = [
    ...recentDonations.map((d) => ({
      id: d._id,
      type: 'food',
      itemTitle: d.foodType,
      quantity: d.quantity,
      origin: d.donor?.name || 'Commercial Donor',
      district: d.district || 'Colombo',
      status: d.status,
      spec: d.storageCondition ? `${d.storageCondition.toUpperCase()} storage` : 'Ambient',
      createdAt: d.createdAt,
      deadline: d.pickupDeadline
    })),
    ...recentWaste.map((w) => ({
      id: w._id,
      type: 'waste',
      itemTitle: `${w.wasteCategory.toUpperCase()} Recovery`,
      quantity: w.quantity,
      origin: w.donor?.name || 'Commercial Donor',
      district: w.district || 'Colombo',
      status: w.status,
      spec: `Category: ${w.wasteCategory}`,
      createdAt: w.createdAt,
      deadline: w.pickupDeadline
    }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  res.json({ success: true, items });
});

const getDistrictStats = endpoint(async (req, res) => {
  const [donationsByDistrict, orgsByDistrict, volunteersByDistrict] = await Promise.all([
    Donation.aggregate([
      { $match: { isDemo: { $ne: true } } },
      { $group: { _id: '$district', count: { $sum: 1 } } }
    ]),
    Organization.aggregate([
      { $match: { isDemo: { $ne: true }, verificationStatus: 'verified' } },
      { $group: { _id: '$district', count: { $sum: 1 } } }
    ]),
    User.aggregate([
      { $match: { isDemo: { $ne: true }, role: 'volunteer', status: 'active' } },
      { $group: { _id: '$district', count: { $sum: 1 } } }
    ])
  ]);

  const districtMap = {};
  for (const item of donationsByDistrict) {
    if (item._id) districtMap[item._id] = { ...(districtMap[item._id] || {}), donations: item.count };
  }
  for (const item of orgsByDistrict) {
    if (item._id) districtMap[item._id] = { ...(districtMap[item._id] || {}), organizations: item.count };
  }
  for (const item of volunteersByDistrict) {
    if (item._id) districtMap[item._id] = { ...(districtMap[item._id] || {}), volunteers: item.count };
  }

  res.json({ success: true, districts: districtMap });
});

module.exports = {
  getPublicImpact,
  getLiveFeed,
  getDistrictStats,
  calculateImpactMetrics,
  recordMonthlySnapshot,
  parseMealsCount,
  parseWeightKg,
  confirmedFilter
};
