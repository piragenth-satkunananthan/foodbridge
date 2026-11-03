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

const validCategories = new Set(['plastic', 'glass', 'paper', 'metal', 'organic', 'non_recyclable']);

// =========================================================================
// 1. Smart Waste Classification & Category-to-Pathway Routing (Module 3)
// =========================================================================

// @route POST /api/waste/classify
// @desc  Smart classification of item description into circular streams with guidelines
// @access Public / Authenticated
const classifyWaste = async (req, res) => {
  try {
    const input = req.body;
    if (!input || (typeof input === 'object' && !input.description && !input.title && !input.item && !input.wasteCategory)) {
      return res.status(400).json({ message: 'Please provide text description or item attributes to classify.' });
    }

    const classification = classifyWasteItem(input);
    const quantityStr = input.quantity || '50 kg';
    const impact = calculateWasteEnvironmentalImpact(classification.category, quantityStr);

    res.json({
      success: true,
      classification,
      impact,
      availableStreams: Object.keys(WASTE_STREAMS).map((k) => ({
        key: k,
        label: WASTE_STREAMS[k].label,
        facilityType: WASTE_STREAMS[k].facilityType,
        pathway: WASTE_STREAMS[k].pathwayTitle
      }))
    });
  } catch (error) {
    console.error('Waste classification error:', error);
    res.status(500).json({ message: 'Error running waste classification', error: error.message });
  }
};

// =========================================================================
// 2. Donor Surplus Waste Requests (Module 1 / Baseline Integration)
// =========================================================================

// @route POST /api/waste
// @access Private (Donor only)
const createWasteRequest = async (req, res) => {
  try {
    const { wasteCategory, quantity, district, pickupDeadline, photo, specialInstructions } = req.body;

    const errors = {};
    if (!wasteCategory || !validCategories.has(wasteCategory)) {
      errors.wasteCategory = `Waste category must be one of: ${Array.from(validCategories).join(', ')}`;
    }
    if (!quantity || typeof quantity !== 'string' || !quantity.trim()) {
      errors.quantity = 'Quantity is required (e.g. "50 kg" or "10 bags")';
    }
    if (!district || typeof district !== 'string' || !district.trim()) {
      errors.district = 'District is required';
    }
    if (!pickupDeadline) {
      errors.pickupDeadline = 'Pickup deadline is required';
    } else {
      const deadlineDate = new Date(pickupDeadline);
      if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
        errors.pickupDeadline = 'Pickup deadline must be a valid future date';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const wasteRequest = await WasteRequest.create({
      donor: req.user._id,
      wasteCategory,
      quantity: quantity.trim(),
      district: district.trim(),
      pickupDeadline: new Date(pickupDeadline),
      photo: photo || null,
      status: 'posted'
    });

    // Notify donor
    await createNotification({
      recipientUser: req.user._id,
      message: `Your waste collection request for ${wasteCategory} (${quantity}) has been posted.`,
      relatedType: 'wasteRequest',
      relatedId: wasteRequest._id
    });

    // Notify nearby verified recyclers that handle this material type
    try {
      const eligibleOrgs = await Organization.find({
        verificationStatus: 'verified',
        type: { $in: ['recycler', 'composting_facility'] },
        $or: [
          { materialTypesHandled: wasteCategory },
          { materialTypesHandled: { $size: 0 } }
        ]
      }).select('linkedUser name district');

      for (const org of eligibleOrgs) {
        if (org.linkedUser) {
          await createNotification({
            recipientUser: org.linkedUser,
            message: `New ${wasteCategory} waste batch available in ${district} (${quantity}).`,
            relatedType: 'wasteRequest',
            relatedId: wasteRequest._id
          });
        }
      }
    } catch (notifErr) {
      console.warn('Recycler broadcast notification notice:', notifErr.message);
    }

    res.status(201).json(wasteRequest);
  } catch (error) {
    console.error('Create waste request error:', error);
    res.status(500).json({ message: 'Error creating waste collection request', error: error.message });
  }
};

// @route GET /api/waste
// @access Private
const getWasteRequests = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Donors only see their own requests
    if (req.user.role === 'donor') {
      query.donor = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.wasteCategory = category;
    }

    if (search) {
      query.wasteCategory = { $regex: search, $options: 'i' };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [requests, total] = await Promise.all([
      WasteRequest.find(query)
        .populate('matchedCollector', 'name type district materialTypesHandled')
        .populate('donor', 'name district contactNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WasteRequest.countDocuments(query)
    ]);

    res.json({
      wasteRequests: requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Get waste requests error:', error);
    res.status(500).json({ message: 'Error retrieving waste requests', error: error.message });
  }
};

// @route GET /api/waste/:id
// @access Private
const getWasteRequestById = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'donor') {
      query.donor = req.user._id;
    }

    const wasteRequest = await WasteRequest.findOne(query)
      .populate('matchedCollector', 'name type district contactNumber materialTypesHandled registrationInfo')
      .populate('donor', 'name district contactNumber email');

    if (!wasteRequest) {
      return res.status(404).json({ message: 'Waste request not found' });
    }

    const pickup = await Pickup.findOne({ wasteRequest: wasteRequest._id })
      .populate('volunteer', 'name contactNumber')
      .populate('receivingOrganization', 'name district type');

    // Enrich with environmental impact and circular pathway details
    const impact = calculateWasteEnvironmentalImpact(wasteRequest.wasteCategory, wasteRequest.quantity);
    const stream = WASTE_STREAMS[wasteRequest.wasteCategory] || WASTE_STREAMS.organic;

    res.json({
      wasteRequest,
      pickup,
      impact,
      pathway: {
        title: stream.pathwayTitle,
        description: stream.pathwayDescription,
        facilityType: stream.facilityType,
        handlingGuidelines: stream.handlingGuidelines
      }
    });
  } catch (error) {
    console.error('Get waste request by ID error:', error);
    res.status(500).json({ message: 'Error retrieving waste request', error: error.message });
  }
};

