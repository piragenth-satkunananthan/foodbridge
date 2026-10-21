const Donation = require('../models/Donation');
const Organization = require('../models/Organization');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');
const {
  getDistrictDistanceKm,
  calculateSmartMatchScore,
  parseEstimatedPortions
} = require('../utils/distanceUtils');

/**
 * @desc    Get nearby surplus food donations ranked by proximity and smart matching score
 * @route   GET /api/match/nearby-donations
 * @access  Private (Recipient, Admin)
 */
const getNearbyDonations = async (req, res) => {
  try {
    const {
      district,
      foodType,
      storageCondition,
      maxDistance,
      minScore,
      search,
      sortBy = 'smart_match'
    } = req.query;

    const recipientDistrict = district || req.user.district || 'Colombo';

    // 1. Build initial query for active, unexpired food surplus
    const query = {
      status: 'posted',
      pickupDeadline: { $gt: new Date() }
    };

    if (storageCondition && storageCondition !== 'all') {
      query.storageCondition = storageCondition;
    }

    if (foodType && foodType !== 'all') {
      query.foodType = { $regex: foodType, $options: 'i' };
    }

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { foodType: { $regex: term, $options: 'i' } },
        { district: { $regex: term, $options: 'i' } },
        { specialInstructions: { $regex: term, $options: 'i' } }
      ];
    }

    // 2. Fetch donations with donor details
    const rawDonations = await Donation.find(query)
      .populate('donor', 'name email contactNumber district')
      .lean();

    // 3. Score and enrich each donation
    let scoredDonations = rawDonations.map((donation) => {
      const matchResult = calculateSmartMatchScore({
        donation,
        recipientDistrict
      });

      return {
        ...donation,
        matchScore: matchResult.matchScore,
        distanceKm: matchResult.distanceKm,
        hoursRemaining: matchResult.hoursRemaining,
        urgencyLevel: matchResult.urgencyLevel,
        estimatedPortions: matchResult.estimatedPortions,
        matchBreakdown: matchResult.breakdown
      };
    });

    // 4. Apply distance and score thresholds if provided
    if (maxDistance && !isNaN(Number(maxDistance))) {
      const maxDistNum = Number(maxDistance);
      scoredDonations = scoredDonations.filter((d) => d.distanceKm <= maxDistNum);
    }

    if (minScore && !isNaN(Number(minScore))) {
      const minScoreNum = Number(minScore);
      scoredDonations = scoredDonations.filter((d) => d.matchScore >= minScoreNum);
    }

    // 5. Sort results
    if (sortBy === 'urgency') {
      // Urgent / expiring soonest first
      scoredDonations.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    } else if (sortBy === 'distance') {
      // Closest physical distance first
      scoredDonations.sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sortBy === 'newest') {
      // Most recently posted
      scoredDonations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      // Default: Highest Smart Match Score
      scoredDonations.sort((a, b) => b.matchScore - a.matchScore);
    }

    return res.status(200).json({
      success: true,
      recipientDistrict,
      totalCount: scoredDonations.length,
      donations: scoredDonations
    });
  } catch (error) {
    console.error('Error fetching nearby donations:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to compute matching donations',
      error: error.message
    });
  }
};

/**
 * @desc    Get recipient allocation statistics
 * @route   GET /api/match/stats
 * @access  Private (Recipient, Admin)
 */
