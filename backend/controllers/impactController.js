const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const ImpactRecord = require('../models/ImpactRecord');
const Organization = require('../models/Organization');
const User = require('../models/User');

/**
 * Extracts estimated meal count from donation quantity string.
 * Example strings: "50 plates", "20 kg", "100 meals", "35 packets"
 */
const parseMealsCount = (qtyStr) => {
  if (!qtyStr) return 0;
  const str = String(qtyStr).toLowerCase().trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 10; // sensible fallback
  const num = parseFloat(match[1]);

  if (str.includes('kg') || str.includes('kilo')) {
    // Standard FAO conversion: ~1 kg food = ~2.5 meals
    return Math.round(num * 2.5);
  }
  return Math.round(num);
};

/**
 * Extracts estimated weight in kg from waste request quantity string.
 * Example strings: "25 kg", "500 g", "2 tons", "40 bags"
 */
const parseWeightKg = (qtyStr) => {
  if (!qtyStr) return 0;
  const str = String(qtyStr).toLowerCase().trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 5;
  const num = parseFloat(match[1]);

  if (str.includes('ton')) return num * 1000;
  if (str.includes('g') && !str.includes('kg')) return num / 1000;
  return num;
};

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
    const monthlyHistory = await ImpactRecord.find().sort({ period: 1 }).limit(12);

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
      monthlyHistory
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record/Snapshot current month metrics into ImpactRecord collection
// @route   POST /api/admin/impact/snapshot
// @access  Private/Admin
const recordMonthlySnapshot = async (req, res) => {
  try {
    const currentPeriod = req.body.period || new Date().toISOString().slice(0, 7); // e.g. "2026-10"

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

    const record = await ImpactRecord.findOneAndUpdate(
      { period: currentPeriod },
      {
        mealsRescued,
        kgRecycled,
        kgOrganicDiverted,
        districtsCovered: Array.from(districts),
        period: currentPeriod
      },
      { new: true, upsert: true }
    );

    res.json({
      message: `Impact record saved for period ${currentPeriod}`,
      record
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPublicImpact,
  recordMonthlySnapshot,
  parseMealsCount,
  parseWeightKg
};