// @route PUT /api/waste/:id
// @access Private (Donor only)
const updateWasteRequest = async (req, res) => {
  try {
    const request = await WasteRequest.findOne({ _id: req.params.id, donor: req.user._id });
    if (!request) {
      return res.status(404).json({ message: 'Waste request not found' });
    }

    if (request.status !== 'posted') {
      return res.status(400).json({
        message: `Cannot edit a request that is already '${request.status}'. Only 'posted' requests can be edited.`
      });
    }

    const { wasteCategory, quantity, district, pickupDeadline, photo } = req.body;
    if (wasteCategory !== undefined) {
      if (!validCategories.has(wasteCategory)) {
        return res.status(400).json({ message: 'Invalid waste category' });
      }
      request.wasteCategory = wasteCategory;
    }
    if (quantity !== undefined) {
      if (!quantity.trim()) return res.status(400).json({ message: 'Quantity cannot be empty' });
      request.quantity = quantity.trim();
    }
    if (district !== undefined) {
      if (!district.trim()) return res.status(400).json({ message: 'District cannot be empty' });
      request.district = district.trim();
    }
    if (pickupDeadline !== undefined) {
      const deadlineDate = new Date(pickupDeadline);
      if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Pickup deadline must be a valid future date' });
      }
      request.pickupDeadline = deadlineDate;
    }
    if (photo !== undefined) {
      request.photo = photo;
    }

    await request.save();
    res.json(request);
  } catch (error) {
    console.error('Update waste request error:', error);
    res.status(500).json({ message: 'Error updating waste request', error: error.message });
  }
};

