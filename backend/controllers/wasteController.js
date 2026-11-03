const WasteRequest = require('../models/WasteRequest');
const Organization = require('../models/Organization');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');
const { getDistrictDistanceKm } = require('../utils/distanceUtils');
const {
  WASTE_STREAMS,
  parseWasteWeightKg,
  classifyWasteItem,
  calculateWasteEnvironmentalImpact,
  rankEligibleCollectors
} = require('../utils/wasteClassifier');

const validCategories = new Set([
  'plastic',
  'glass',
  'paper',
  'metal',
  'organic',
  'non_recyclable'
]);

// =========================================================================
// 1. Smart Waste Classification & Category-to-Pathway Routing (Module 3)
// =========================================================================

// @route POST /api/waste/classify
// @desc  Smart classification of item description into circular streams with guidelines
// @access Public / Authenticated
const { endpoint, fail, pagination, literalRegex } = require('../utils/domain');
const {
  createPosting,
  changePosting,
  canReadPost,
  pickupHistoryFilter
} = require('../services/postingService');
const createWasteRequest = endpoint(async (req, res) =>
  res.status(201).json(await createPosting(req.body, req.user, 'wasteRequest'))
);
const updateWasteRequest = endpoint(async (req, res) =>
  res.json(
    await changePosting(req.params.id, req.user, 'wasteRequest', req.body)
  )
);
const cancelWasteRequest = endpoint(async (req, res) =>
  res.json({
    message: 'Waste request cancelled',
    wasteRequest: await changePosting(
      req.params.id,
      req.user,
      'wasteRequest',
      {},
      true
    )
  })
);
const getWasteRequests = endpoint(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const query = {};
  if (req.user.role === 'donor') query.donor = req.user._id;
  else if (req.user.role !== 'admin') {
    const org = await Organization.findOne({ linkedUser: req.user._id });
    if (!org) fail(403, 'Organization profile required');
    query.matchedCollector = org._id;
  }
  if (req.query.status && req.query.status !== 'all')
    query.status = req.query.status;
  if (req.query.category && req.query.category !== 'all')
    query.wasteCategory = req.query.category;
  if (req.query.search)
    query.wasteCategory = {
      $regex: literalRegex(req.query.search),
      $options: 'i'
    };
  const [requests, total] = await Promise.all([
    WasteRequest.find(query)
      .populate('matchedCollector', 'name type district')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WasteRequest.countDocuments(query)
  ]);
  res.json({
    wasteRequests: requests,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});
const getWasteRequestById = endpoint(async (req, res) => {
  const wasteRequest = await WasteRequest.findById(req.params.id);
  if (!wasteRequest) fail(404, 'Waste request not found');
  if (!(await canReadPost(wasteRequest, req.user, 'wasteRequest')))
    fail(403, 'Not a participant in this waste request');
  await wasteRequest.populate('matchedCollector', 'name type district');
  const pickups = await Pickup.find(
    await pickupHistoryFilter(wasteRequest, req.user, 'wasteRequest')
  )
    .populate('volunteer', 'name contactNumber')
    .sort({ createdAt: -1 });
  res.json({
    wasteRequest,
    pickup: pickups.find((p) => p.active) || pickups[0] || null,
    history: pickups
  });
});

const {
  organizationFor,
  eligibility
} = require('../services/eligibilityService');
const allocation = require('../services/allocationService');
const pickupService = require('../services/pickupService');
const classifyWaste = endpoint(async (req, res) => {
  const classification = classifyWasteItem(req.body);
  res.json({
    success: !classification.requiresConfirmation,
    classification,
    impact: classification.category
      ? calculateWasteEnvironmentalImpact(
          classification.category,
          req.body.quantity
        )
      : null,
    availableStreams: Object.values(WASTE_STREAMS)
  });
});
const getRecyclerFeed = endpoint(async (req, res) => {
  const org = await organizationFor(req.user);
  const raw = await WasteRequest.find({
    status: 'posted',
    pickupDeadline: { $gt: new Date() },
    isDemo: { $ne: true }
  })
    .populate('donor', 'name district status')
    .lean();
  let feed = raw
    .filter((p) => p.donor?.status === 'active')
    .map((post) => ({
      ...post,
      ...eligibility(post, org, 'wasteRequest'),
      impact: calculateWasteEnvironmentalImpact(
        post.wasteCategory,
        post.quantity
      ),
      pathwayTitle: WASTE_STREAMS[post.wasteCategory]?.pathwayTitle,
      hoursRemaining: Math.max(
        0,
        (new Date(post.pickupDeadline) - Date.now()) / 3600000
      )
    }))
    .filter((post) => post.eligible);
  for (const field of ['city', 'area'])
    if (req.query[field])
      feed = feed.filter(
        (d) =>
          String(d[field] || '').toLowerCase() ===
          String(req.query[field]).toLowerCase()
      );
  if (req.query.category && req.query.category !== 'all')
    feed = feed.filter((post) => post.wasteCategory === req.query.category);
  if (req.query.district && req.query.district !== 'all')
    feed = feed.filter((post) => post.district === req.query.district);
  if (req.query.search) {
    const term = String(req.query.search).toLowerCase();
    feed = feed.filter((post) =>
      [post.wasteCategory, post.district, post.donor.name]
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }
  feed.sort((a, b) =>
    req.query.sortBy === 'distance'
      ? a.distanceKm - b.distanceKm
      : req.query.sortBy === 'quantity'
        ? b.impact.weightKg - a.impact.weightKg
        : a.hoursRemaining - b.hoursRemaining
  );
  res.json({
    success: true,
    count: feed.length,
    recyclerDistrict: org.district,
    organization: {
      id: org._id,
      name: org.name,
      type: org.type,
      verificationStatus: org.verificationStatus,
      materialTypesHandled: org.materialTypesHandled
    },
    feed
  });
});
const claimWasteRequest = endpoint(async (req, res) => {
  const result = await allocation.claim(
    req.params.id,
    req.user,
    'wasteRequest'
  );
  res.json({
    success: true,
    message: 'Waste claimed; awaiting volunteer assignment',
    wasteRequest: result.post,
    pickup: result.pickup
  });
});
const cancelWasteClaim = endpoint(async (req, res) => {
  const result = await allocation.cancelClaim(
    req.params.id,
    req.user,
    'wasteRequest',
    'Collector released claim'
  );
  res.json({ success: true, wasteRequest: result.post, pickup: result.pickup });
});
const getRecyclerClaims = endpoint(async (req, res) => {
  const org = await Organization.findOne({ linkedUser: req.user._id });
  if (!org) return res.json({ success: true, count: 0, claims: [] });
  const filter = {
    receivingOrganization: org._id,
    wasteRequest: { $ne: null }
  };
  if (req.query.status === 'active') filter.active = true;
  else if (req.query.status && req.query.status !== 'all')
    filter.statusPipeline = req.query.status;
  const pickups = await Pickup.find(filter)
    .populate('wasteRequest')
    .populate('volunteer', 'name contactNumber')
    .sort({ createdAt: -1 })
    .lean();
  const claims = pickups
    .filter((p) => p.wasteRequest)
    .map((p) => ({
      ...p.wasteRequest,
      claimId: p._id,
      claimStatus: p.statusPipeline,
      pickup: { ...p, wasteRequest: p.wasteRequest._id },
      impact: calculateWasteEnvironmentalImpact(
        p.wasteRequest.wasteCategory,
        p.wasteRequest.quantity
      )
    }));
  res.json({ success: true, count: claims.length, claims });
});
const confirmWasteRecycled = endpoint(async (req, res) => {
  const pickup = await Pickup.findOne({
    wasteRequest: req.params.id,
    active: true
  });
  if (!pickup) fail(409, 'No active pickup awaiting processing confirmation');
  const result = await pickupService.confirmReceipt(
    pickup._id,
    req.user,
    req.body
  );
  const processingRecord = {
    recordId: String(result.pickup._id),
    recordType: 'organization-reported processing outcome',
    issuedAt: result.pickup.completionConfirmedAt,
    outcome: result.source.processingOutcome,
    quantity: result.source.quantity,
    notes: result.source.processingNotes
  };
  res.json({
    success: true,
    wasteRequest: result.source,
    pickup: result.pickup,
    processingRecord
  });
});
const getRecyclerStats = endpoint(async (req, res) => {
  const org = await Organization.findOne({ linkedUser: req.user._id });
  const pickups = org
    ? await Pickup.find({
        receivingOrganization: org._id,
        wasteRequest: { $ne: null }
      }).populate('wasteRequest')
    : [];
  const completed = pickups.filter((p) => p.statusPipeline === 'completed');
  const materialBreakdown = Object.fromEntries(
    Object.keys(WASTE_STREAMS).map((key) => [
      key,
      { count: 0, weightKg: 0, co2eKg: null }
    ])
  );
  let totalWeightKg = 0,
    totalDivertedKg = 0;
  for (const pickup of completed) {
    const batch = pickup.wasteRequest;
    if (!batch) continue;
    const weight = parseWasteWeightKg(batch.quantity);
    totalWeightKg += weight;
    if (['recycled', 'composted'].includes(pickup.processingOutcome))
      totalDivertedKg += weight;
    materialBreakdown[batch.wasteCategory].count++;
    materialBreakdown[batch.wasteCategory].weightKg += weight;
  }
  res.json({
    success: true,
    organizationName: org?.name,
    verificationStatus: org?.verificationStatus,
    totalBatches: pickups.length,
    activeBatches: pickups.filter((p) => p.active).length,
    completedBatches: completed.length,
    totalWeightKg,
    totalDivertedKg,
    totalCo2eSavedKg: null,
    treeEquivalents: null,
    materialBreakdown
  });
});
const getEligibleCollectorsForWaste = endpoint(async (req, res) => {
  const post = await WasteRequest.findById(req.params.id);
  if (!post) fail(404, 'Waste request not found');
  if (!(await canReadPost(post, req.user, 'wasteRequest')))
    fail(403, 'Not authorized for this waste request');
  const organizations = await Organization.find({
    verificationStatus: 'verified',
    type: { $in: ['recycler', 'composting_facility', 'waste_management'] }
  }).populate('linkedUser', 'status');
  const eligibleCollectors = rankEligibleCollectors(
    post,
    organizations.filter((org) => org.linkedUser?.status === 'active')
  );
  res.json({
    success: true,
    wasteRequest: post,
    count: eligibleCollectors.length,
    eligibleCollectors
  });
});
module.exports = {
  classifyWaste,
  createWasteRequest,
  updateWasteRequest,
  cancelWasteRequest,
  getWasteRequests,
  getWasteRequestById,
  getRecyclerFeed,
  claimWasteRequest,
  cancelWasteClaim,
  getRecyclerClaims,
  confirmWasteRecycled,
  getRecyclerStats,
  getEligibleCollectorsForWaste
};
