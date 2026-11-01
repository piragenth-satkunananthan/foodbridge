const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const ImpactRecord = require('../models/ImpactRecord');
const Organization = require('../models/Organization');
const User = require('../models/User');

const { parseMealsCount, parseWeightKg } = require('../utils/impactMetrics');

// @desc    Get aggregated public impact metrics
// @route   GET /api/impact
// @access  Public
const getPublicImpact = async (req, res) => {
  try {
    // 1. Completed food donations
    const completedDonations = await Donation.find({
      status: { $in: ['delivered', 'completed'] }
    }).select('quantity district createdAt');

    let mealsRescued = 0;
    const donationDistricts = new Set();
    completedDonations.forEach((d) => {
      mealsRescued += parseMealsCount(d.quantity);
      if (d.district) donationDistricts.add(d.district);
    });

    // 2. Completed/recycled waste requests
    const completedWaste = await WasteRequest.find({
      status: { $in: ['recycled', 'completed'] }
    }).select('wasteCategory quantity district createdAt');

    const kgRecycled = {
      plastic: 0,
      glass: 0,
      paper: 0,
      metal: 0
    };
    let kgOrganicDiverted = 0;
    const wasteDistricts = new Set();

    completedWaste.forEach((w) => {
      const kg = parseWeightKg(w.quantity);
      if (w.district) wasteDistricts.add(w.district);

      if (w.wasteCategory === 'organic') {
        kgOrganicDiverted += kg;
      } else if (kgRecycled[w.wasteCategory] !== undefined) {
        kgRecycled[w.wasteCategory] += kg;
      }
    });

    const totalKgRecycled = Object.values(kgRecycled).reduce((acc, v) => acc + v, 0);

    // Merge active districts
    const allDistricts = Array.from(new Set([...donationDistricts, ...wasteDistricts])).sort();

    // 3. Platform ecosystem counts
    const [verifiedNGOs, verifiedRecyclers, activeVolunteers, totalDonationsLogged, totalWasteLogged] = await Promise.all([
      Organization.countDocuments({ type: { $in: ['ngo', 'charity', 'shelter'] }, verificationStatus: 'verified' }),
      Organization.countDocuments({ type: { $in: ['recycler', 'composting_facility'] }, verificationStatus: 'verified' }),
      User.countDocuments({ role: 'volunteer', status: 'active' }),
      Donation.countDocuments(),
      WasteRequest.countDocuments()
    ]);

    // 4. Historical monthly records from ImpactRecord
    const monthlyHistory = await ImpactRecord.find().sort({ period: -1 }).limit(12);

    res.json({
      summary: {
        mealsRescued,
        totalKgRecycled: Math.round(totalKgRecycled * 10) / 10,
        kgRecycled: {
          plastic: Math.round(kgRecycled.plastic * 10) / 10,
          glass: Math.round(kgRecycled.glass * 10) / 10,
          paper: Math.round(kgRecycled.paper * 10) / 10,
          metal: Math.round(kgRecycled.metal * 10) / 10
        },
        kgOrganicDiverted: Math.round(kgOrganicDiverted * 10) / 10,
        districtsCoveredCount: allDistricts.length,
        districtsCovered: allDistricts
      },
      ecosystem: {
        verifiedNGOs,
        verifiedRecyclers,
        activeVolunteers,
        totalDonationsLogged,
        totalWasteLogged,
        completedDonationsCount: completedDonations.length,
        completedWasteCount: completedWaste.length
      },
      snapshotType: 'cumulative',
      monthlyHistory: monthlyHistory.reverse()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const calculateImpactMetrics = async () => {
  const [completedDonations, completedWaste] = await Promise.all([
    Donation.find({ status: { $in: ['delivered', 'completed'] } }).select('quantity district'),
    WasteRequest.find({ status: { $in: ['recycled', 'completed'] } }).select('wasteCategory quantity district')
  ]);

  let mealsRescued = 0;
  const districts = new Set();
  completedDonations.forEach((d) => {
    mealsRescued += parseMealsCount(d.quantity);
    if (d.district) districts.add(d.district);
  });

  const kgRecycled = {
    plastic: 0,
    glass: 0,
    paper: 0,
    metal: 0
  };
  let kgOrganicDiverted = 0;

  completedWaste.forEach((w) => {
    const kg = parseWeightKg(w.quantity);
    if (w.district) districts.add(w.district);

    if (w.wasteCategory === 'organic') {
      kgOrganicDiverted += kg;
    } else if (kgRecycled[w.wasteCategory] !== undefined) {
      kgRecycled[w.wasteCategory] += kg;
    }
  });

  return {
    mealsRescued,
    kgRecycled,
    kgOrganicDiverted,
    districtsCovered: Array.from(districts).sort()
  };
};

// @desc    Record/Snapshot current month metrics into ImpactRecord collection
// @route   POST /api/admin/impact/snapshot
// @access  Private/Admin
const recordMonthlySnapshot = async (req, res) => {
  try {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    if (req.body.period && req.body.period !== currentPeriod) {
      return res.status(400).json({ message: 'Cumulative snapshots can only be saved for the current month.' });
    }
    const metrics = await calculateImpactMetrics();

    const record = await ImpactRecord.findOneAndUpdate(
      { period: currentPeriod },
      {
        ...metrics,
        period: currentPeriod
      },
      { new: true, upsert: true }
    );

    res.json({
      message: `Cumulative impact snapshot saved for period ${currentPeriod}`,
      record
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPublicImpact,
  recordMonthlySnapshot,
  calculateImpactMetrics,
  parseMealsCount,
  parseWeightKg
};