// @route DELETE /api/waste/:id
// @access Private (Donor only)
const cancelWasteRequest = async (req, res) => {
  try {
    const request = await WasteRequest.findOne({ _id: req.params.id, donor: req.user._id });
    if (!request) {
      return res.status(404).json({ message: 'Waste request not found' });
    }

    if (request.status !== 'posted') {
      return res.status(400).json({
        message: `Cannot cancel a request that is already '${request.status}'. Only 'posted' requests can be cancelled.`
      });
    }

    request.status = 'cancelled';
    await request.save();

    await createNotification({
      recipientUser: req.user._id,
      message: `You cancelled your waste collection request for ${request.wasteCategory}.`,
      relatedType: 'wasteRequest',
      relatedId: request._id
    });

    res.json({ message: 'Waste request cancelled successfully', wasteRequest: request });
  } catch (error) {
    console.error('Cancel waste request error:', error);
    res.status(500).json({ message: 'Error cancelling waste request', error: error.message });
  }
};

// =========================================================================
// 3. Recycler Hub & Collector Workflows (Module 3 - MA. Fathima Amna)
// =========================================================================

// Helper: fetch user's linked organization
async function getRecyclerOrganization(user) {
  if (user.organization) {
    const org = await Organization.findById(user.organization);
    if (org) return org;
  }
  return await Organization.findOne({ linkedUser: user._id });
}

// @route GET /api/waste/recycler/feed
// @desc  Live sourcing feed of available unexpired waste requests for collectors
// @access Private (Recycler, Admin)
const getRecyclerFeed = async (req, res) => {
  try {
    const { category, district, search, sortBy = 'urgency' } = req.query;

    const org = await getRecyclerOrganization(req.user);
    const recyclerDistrict = district || (org ? org.district : req.user.district) || 'Colombo';

    const query = {
      status: 'posted',
      pickupDeadline: { $gt: new Date() }
    };

    if (category && category !== 'all') {
      query.wasteCategory = category;
    } else if (org && Array.isArray(org.materialTypesHandled) && org.materialTypesHandled.length > 0) {
      // By default prioritize the materials the recycler specializes in
      // Unless 'all' or explicit category selected
    }

    const rawRequests = await WasteRequest.find(query)
      .populate('donor', 'name district contactNumber email')
      .lean();

    const now = Date.now();

    // Enrich with distance, environmental metrics, and urgency
    let enriched = rawRequests.map((reqItem) => {
      const donorDistrict = reqItem.district || 'Colombo';
      const distanceKm = getDistrictDistanceKm(recyclerDistrict, donorDistrict);
      const impact = calculateWasteEnvironmentalImpact(reqItem.wasteCategory, reqItem.quantity);
      const stream = WASTE_STREAMS[reqItem.wasteCategory] || WASTE_STREAMS.organic;

      const deadlineMs = new Date(reqItem.pickupDeadline).getTime();
      const hoursRemaining = Math.max(0, (deadlineMs - now) / 3600000);

      // Check if current recycler organization handles this material
      const isHandledByOrg = org && Array.isArray(org.materialTypesHandled)
        ? org.materialTypesHandled.includes(reqItem.wasteCategory)
        : true;

      return {
        ...reqItem,
        distanceKm: Number(distanceKm.toFixed(1)),
        isSameDistrict: donorDistrict.toLowerCase() === recyclerDistrict.toLowerCase(),
        hoursRemaining: Number(hoursRemaining.toFixed(1)),
        isUrgent: hoursRemaining <= 12,
        impact,
        pathwayTitle: stream.pathwayTitle,
        pathwayDescription: stream.pathwayDescription,
        handlingGuidelines: stream.handlingGuidelines,
        facilityType: stream.facilityType,
        isHandledByOrg
      };
    });

    // Filtering by text search if provided
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      enriched = enriched.filter((item) =>
        item.wasteCategory.toLowerCase().includes(term) ||
        (item.district && item.district.toLowerCase().includes(term)) ||
        (item.donor && item.donor.name && item.donor.name.toLowerCase().includes(term))
      );
    }

    // Sorting
    if (sortBy === 'distance') {
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'quantity') {
      enriched.sort((a, b) => b.impact.weightKg - a.impact.weightKg);
    } else {
      // Default: urgency (closest deadline first)
      enriched.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    }

    res.json({
      success: true,
      count: enriched.length,
      recyclerDistrict,
      organization: org ? {
        id: org._id,
        name: org.name,
        type: org.type,
        verificationStatus: org.verificationStatus,
        materialTypesHandled: org.materialTypesHandled
      } : null,
      feed: enriched
    });
  } catch (error) {
    console.error('Get recycler feed error:', error);
    res.status(500).json({ message: 'Error retrieving recycler feed', error: error.message });
  }
};

