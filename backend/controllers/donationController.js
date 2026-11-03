const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const Organization = require('../models/Organization');
const { endpoint, fail, pagination, literalRegex } = require('../utils/domain');
const { parseMealsCount } = require('../utils/quantity');
const {
  createPosting,
  changePosting,
  canReadPost,
  pickupHistoryFilter
} = require('../services/postingService');
const createDonation = endpoint(async (req, res) =>
  res.status(201).json(await createPosting(req.body, req.user, 'donation'))
);
const updateDonation = endpoint(async (req, res) =>
  res.json(await changePosting(req.params.id, req.user, 'donation', req.body))
);
const cancelDonation = endpoint(async (req, res) =>
  res.json({
    message: 'Donation cancelled',
    donation: await changePosting(req.params.id, req.user, 'donation', {}, true)
  })
);
const getDonations = endpoint(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const query = {};
  if (req.user.role === 'donor') query.donor = req.user._id;
  else if (req.user.role !== 'admin') {
    const org = await Organization.findOne({ linkedUser: req.user._id });
    if (!org) fail(403, 'Organization profile required');
    query.matchedRecipient = org._id;
  }
  if (req.query.status && req.query.status !== 'all')
    query.status = req.query.status;
  if (req.query.search)
    query.foodType = { $regex: literalRegex(req.query.search), $options: 'i' };
  const [donations, total] = await Promise.all([
    Donation.find(query)
      .populate('matchedRecipient', 'name type district')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Donation.countDocuments(query)
  ]);
  res.json({ donations, total, page, pages: Math.ceil(total / limit) });
});
const getDonationById = endpoint(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) fail(404, 'Donation not found');
  if (!(await canReadPost(donation, req.user, 'donation')))
    fail(403, 'Not a participant in this donation');
  await donation.populate('matchedRecipient', 'name type district');
  const pickups = await Pickup.find(
    await pickupHistoryFilter(donation, req.user, 'donation')
  )
    .populate('volunteer', 'name contactNumber district')
    .populate('receivingOrganization', 'name district type')
    .sort({ createdAt: -1 });
  res.json({
    donation,
    pickup: pickups.find((p) => p.active) || pickups[0] || null,
    history: pickups
  });
});
const getDonorStats = endpoint(async (req, res) => {
  const [donations, waste] = await Promise.all([
    Donation.find({ donor: req.user._id }),
    WasteRequest.find({ donor: req.user._id })
  ]);
  const active = [
    'posted',
    'matched',
    'pickup_scheduled',
    'picked_up',
    'delivered'
  ];
  const completed = donations.filter((d) => d.status === 'completed');
  res.json({
    totalDonations: donations.length,
    activeDonations: donations.filter((d) => active.includes(d.status)).length,
    completedDonations: completed.length,
    cancelledDonations: donations.filter((d) => d.status === 'cancelled')
      .length,
    totalWasteRequests: waste.length,
    activeWasteRequests: waste.filter((w) => active.includes(w.status)).length,
    completedWasteRequests: waste.filter((w) => w.status === 'completed')
      .length,
    estimatedMeals: completed.reduce(
      (sum, d) => sum + parseMealsCount(d.quantity),
      0
    ),
    mealBasis: 'estimated from declared quantities'
  });
});
module.exports = {
  createDonation,
  updateDonation,
  cancelDonation,
  getDonations,
  getDonationById,
  getDonorStats
};