const getRecipientStats = async (req, res) => {
  try {
    const userDistrict = req.user.district || 'Colombo';

    // Find recipient's organization
    let org = null;
    if (req.user.organization) {
      org = await Organization.findById(req.user.organization);
    }
    if (!org) {
      org = await Organization.findOne({ linkedUser: req.user._id });
    }

    // 1. Available surplus in recipient's district
    const availableInDistrict = await Donation.countDocuments({
      status: 'posted',
      district: userDistrict,
      pickupDeadline: { $gt: new Date() }
    });

    // Total available nationwide
    const totalAvailable = await Donation.countDocuments({
      status: 'posted',
      pickupDeadline: { $gt: new Date() }
    });

    let activeClaimsCount = 0;
    let completedClaimsCount = 0;
    let estimatedMealsRescued = 0;

    if (org) {
      // 2. Active claims in progress
      activeClaimsCount = await Pickup.countDocuments({
        receivingOrganization: org._id,
        statusPipeline: { $in: ['matched', 'pickup_scheduled', 'picked_up'] }
      });

      // 3. Completed claims
      const completedPickups = await Pickup.find({
        receivingOrganization: org._id,
        statusPipeline: { $in: ['delivered_or_recycled', 'completed'] }
      }).populate('donation', 'quantity');

      completedClaimsCount = completedPickups.length;

      // 4. Calculate total meals rescued
      for (const pickup of completedPickups) {
        if (pickup.donation && pickup.donation.quantity) {
          estimatedMealsRescued += parseEstimatedPortions(pickup.donation.quantity);
        }
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        district: userDistrict,
        availableInDistrict,
        totalAvailable,
        activeClaimsCount,
        completedClaimsCount,
        estimatedMealsRescued,
        isVerified: req.user.verificationStatus === 'verified' || (org && org.verificationStatus === 'verified')
      }
    });
  } catch (error) {
    console.error('Error fetching recipient stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recipient statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Claim an available surplus food donation
 * @route   POST /api/match/:donationId/claim
 * @access  Private (Recipient, Admin)
 */
const claimDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { notes } = req.body || {};

    // 1. Check organization verification
    let org = null;
    if (req.user.organization) {
      org = await Organization.findById(req.user.organization);
    }
    if (!org) {
      org = await Organization.findOne({ linkedUser: req.user._id });
    }

    const isUserVerified = req.user.verificationStatus === 'verified' || req.user.role === 'admin';
    const isOrgVerified = org ? org.verificationStatus === 'verified' : false;

    if (!isUserVerified && !isOrgVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your organization is pending administrative verification. Only verified charities and shelters can claim surplus food.'
      });
    }

    if (!org && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Recipient organization profile not found. Please ensure your organization profile is registered.'
      });
    }

    // 2. Fetch and validate donation
    const donation = await Donation.findById(donationId).populate('donor', 'name email contactNumber');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found.'
      });
    }

    // Check status
    if (donation.status !== 'posted') {
      return res.status(400).json({
        success: false,
        message: `This donation is no longer available (current status: ${donation.status}).`
      });
    }

    // Check expiration
    if (new Date(donation.pickupDeadline).getTime() <= Date.now()) {
      donation.status = 'expired';
      await donation.save();
      return res.status(400).json({
        success: false,
        message: 'This donation has expired and cannot be claimed.'
      });
    }

    // 3. Update donation status to 'matched'
    donation.status = 'matched';
    donation.matchedRecipient = org ? org._id : null;
    await donation.save();

    // 4. Create Pickup logistics record
    const pickup = await Pickup.create({
      donation: donation._id,
      receivingOrganization: org ? org._id : donation.matchedRecipient,
      statusPipeline: 'matched',
      statusHistory: [
        {
          status: 'matched',
          timestamp: new Date()
        }
      ]
    });

    // 5. Emit Notifications
    const orgName = org ? org.name : req.user.name;

    // Notification to Donor
    if (donation.donor) {
      await createNotification({
        recipientUser: donation.donor._id || donation.donor,
        message: `${orgName} has claimed your donation "${donation.foodType}" (${donation.quantity}). A volunteer courier can now be assigned for pickup.`,
        relatedType: 'donation',
        relatedId: donation._id
      });
    }

    // Notification to Recipient
    await createNotification({
      recipientUser: req.user._id,
      message: `You successfully claimed "${donation.foodType}". The pickup order has entered the volunteer logistics pipeline.`,
      relatedType: 'pickup',
      relatedId: pickup._id
    });

    return res.status(200).json({
      success: true,
      message: 'Donation claimed successfully! Pickup has been scheduled.',
      donation,
      pickup
    });
  } catch (error) {
    console.error('Error claiming donation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to claim donation',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel an active donation claim before courier pickup
 * @route   PUT /api/match/:donationId/cancel-claim
 * @access  Private (Recipient, Admin)
 */
const cancelDonationClaim = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { reason = 'Recipient organization unable to accept' } = req.body || {};

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    if (donation.status !== 'matched') {
      return res.status(400).json({
        success: false,
        message: `Claim cannot be cancelled in status "${donation.status}". (Only claims before courier pickup can be cancelled).`
      });
    }

    // Find organization
    let org = null;
    if (req.user.organization) {
      org = await Organization.findById(req.user.organization);
    }
    if (!org) {
      org = await Organization.findOne({ linkedUser: req.user._id });
    }

    // Verification that this recipient owns the claim
    if (
      req.user.role !== 'admin' &&
      org &&
      String(donation.matchedRecipient) !== String(org._id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel a claim made by another organization.'
      });
    }

    // Revert donation to 'posted'
    donation.status = 'posted';
    donation.matchedRecipient = null;
    await donation.save();

    // Cancel or delete the linked pickup
    await Pickup.findOneAndDelete({
      donation: donation._id,
      statusPipeline: 'matched'
    });

    // Notify donor
    if (donation.donor) {
      await createNotification({
        recipientUser: donation.donor,
        message: `The claim on your donation "${donation.foodType}" was released (${reason}). It has been returned to the open surplus pool.`,
        relatedType: 'donation',
        relatedId: donation._id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Donation claim cancelled. The item has been returned to the active surplus pool.',
      donation
    });
  } catch (error) {
    console.error('Error cancelling claim:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel claim',
      error: error.message
    });
  }
};