// @route POST /api/waste/:id/claim
// @desc  Verified Recycler claims an open waste collection request
// @access Private (Recycler, Admin)
const claimWasteRequest = async (req, res) => {
  try {
    const org = await getRecyclerOrganization(req.user);
    if (!org) {
      return res.status(403).json({
        message: 'No registered organization profile linked to this recycler account. Please complete your profile.'
      });
    }

    // Verification check: only verified recyclers may claim waste
    if (org.verificationStatus !== 'verified') {
      return res.status(403).json({
        message: 'Your organization must be verified by an administrator before claiming industrial waste collections.',
        verificationStatus: org.verificationStatus
      });
    }

    const wasteRequest = await WasteRequest.findById(req.params.id).populate('donor', 'name email district');
    if (!wasteRequest) {
      return res.status(404).json({ message: 'Waste request not found' });
    }

    if (wasteRequest.status !== 'posted') {
      return res.status(400).json({
        message: `This waste request cannot be claimed because it is already '${wasteRequest.status}'.`
      });
    }

    // Material compatibility check
    if (Array.isArray(org.materialTypesHandled) && org.materialTypesHandled.length > 0) {
      if (!org.materialTypesHandled.includes(wasteRequest.wasteCategory)) {
        return res.status(400).json({
          message: `Your facility is registered for [${org.materialTypesHandled.join(', ')}], which does not cover '${wasteRequest.wasteCategory}'.`
        });
      }
    }

    // Transition status to 'matched'
    wasteRequest.status = 'matched';
    wasteRequest.matchedCollector = org._id;
    await wasteRequest.save();

    // Create corresponding Pickup record linking the waste request
    let pickup = await Pickup.findOne({ wasteRequest: wasteRequest._id });
    if (!pickup) {
      pickup = await Pickup.create({
        wasteRequest: wasteRequest._id,
        receivingOrganization: org._id,
        statusPipeline: 'matched',
        statusHistory: [
          { status: 'posted', timestamp: wasteRequest.createdAt, note: 'Waste batch posted by donor' },
          { status: 'matched', timestamp: new Date(), note: `Claimed by recycler ${org.name}` }
        ]
      });
    } else {
      pickup.receivingOrganization = org._id;
      pickup.statusPipeline = 'matched';
      pickup.statusHistory.push({
        status: 'matched',
        timestamp: new Date(),
        note: `Reassigned to recycler ${org.name}`
      });
      await pickup.save();
    }

    // Notify Donor
    await createNotification({
      recipientUser: wasteRequest.donor._id || wasteRequest.donor,
      message: `Your ${wasteRequest.wasteCategory} waste request (${wasteRequest.quantity}) has been accepted by ${org.name}.`,
      relatedType: 'wasteRequest',
      relatedId: wasteRequest._id
    });

    // Notify Recycler
    await createNotification({
      recipientUser: req.user._id,
      message: `You successfully claimed the ${wasteRequest.wasteCategory} batch from ${wasteRequest.donor.name || 'Donor'}.`,
      relatedType: 'wasteRequest',
      relatedId: wasteRequest._id
    });

    res.json({
      success: true,
      message: 'Waste collection request claimed successfully',
      wasteRequest,
      pickup
    });
  } catch (error) {
    console.error('Claim waste request error:', error);
    res.status(500).json({ message: 'Error claiming waste request', error: error.message });
  }
};

