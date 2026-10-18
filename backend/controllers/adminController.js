const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const ImpactRecord = require('../models/ImpactRecord');
const { createNotification } = require('../utils/notificationService');
const { parseMealsCount, parseWeightKg } = require('./impactController');

// ==========================================
// 1. DASHBOARD & STATS
// ==========================================

// @desc    Get complete admin dashboard analytics and counts
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const [
      usersByRole,
      pendingVerificationsCount,
      orgsByStatus,
      donationsByStatus,
      wasteByStatus,
      wasteByCategory,
      pickupsByStatus,
      completedDonations,
      completedWaste,
      recentDonations,
      recentWaste,
      recentOrgs
    ] = await Promise.all([
      // Users grouped by role
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      // Pending organizations waiting for review
      Organization.countDocuments({ verificationStatus: 'pending' }),
      // Organizations grouped by verification status
      Organization.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
      ]),
      // Donations grouped by status
      Donation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Waste requests grouped by status
      WasteRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Waste requests grouped by category
      WasteRequest.aggregate([
        { $group: { _id: '$wasteCategory', count: { $sum: 1 } } }
      ]),
      // Pickups grouped by status pipeline
      Pickup.aggregate([
        { $group: { _id: '$statusPipeline', count: { $sum: 1 } } }
      ]),
      // Completed donations for quick meal calculation
      Donation.find({ status: { $in: ['delivered', 'completed'] } }).select('quantity'),
      // Completed waste for quick kg calculation
      WasteRequest.find({ status: { $in: ['recycled', 'completed'] } }).select('wasteCategory quantity'),
      // 5 most recent donations
      Donation.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('donor', 'name email district'),
      // 5 most recent waste requests
      WasteRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('donor', 'name email district'),
      // 5 most recent org registrations
      Organization.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('linkedUser', 'name email contactNumber')
    ]);

    // Format user counts map
    const userCounts = { donor: 0, recipient: 0, volunteer: 0, recycler: 0, admin: 0, total: 0 };
    usersByRole.forEach((u) => {
      if (userCounts[u._id] !== undefined) userCounts[u._id] = u.count;
      userCounts.total += u.count;
    });

    // Format organization status map
    const orgCounts = { pending: 0, verified: 0, rejected: 0, total: 0 };
    orgsByStatus.forEach((o) => {
      if (orgCounts[o._id] !== undefined) orgCounts[o._id] = o.count;
      orgCounts.total += o.count;
    });

    // Calculate quick totals
    let totalMealsRescued = 0;
    completedDonations.forEach((d) => {
      totalMealsRescued += parseMealsCount(d.quantity);
    });

    let totalKgRecycled = 0;
    let totalOrganicKg = 0;
    completedWaste.forEach((w) => {
      const kg = parseWeightKg(w.quantity);
      if (w.wasteCategory === 'organic') {
        totalOrganicKg += kg;
      } else {
        totalKgRecycled += kg;
      }
    });

    res.json({
      kpis: {
        totalUsers: userCounts.total,
        pendingVerifications: pendingVerificationsCount,
        totalDonations: donationsByStatus.reduce((acc, curr) => acc + curr.count, 0),
        totalWasteRequests: wasteByStatus.reduce((acc, curr) => acc + curr.count, 0),
        totalMealsRescued,
        totalKgRecycled: Math.round(totalKgRecycled * 10) / 10,
        totalOrganicKg: Math.round(totalOrganicKg * 10) / 10
      },
      userCounts,
      orgCounts,
      donationsByStatus: Object.fromEntries(donationsByStatus.map((d) => [d._id, d.count])),
      wasteByStatus: Object.fromEntries(wasteByStatus.map((w) => [w._id, w.count])),
      wasteByCategory: Object.fromEntries(wasteByCategory.map((w) => [w._id, w.count])),
      pickupsByStatus: Object.fromEntries(pickupsByStatus.map((p) => [p._id, p.count])),
      recentActivity: {
        donations: recentDonations,
        wasteRequests: recentWaste,
        organizations: recentOrgs
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 2. ORGANIZATION VERIFICATION
// ==========================================

// @desc    Get organizations with filter and search
// @route   GET /api/admin/organizations
// @access  Private/Admin
const getOrganizations = async (req, res) => {
  try {
    const { status, type, district, search } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.verificationStatus = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (district && district !== 'all') {
      filter.district = district;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { registrationInfo: { $regex: search, $options: 'i' } }
      ];
    }

    const organizations = await Organization.find(filter)
      .populate('linkedUser', 'name email contactNumber district verificationStatus status')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(organizations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single organization details
// @route   GET /api/admin/organizations/:id
// @access  Private/Admin
const getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('linkedUser', 'name email contactNumber district verificationStatus status createdAt')
      .populate('verifiedBy', 'name email');

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Also fetch past matched donations and waste requests for context
    const [pastDonations, pastWaste] = await Promise.all([
      Donation.find({ matchedRecipient: organization._id }).sort({ createdAt: -1 }).limit(10),
      WasteRequest.find({ matchedCollector: organization._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({
      organization,
      activity: {
        donations: pastDonations,
        wasteRequests: pastWaste
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify or reject an organization
// @route   PUT /api/admin/organizations/:id/verify
// @access  Private/Admin
const verifyOrganization = async (req, res) => {
  try {
    const { verificationStatus, remarks } = req.body;

    if (!['verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ message: "Status must be either 'verified' or 'rejected'" });
    }

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    organization.verificationStatus = verificationStatus;
    organization.verificationRemarks = remarks || '';
    organization.verifiedAt = new Date();
    organization.verifiedBy = req.user._id;
    await organization.save();

    // Synchronize linked user's verificationStatus
    if (organization.linkedUser) {
      await User.findByIdAndUpdate(organization.linkedUser, {
        verificationStatus
      });

      // Send in-app notification to the organization owner
      const isApproved = verificationStatus === 'verified';
      const notificationMsg = isApproved
        ? `Congratulations! Your organization "${organization.name}" has been officially verified by the platform admin.`
        : `Your organization verification request for "${organization.name}" was not approved.${remarks ? ' Remarks: ' + remarks : ''}`;

      await createNotification({
        recipientUser: organization.linkedUser,
        message: notificationMsg,
        relatedType: 'organization',
        relatedId: organization._id
      });
    }

    res.json({
      message: `Organization has been marked as ${verificationStatus}`,
      organization
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 3. PLATFORM MONITORING (DONATIONS, WASTE, PICKUPS)
// ==========================================

// @desc    Monitor all donations with status & district filters
// @route   GET /api/admin/donations
// @access  Private/Admin
const getAllDonations = async (req, res) => {
  try {
    const { status, district, foodType, search } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;
    if (district && district !== 'all') filter.district = district;
    if (foodType && foodType !== 'all') filter.foodType = { $regex: foodType, $options: 'i' };
    if (search) {
      filter.$or = [
        { foodType: { $regex: search, $options: 'i' } },
        { specialInstructions: { $regex: search, $options: 'i' } }
      ];
    }

    const donations = await Donation.find(filter)
      .populate('donor', 'name email contactNumber district')
      .populate('matchedRecipient', 'name type district')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Monitor all waste requests with category & status filters
// @route   GET /api/admin/waste-requests
// @access  Private/Admin
const getAllWasteRequests = async (req, res) => {
  try {
    const { category, status, district, search } = req.query;
    const filter = {};

    if (category && category !== 'all') filter.wasteCategory = category;
    if (status && status !== 'all') filter.status = status;
    if (district && district !== 'all') filter.district = district;
    if (search) {
      filter.quantity = { $regex: search, $options: 'i' };
    }

    const wasteRequests = await WasteRequest.find(filter)
      .populate('donor', 'name email contactNumber district')
      .populate('matchedCollector', 'name type district materialTypesHandled')
      .sort({ createdAt: -1 });

    res.json(wasteRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Monitor all pickups across the platform
// @route   GET /api/admin/pickups
// @access  Private/Admin
const getAllPickups = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.statusPipeline = status;
    }

    const pickups = await Pickup.find(filter)
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name contactNumber district' }
      })
      .populate('volunteer', 'name email contactNumber district')
      .populate('receivingOrganization', 'name type district')
      .sort({ createdAt: -1 });

    res.json(pickups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 4. USER & FAKE ACCOUNT MANAGEMENT
// ==========================================

// @desc    Get all users across all roles with search & filter
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, district, status, verificationStatus, search } = req.query;
    const filter = {};

    if (role && role !== 'all') filter.role = role;
    if (district && district !== 'all') filter.district = district;
    if (status && status !== 'all') filter.status = status;
    if (verificationStatus && verificationStatus !== 'all') filter.verificationStatus = verificationStatus;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('organization', 'name type registrationInfo verificationStatus')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user status (active / suspended)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'suspended'" });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Administrators cannot suspend their own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = status;
    await user.save();

    // Notify user if possible
    await createNotification({
      recipientUser: user._id,
      message:
        status === 'suspended'
          ? `Your account has been suspended by an admin.${reason ? ' Reason: ' + reason : ''}`
          : 'Your account has been reactivated by an admin.',
      relatedType: 'system'
    });

    res.json({
      message: `User status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account (fake account / spam removal)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Administrators cannot delete their own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up linked organization if applicable
    if (user.organization) {
      await Organization.findByIdAndDelete(user.organization);
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: `User "${user.name}" (${user.email}) successfully removed` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// 5. COMPREHENSIVE REPORTS GENERATION
// ==========================================

// @desc    Generate aggregated platform reports
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReports = async (req, res) => {
  try {
    const { fromDate, toDate, district } = req.query;
    const dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(fromDate);
      if (toDate) dateFilter.createdAt.$lte = new Date(toDate);
    }

    const donationMatch = { ...dateFilter };
    const wasteMatch = { ...dateFilter };
    if (district && district !== 'all') {
      donationMatch.district = district;
      wasteMatch.district = district;
    }

    const [
      donationsByDistrict,
      wasteByDistrict,
      wasteCategoryReport,
      totalDonations,
      completedDonations,
      totalWaste,
      completedWaste
    ] = await Promise.all([
      Donation.aggregate([
        { $match: donationMatch },
        { $group: { _id: '$district', total: { $sum: 1 }, completed: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'completed']] }, 1, 0] } } } },
        { $sort: { total: -1 } }
      ]),
      WasteRequest.aggregate([
        { $match: wasteMatch },
        { $group: { _id: '$district', total: { $sum: 1 }, recycled: { $sum: { $cond: [{ $in: ['$status', ['recycled', 'completed']] }, 1, 0] } } } },
        { $sort: { total: -1 } }
      ]),
      WasteRequest.aggregate([
        { $match: wasteMatch },
        { $group: { _id: '$wasteCategory', total: { $sum: 1 } } }
      ]),
      Donation.countDocuments(donationMatch),
      Donation.countDocuments({ ...donationMatch, status: { $in: ['delivered', 'completed'] } }),
      WasteRequest.countDocuments(wasteMatch),
      WasteRequest.countDocuments({ ...wasteMatch, status: { $in: ['recycled', 'completed'] } })
    ]);

    const donationSuccessRate = totalDonations > 0 ? Math.round((completedDonations / totalDonations) * 100) : 0;
    const wasteSuccessRate = totalWaste > 0 ? Math.round((completedWaste / totalWaste) * 100) : 0;

    res.json({
      filters: { fromDate, toDate, district: district || 'all' },
      summary: {
        totalDonations,
        completedDonations,
        donationSuccessRate: `${donationSuccessRate}%`,
        totalWasteRequests: totalWaste,
        completedWasteRequests: completedWaste,
        wasteSuccessRate: `${wasteSuccessRate}%`
      },
      donationsByDistrict,
      wasteByDistrict,
      wasteCategories: Object.fromEntries(wasteCategoryReport.map((w) => [w._id, w.total]))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getOrganizations,
  getOrganizationById,
  verifyOrganization,
  getAllDonations,
  getAllWasteRequests,
  getAllPickups,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getReports
};