/**
 * @desc    Get all claims made by the logged-in recipient
 * @route   GET /api/match/my-claims
 * @access  Private (Recipient, Admin)
 */
const getMyClaims = async (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let org = null;
    if (req.user.organization) {
      org = await Organization.findById(req.user.organization);
    }
    if (!org) {
      org = await Organization.findOne({ linkedUser: req.user._id });
    }

    if (!org && req.user.role !== 'admin') {
      return res.status(200).json({ success: true, count: 0, claims: [] });
    }

    const filter = {};
    if (org) {
      filter.receivingOrganization = org._id;
    }

    if (status === 'active') {
      filter.statusPipeline = { $in: ['matched', 'pickup_scheduled', 'picked_up'] };
    } else if (status === 'completed') {
      filter.statusPipeline = { $in: ['delivered_or_recycled', 'completed'] };
    }

    const pickups = await Pickup.find(filter)
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate('volunteer', 'name email contactNumber district')
      .populate('receivingOrganization', 'name type district')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich pickups with time details
    const claims = pickups.map((p) => {
      const donation = p.donation;
      let hoursRemaining = null;
      let urgencyLevel = 'standard';

      if (donation && donation.pickupDeadline) {
        const remaining = (new Date(donation.pickupDeadline).getTime() - Date.now()) / (1000 * 60 * 60);
        hoursRemaining = Math.max(0, Math.round(remaining * 10) / 10);
        if (hoursRemaining <= 2) urgencyLevel = 'critical';
        else if (hoursRemaining <= 6) urgencyLevel = 'high';
      }

      return {
        ...p,
        hoursRemaining,
        urgencyLevel
      };
    });

    return res.status(200).json({
      success: true,
      count: claims.length,
      claims
    });
  } catch (error) {
    console.error('Error fetching recipient claims:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve recipient claims',
      error: error.message
    });
  }
};

/**
 * @desc    Find and rank matching recipient organizations for a specific donation
 * @route   GET /api/match/recipients-for-donation/:donationId
 * @access  Private (Donor, Admin, Recipient)
 */
const rankRecipientsForDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation not found.' });
    }

    // Find all verified recipient organizations
    const organizations = await Organization.find({
      type: { $in: ['ngo', 'charity', 'shelter'] },
      verificationStatus: 'verified'
    }).populate('linkedUser', 'name email contactNumber district');

    const rankedOrgs = organizations.map((org) => {
      const distanceKm = getDistrictDistanceKm(donation.district, org.district);
      const matchResult = calculateSmartMatchScore({
        donation,
        recipientDistrict: org.district
      });

      return {
        _id: org._id,
        name: org.name,
        type: org.type,
        district: org.district,
        registrationInfo: org.registrationInfo,
        contactPerson: org.linkedUser ? org.linkedUser.name : 'N/A',
        contactNumber: org.linkedUser ? org.linkedUser.contactNumber : 'N/A',
        distanceKm,
        matchScore: matchResult.matchScore,
        breakdown: matchResult.breakdown
      };
    });

    // Sort by best match score
    rankedOrgs.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      donationId: donation._id,
      donationDistrict: donation.district,
      totalMatchedOrgs: rankedOrgs.length,
      organizations: rankedOrgs
    });
  } catch (error) {
    console.error('Error ranking recipients for donation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rank recipient organizations',
      error: error.message
    });
  }
};

module.exports = {
  getNearbyDonations,
  getRecipientStats,
  claimDonation,
  cancelDonationClaim,
  getMyClaims,
  rankRecipientsForDonation
};