// @route PUT /api/waste/:id/cancel-claim
// @desc  Recycler releases/cancels a claimed waste request back to the open pool
// @access Private (Recycler, Admin)
const cancelWasteClaim = async (req, res) => {
  try {
    const org = await getRecyclerOrganization(req.user);
    if (!org) {
      return res.status(403).json({ message: 'No organization linked to this account.' });
    }

    const wasteRequest = await WasteRequest.findOne({
      _id: req.params.id,
      matchedCollector: org._id
    }).populate('donor', 'name email');

    if (!wasteRequest) {
      return res.status(404).json({ message: 'Claimed waste request not found for your organization.' });
    }

    if (wasteRequest.status === 'picked_up' || wasteRequest.status === 'recycled' || wasteRequest.status === 'completed') {
      return res.status(400).json({
        message: `Cannot cancel a claim that has reached '${wasteRequest.status}'. Material is already in transit or processed.`
      });
    }

    wasteRequest.status = 'posted';
    wasteRequest.matchedCollector = null;
    await wasteRequest.save();

    // Update Pickup record
    await Pickup.findOneAndUpdate(
      { wasteRequest: wasteRequest._id },
      {
        statusPipeline: 'posted',
        volunteer: null,
        $push: {
          statusHistory: {
            status: 'posted',
            timestamp: new Date(),
            note: `Claim cancelled by recycler ${org.name}; returned to open board.`
          }
        }
      }
    );

    // Notify Donor
    await createNotification({
      recipientUser: wasteRequest.donor._id || wasteRequest.donor,
      message: `The recycler had to release your ${wasteRequest.wasteCategory} request. It is back in the open donor pool.`,
      relatedType: 'wasteRequest',
      relatedId: wasteRequest._id
    });

    res.json({
      success: true,
      message: 'Waste claim cancelled; request returned to open pool.',
      wasteRequest
    });
  } catch (error) {
    console.error('Cancel waste claim error:', error);
    res.status(500).json({ message: 'Error cancelling waste claim', error: error.message });
  }
};

