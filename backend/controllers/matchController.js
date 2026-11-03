const Donation = require('../models/Donation');
const Organization = require('../models/Organization');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const { endpoint, fail, text } = require('../utils/domain');
const { parseMealsCount } = require('../utils/quantity');
const { calculateSmartMatchScore } = require('../utils/distanceUtils');
const {
  organizationFor,
  eligibility
} = require('../services/eligibilityService');
const allocation = require('../services/allocationService');
const { canReadPost } = require('../services/postingService');
const getNearbyDonations = endpoint(async (req, res) => {
  const org = await organizationFor(req.user);
  const query = {
    status: 'posted',
    pickupDeadline: { $gt: new Date() },
    isDemo: { $ne: true }
  };
  if (req.query.storageCondition && req.query.storageCondition !== 'all')
    query.storageCondition = req.query.storageCondition;
  const raw = await Donation.find(query)
    .populate('donor', 'name district status')
    .lean();
  let donations = raw
    .filter((d) => d.donor?.status === 'active')
    .map((d) => ({
      ...d,
      ...calculateSmartMatchScore({
        donation: d,
        recipientDistrict: org.district,
        organization: org
      }),
      ...eligibility(d, org, 'donation')
    }))
    .filter((d) => d.eligible);
  for (const field of ['city', 'area'])
    if (req.query[field])
      donations = donations.filter(
        (d) =>
          String(d[field] || '').toLowerCase() ===
          String(req.query[field]).toLowerCase()
      );
  if (req.query.foodType && req.query.foodType !== 'all')
    donations = donations.filter((d) =>
      d.foodType
        .toLowerCase()
        .includes(String(req.query.foodType).toLowerCase())
    );
  if (req.query.search) {
    const search = text(req.query.search, 'Search', 100).toLowerCase();
    donations = donations.filter((d) =>
      [d.foodType, d.district, d.specialInstructions]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }
  for (const [key, field, op] of [
    ['maxDistance', 'distanceKm', 'max'],
    ['minScore', 'matchScore', 'min']
  ]) {
    if (req.query[key] !== undefined) {
      const n = Number(req.query[key]);
      if (!Number.isFinite(n) || n < 0) fail(400, `Invalid ${key}`);
      donations = donations.filter((d) =>
        op === 'max' ? d[field] <= n : d[field] >= n
      );
    }
  }
  donations.sort((a, b) =>
    req.query.sortBy === 'distance'
      ? a.distanceKm - b.distanceKm
      : req.query.sortBy === 'urgency'
        ? a.hoursRemaining - b.hoursRemaining
        : req.query.sortBy === 'newest'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : b.matchScore - a.matchScore
  );
  res.json({
    success: true,
    recipientDistrict: org.district,
    totalCount: donations.length,
    donations
  });
});
const claimDonation = endpoint(async (req, res) => {
  const result = await allocation.claim(
    req.params.donationId,
    req.user,
    'donation'
  );
  res.json({
    success: true,
    message: 'Donation claimed; awaiting volunteer assignment',
    donation: result.post,
    pickup: result.pickup
  });
});
const cancelDonationClaim = endpoint(async (req, res) => {
  const reason = req.body.reason
    ? text(req.body.reason, 'Reason')
    : 'Recipient released claim';
  const result = await allocation.cancelClaim(
    req.params.donationId,
    req.user,
    'donation',
    reason
  );
  res.json({
    success: true,
    message: 'Claim released',
    donation: result.post,
    pickup: result.pickup
  });
});
const getMyClaims = endpoint(async (req, res) => {
  const org = await Organization.findOne({ linkedUser: req.user._id });
  if (!org) return res.json({ success: true, count: 0, claims: [] });
  const filter = { receivingOrganization: org._id, donation: { $ne: null } };
  if (req.query.status === 'active') filter.active = true;
  if (req.query.status === 'completed') filter.statusPipeline = 'completed';
  const claims = await Pickup.find(filter)
    .populate('donation')
    .populate('volunteer', 'name contactNumber district')
    .populate('receivingOrganization', 'name type district')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: claims.length, claims });
});
const getRecipientStats = endpoint(async (req, res) => {
  const org = await Organization.findOne({ linkedUser: req.user._id });
  const claims = org
    ? await Pickup.find({
        receivingOrganization: org._id,
        donation: { $ne: null }
      }).populate('donation')
    : [];
  const completed = claims.filter((p) => p.statusPipeline === 'completed');
  const available = {
    status: 'posted',
    pickupDeadline: { $gt: new Date() },
    isDemo: { $ne: true }
  };
  res.json({
    success: true,
    stats: {
      district: req.user.district,
      availableInDistrict: await Donation.countDocuments({
        ...available,
        district: req.user.district
      }),
      totalAvailable: await Donation.countDocuments(available),
      activeClaimsCount: claims.filter((p) => p.active).length,
      completedClaimsCount: completed.length,
      estimatedMealsRescued: completed.reduce(
        (sum, p) => sum + parseMealsCount(p.donation?.quantity),
        0
      ),
      isVerified: org?.verificationStatus === 'verified'
    }
  });
});
const rankRecipientsForDonation = endpoint(async (req, res) => {
  const donation = await Donation.findById(req.params.donationId);
  if (!donation) fail(404, 'Donation not found');
  if (!(await canReadPost(donation, req.user, 'donation')))
    fail(403, 'Not authorized to inspect this donation');
  const orgs = await Organization.find({
    type: { $in: ['ngo', 'charity', 'shelter'] },
    verificationStatus: 'verified',
    accepting: true
  }).populate('linkedUser', 'status');
  const organizations = orgs
    .filter((o) => o.linkedUser?.status === 'active')
    .map((org) => ({
      _id: org._id,
      name: org.name,
      type: org.type,
      district: org.district,
      ...calculateSmartMatchScore({
        donation,
        recipientDistrict: org.district,
        organization: org
      }),
      ...eligibility(donation, org, 'donation')
    }))
    .filter((o) => o.eligible)
    .sort((a, b) => b.matchScore - a.matchScore);
  res.json({
    success: true,
    donationId: donation._id,
    totalMatchedOrgs: organizations.length,
    organizations
  });
});
module.exports = {
  getNearbyDonations,
  claimDonation,
  cancelDonationClaim,
  getMyClaims,
  getRecipientStats,
  rankRecipientsForDonation
};