// @route GET /api/waste/recycler/claims
// @desc  Get all claims and active batches for the logged-in recycler
// @access Private (Recycler, Admin)
const getRecyclerClaims = async (req, res) => {
  try {
    const org = await getRecyclerOrganization(req.user);
    if (!org) {
      return res.status(200).json({ claims: [], count: 0 });
    }

    const { status } = req.query;
    const query = { matchedCollector: org._id };

    if (status && status !== 'all') {
      query.status = status;
    }

    const requests = await WasteRequest.find(query)
      .populate('donor', 'name district contactNumber email')
      .sort({ updatedAt: -1 })
      .lean();

    // Attach pickup info & impact
    const requestIds = requests.map((r) => r._id);
    const pickups = await Pickup.find({ wasteRequest: { $in: requestIds } })
      .populate('volunteer', 'name contactNumber')
      .lean();

    const pickupMap = new Map();
    pickups.forEach((p) => {
      pickupMap.set(String(p.wasteRequest), p);
    });

    const enriched = requests.map((item) => {
      const pickup = pickupMap.get(String(item._id)) || null;
      const impact = calculateWasteEnvironmentalImpact(item.wasteCategory, item.quantity);
      const stream = WASTE_STREAMS[item.wasteCategory] || WASTE_STREAMS.organic;

      return {
        ...item,
        pickup,
        impact,
        pathwayTitle: stream.pathwayTitle,
        pathwayDescription: stream.pathwayDescription,
        handlingGuidelines: stream.handlingGuidelines
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      claims: enriched
    });
  } catch (error) {
    console.error('Get recycler claims error:', error);
    res.status(500).json({ message: 'Error retrieving recycler claims', error: error.message });
  }
};

// @route PUT /api/waste/:id/confirm-recycled
// @desc  Recycler confirms material was safely processed & generates ESG Diversion Certificate
// @access Private (Recycler, Admin)
const confirmWasteRecycled = async (req, res) => {
  try {
    const { processingNotes, batchYieldPercent } = req.body;

    const org = await getRecyclerOrganization(req.user);
    if (!org) {
      return res.status(403).json({ message: 'No organization linked to this account.' });
    }

    const wasteRequest = await WasteRequest.findOne({
      _id: req.params.id,
      matchedCollector: org._id
    }).populate('donor', 'name district contactNumber email');

    if (!wasteRequest) {
      return res.status(404).json({ message: 'Claimed waste request not found.' });
    }

    if (wasteRequest.status === 'recycled' || wasteRequest.status === 'completed') {
      return res.status(400).json({ message: 'This batch has already been certified and completed.' });
    }

    // Update waste request status
    wasteRequest.status = 'recycled';
    await wasteRequest.save();

    // Advance Pickup status pipeline to delivered_or_recycled -> completed
    const pickup = await Pickup.findOne({ wasteRequest: wasteRequest._id });
    if (pickup) {
      pickup.statusPipeline = 'completed';
      pickup.completionConfirmedAt = new Date();
      pickup.statusHistory.push({
        status: 'delivered_or_recycled',
        timestamp: new Date(Date.now() - 60000),
        note: `Material accepted at ${org.name} recycling dock.`
      });
      pickup.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        note: processingNotes || 'Circular reprocessing & sorting completed.'
      });
      await pickup.save();
    }

    const impact = calculateWasteEnvironmentalImpact(wasteRequest.wasteCategory, wasteRequest.quantity);
    const stream = WASTE_STREAMS[wasteRequest.wasteCategory] || WASTE_STREAMS.organic;

    // Structured Environmental Diversion Certificate
    const certificateId = `FB-REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const certificate = {
      certificateId,
      issueDate: new Date().toISOString(),
      facilityName: org.name,
      facilityLicense: org.registrationInfo,
      facilityDistrict: org.district,
      donorName: wasteRequest.donor ? wasteRequest.donor.name : 'Verified Donor',
      wasteCategory: wasteRequest.wasteCategory,
      wasteCategoryLabel: stream.label,
      netWeightDivertedKg: impact.weightKg,
      co2eMitigatedKg: impact.co2eSavedKg,
      treeSeedlingsEquivalent: impact.treeEquivalents,
      circularPathway: stream.pathwayTitle,
      batchYieldPercent: Number(batchYieldPercent) || 98.5,
      complianceStandard: 'ISO 14001 Circular Standards & UN SDG 12 Compliant'
    };

    // Notify donor of circular recycling completion
    if (wasteRequest.donor) {
      await createNotification({
        recipientUser: wasteRequest.donor._id || wasteRequest.donor,
        message: `🎉 Great news! Your ${wasteRequest.wasteCategory} batch (${wasteRequest.quantity}) was successfully processed at ${org.name}. ESG Certificate: ${certificateId}`,
        relatedType: 'wasteRequest',
        relatedId: wasteRequest._id
      });
    }

    res.json({
      success: true,
      message: 'Waste batch certified as successfully recycled into circular economy.',
      wasteRequest,
      certificate
    });
  } catch (error) {
    console.error('Confirm waste recycled error:', error);
    res.status(500).json({ message: 'Error confirming waste recycling', error: error.message });
  }
};

// @route GET /api/waste/recycler/stats
// @desc  Get aggregate circular economy and diversion analytics for the recycler
// @access Private (Recycler, Admin)
const getRecyclerStats = async (req, res) => {
  try {
    const org = await getRecyclerOrganization(req.user);
    if (!org) {
      return res.json({
        totalBatches: 0,
        activeBatches: 0,
        completedBatches: 0,
        totalWeightKg: 0,
        totalCo2eSavedKg: 0,
        categories: {}
      });
    }

    const allMyBatches = await WasteRequest.find({ matchedCollector: org._id });

    let totalWeightKg = 0;
    let totalCo2eSavedKg = 0;
    let activeBatches = 0;
    let completedBatches = 0;

    const categories = {
      plastic: { count: 0, weightKg: 0, co2eKg: 0 },
      glass: { count: 0, weightKg: 0, co2eKg: 0 },
      paper: { count: 0, weightKg: 0, co2eKg: 0 },
      metal: { count: 0, weightKg: 0, co2eKg: 0 },
      organic: { count: 0, weightKg: 0, co2eKg: 0 },
      non_recyclable: { count: 0, weightKg: 0, co2eKg: 0 }
    };

    allMyBatches.forEach((batch) => {
      const impact = calculateWasteEnvironmentalImpact(batch.wasteCategory, batch.quantity);
      const cat = batch.wasteCategory;

      if (batch.status === 'recycled' || batch.status === 'completed') {
        completedBatches += 1;
        totalWeightKg += impact.weightKg;
        totalCo2eSavedKg += impact.co2eSavedKg;

        if (categories[cat]) {
          categories[cat].count += 1;
          categories[cat].weightKg += impact.weightKg;
          categories[cat].co2eKg += impact.co2eSavedKg;
        }
      } else if (batch.status === 'matched' || batch.status === 'pickup_scheduled' || batch.status === 'picked_up') {
        activeBatches += 1;
      }
    });

    res.json({
      success: true,
      organizationName: org.name,
      verificationStatus: org.verificationStatus,
      totalBatches: allMyBatches.length,
      activeBatches,
      completedBatches,
      totalWeightKg: Number(totalWeightKg.toFixed(1)),
      totalCo2eSavedKg: Number(totalCo2eSavedKg.toFixed(2)),
      treeEquivalents: Number((totalCo2eSavedKg / 21.77).toFixed(1)),
      materialBreakdown: categories
    });
  } catch (error) {
    console.error('Get recycler stats error:', error);
    res.status(500).json({ message: 'Error retrieving recycler stats', error: error.message });
  }
};

// @route GET /api/waste/:id/eligible-collectors
// @desc  Find and rank nearby verified recyclers/composters capable of receiving this waste
// @access Private (Donor, Admin, Recycler)
const getEligibleCollectorsForWaste = async (req, res) => {
  try {
    const wasteRequest = await WasteRequest.findById(req.params.id);
    if (!wasteRequest) {
      return res.status(404).json({ message: 'Waste request not found' });
    }

    const organizations = await Organization.find({
      verificationStatus: 'verified',
      type: { $in: ['recycler', 'composting_facility'] }
    });

    const ranked = rankEligibleCollectors(wasteRequest, organizations);

    res.json({
      success: true,
      wasteRequest: {
        id: wasteRequest._id,
        category: wasteRequest.wasteCategory,
        quantity: wasteRequest.quantity,
        district: wasteRequest.district
      },
      count: ranked.length,
      eligibleCollectors: ranked
    });
  } catch (error) {
    console.error('Get eligible collectors error:', error);
    res.status(500).json({ message: 'Error ranking eligible collectors', error: error.message });
  }
};

module.exports = {
  // Classification
  classifyWaste,

  // Donor surplus management
  createWasteRequest,
  getWasteRequests,
  getWasteRequestById,
  updateWasteRequest,
  cancelWasteRequest,

  // Recycler portal & circular operations
  getRecyclerFeed,
  claimWasteRequest,
  cancelWasteClaim,
  getRecyclerClaims,
  confirmWasteRecycled,
  getRecyclerStats,
  getEligibleCollectorsForWaste
};
