const Pickup = require('../models/Pickup');
const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');
const {
  DISTRICT_COORDINATES,
  getDistrictDistanceKm,
  estimateTransitMinutes
} = require('../utils/routeUtils');

/**
 * Helper to calculate estimated meals or weight from quantity string
 */
function parseQuantityMetrics(quantityStr) {
  if (!quantityStr) return { meals: 0, kg: 0 };
  const str = String(quantityStr).toLowerCase().trim();

  // Match plates or meals
  const mealMatch = str.match(/(\d+(?:\.\d+)?)\s*(plates|meals|portions|packets|boxes)/);
  if (mealMatch) {
    const meals = parseFloat(mealMatch[1]);
    return { meals, kg: Math.round(meals * 0.4 * 10) / 10 }; // 0.4kg per meal
  }

  // Match kg or grams or tons
  const kgMatch = str.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    return { meals: Math.round(kg * 2.5), kg }; // 2.5 meals per kg
  }

  const tonMatch = str.match(/(\d+(?:\.\d+)?)\s*(ton|tons)/);
  if (tonMatch) {
    const kg = parseFloat(tonMatch[1]) * 1000;
    return { meals: Math.round(kg * 2.5), kg };
  }

  // Raw number fallback
  const rawNum = parseFloat(str);
  if (!isNaN(rawNum)) {
    return { meals: Math.round(rawNum), kg: Math.round(rawNum * 0.4 * 10) / 10 };
  }

  return { meals: 25, kg: 10 }; // Safe baseline fallback
}

/**
 * Format pickup with route and distance metadata
 */
function enrichPickupWithRoute(pickupDoc, volunteerDistrict) {
  const pickup = pickupDoc.toObject ? pickupDoc.toObject() : pickupDoc;

  const donorDistrict =
    pickup.donation?.district ||
    pickup.donation?.donor?.district ||
    pickup.wasteRequest?.district ||
    pickup.wasteRequest?.donor?.district ||
    'Colombo';

  const recipientDistrict =
    pickup.receivingOrganization?.district ||
    pickup.receivingOrganization?.linkedUser?.district ||
    donorDistrict;

  const routeDistanceKm = getDistrictDistanceKm(donorDistrict, recipientDistrict);
  const transitTimeMins = estimateTransitMinutes(routeDistanceKm);

  // Distance from volunteer to pickup origin
  const volunteerToOriginKm = volunteerDistrict
    ? getDistrictDistanceKm(volunteerDistrict, donorDistrict)
    : 3.5;

  const originCoords = DISTRICT_COORDINATES[donorDistrict] || DISTRICT_COORDINATES.Colombo;
  const destinationCoords =
    DISTRICT_COORDINATES[recipientDistrict] || DISTRICT_COORDINATES.Colombo;

  const quantityStr = pickup.donation?.quantity || pickup.wasteRequest?.quantity || '';
  const metrics = parseQuantityMetrics(quantityStr);

  return {
    ...pickup,
    routeDetails: {
      originDistrict: donorDistrict,
      destinationDistrict: recipientDistrict,
      routeDistanceKm,
      transitTimeMinutes: transitTimeMins,
      volunteerToOriginKm,
      originCoords,
      destinationCoords,
      currentLocation: pickup.routeLocation?.lat
        ? pickup.routeLocation
        : originCoords
    },
    metrics
  };
}

/**
 * @route   GET /api/pickups/open
 * @desc    Get all open pickup jobs available for volunteer assignment
 * @access  Private (Volunteer, Admin)
 */
const getOpenPickupJobs = async (req, res) => {
  try {
    const volunteerDistrict = req.user?.district || 'Colombo';
    const filterDistrict = req.query.district;

    // 1. Synchronize any matched donations that don't have a Pickup record yet
    const matchedDonations = await Donation.find({
      status: 'matched',
      matchedRecipient: { $ne: null }
    });

    for (const don of matchedDonations) {
      const existing = await Pickup.findOne({ donation: don._id });
      if (!existing) {
        await Pickup.create({
          donation: don._id,
          receivingOrganization: don.matchedRecipient,
          statusPipeline: 'matched',
          statusHistory: [
            { status: 'posted', timestamp: don.createdAt || new Date() },
            { status: 'matched', timestamp: don.updatedAt || new Date() }
          ]
        });
      }
    }

    // 2. Synchronize any matched waste requests that don't have a Pickup record yet
    const matchedWaste = await WasteRequest.find({
      status: 'matched',
      matchedCollector: { $ne: null }
    });

    for (const waste of matchedWaste) {
      const existing = await Pickup.findOne({ wasteRequest: waste._id });
      if (!existing) {
        await Pickup.create({
          wasteRequest: waste._id,
          receivingOrganization: waste.matchedCollector,
          statusPipeline: 'matched',
          statusHistory: [
            { status: 'posted', timestamp: waste.createdAt || new Date() },
            { status: 'matched', timestamp: waste.updatedAt || new Date() }
          ]
        });
      }
    }

    // 3. Find open pickups awaiting courier assignment
    const query = {
      statusPipeline: 'matched',
      volunteer: null
    };

    const pickups = await Pickup.find(query)
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'receivingOrganization',
        populate: { path: 'linkedUser', select: 'name email contactNumber district' }
      })
      .sort({ createdAt: -1 });

    // Filter out items where both donation and wasteRequest are missing or cancelled
    const validPickups = pickups.filter(
      (p) =>
        (p.donation && p.donation.status !== 'cancelled') ||
        (p.wasteRequest && p.wasteRequest.status !== 'cancelled')
    );

    // Enrich with route calculations
    let enriched = validPickups.map((p) => enrichPickupWithRoute(p, volunteerDistrict));

    // Optional district filter
    if (filterDistrict && filterDistrict !== 'all') {
      enriched = enriched.filter(
        (p) =>
          p.routeDetails.originDistrict.toLowerCase() === filterDistrict.toLowerCase() ||
          p.routeDetails.destinationDistrict.toLowerCase() === filterDistrict.toLowerCase()
      );
    }

    // Sort: items in volunteer's district first, then by shortest volunteer-to-origin distance
    enriched.sort((a, b) => {
      const aLocal = a.routeDetails.originDistrict === volunteerDistrict ? 0 : 1;
      const bLocal = b.routeDetails.originDistrict === volunteerDistrict ? 0 : 1;
      if (aLocal !== bLocal) return aLocal - bLocal;
      return a.routeDetails.volunteerToOriginKm - b.routeDetails.volunteerToOriginKm;
    });

    res.json({
      success: true,
      count: enriched.length,
      volunteerDistrict,
      jobs: enriched
    });
  } catch (error) {
    console.error('Error fetching open pickup jobs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching open pickup jobs' });
  }
};

/**
 * @route   GET /api/pickups/my-active
 * @desc    Get the active in-progress mission for the logged-in volunteer
 * @access  Private (Volunteer, Admin)
 */
const getMyActiveJobs = async (req, res) => {
  try {
    const activePickups = await Pickup.find({
      volunteer: req.user._id,
      statusPipeline: { $in: ['pickup_scheduled', 'picked_up', 'delivered_or_recycled'] }
    })
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'receivingOrganization',
        populate: { path: 'linkedUser', select: 'name email contactNumber district' }
      })
      .sort({ updatedAt: -1 });

    const enriched = activePickups.map((p) =>
      enrichPickupWithRoute(p, req.user?.district || 'Colombo')
    );

    res.json({
      success: true,
      count: enriched.length,
      activeJobs: enriched
    });
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active missions' });
  }
};

/**
 * @route   GET /api/pickups/history
 * @desc    Get completed delivery history for the logged-in volunteer
 * @access  Private (Volunteer, Admin)
 */
const getPickupHistory = async (req, res) => {
  try {
    const completed = await Pickup.find({
      volunteer: req.user._id,
      statusPipeline: 'completed'
    })
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'receivingOrganization',
        populate: { path: 'linkedUser', select: 'name email contactNumber district' }
      })
      .sort({ updatedAt: -1 });

    const enriched = completed.map((p) =>
      enrichPickupWithRoute(p, req.user?.district || 'Colombo')
    );

    res.json({
      success: true,
      count: enriched.length,
      history: enriched
    });
  } catch (error) {
    console.error('Error fetching pickup history:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pickup history' });
  }
};

/**
 * @route   GET /api/pickups/stats
 * @desc    Get aggregated courier metrics and stats for volunteer
 * @access  Private (Volunteer, Admin)
 */
const getVolunteerStats = async (req, res) => {
  try {
    const volunteerId = req.user._id;

    const allMyPickups = await Pickup.find({ volunteer: volunteerId })
      .populate('donation', 'quantity foodType district')
      .populate('wasteRequest', 'quantity wasteCategory district')
      .populate('receivingOrganization', 'name district');

    const completed = allMyPickups.filter((p) => p.statusPipeline === 'completed');
    const active = allMyPickups.filter((p) =>
      ['pickup_scheduled', 'picked_up', 'delivered_or_recycled'].includes(p.statusPipeline)
    );

    let totalMealsTransported = 0;
    let totalKgDiverted = 0;
    let totalKmTraveled = 0;

    completed.forEach((p) => {
      const qStr = p.donation?.quantity || p.wasteRequest?.quantity || '';
      const m = parseQuantityMetrics(qStr);
      totalMealsTransported += m.meals;
      totalKgDiverted += m.kg;

      const originDist = p.donation?.district || p.wasteRequest?.district || 'Colombo';
      const destDist = p.receivingOrganization?.district || 'Colombo';
      totalKmTraveled += getDistrictDistanceKm(originDist, destDist);
    });

    res.json({
      success: true,
      stats: {
        completedMissions: completed.length,
        activeMissions: active.length,
        totalMissions: allMyPickups.length,
        totalMealsTransported,
        totalKgDiverted: Math.round(totalKgDiverted * 10) / 10,
        totalKmTraveled: Math.round(totalKmTraveled * 10) / 10,
        volunteerDistrict: req.user.district,
        volunteerName: req.user.name,
        verificationStatus: req.user.verificationStatus
      }
    });
  } catch (error) {
    console.error('Error fetching volunteer stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching volunteer statistics' });
  }
};

/**
 * @route   GET /api/pickups/:id
 * @desc    Get a single pickup job by ID
 * @access  Private
 */
const getPickupById = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate('volunteer', 'name email contactNumber district')
      .populate({
        path: 'receivingOrganization',
        populate: { path: 'linkedUser', select: 'name email contactNumber district' }
      });

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup job not found' });
    }

    const enriched = enrichPickupWithRoute(pickup, req.user?.district || 'Colombo');
    res.json({ success: true, pickup: enriched });
  } catch (error) {
    console.error('Error fetching pickup by id:', error);
    res.status(500).json({ success: false, message: 'Server error fetching pickup details' });
  }
};

/**
 * @route   POST /api/pickups/:id/accept
 * @desc    Volunteer accepts an open pickup job
 * @access  Private (Volunteer, Admin)
 */
const acceptPickupJob = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate('donation')
      .populate('wasteRequest')
      .populate('receivingOrganization');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup job not found' });
    }

    if (pickup.statusPipeline !== 'matched' || pickup.volunteer) {
      return res.status(400).json({
        success: false,
        message: 'This job has already been assigned or is not available for pickup'
      });
    }

    // Assign volunteer and update pipeline stage
    pickup.volunteer = req.user._id;
    pickup.statusPipeline = 'pickup_scheduled';

    const donorDistrict =
      pickup.donation?.district || pickup.wasteRequest?.district || 'Colombo';
    const initialCoords = DISTRICT_COORDINATES[donorDistrict] || { lat: 6.9271, lng: 79.8612 };
    pickup.routeLocation = initialCoords;

    pickup.statusHistory.push({
      status: 'pickup_scheduled',
      timestamp: new Date(),
      note: `Courier ${req.user.name} accepted delivery dispatch`
    });

    await pickup.save();

    // Synchronize linked Donation or WasteRequest status
    if (pickup.donation) {
      await Donation.findByIdAndUpdate(pickup.donation._id, {
        status: 'pickup_scheduled'
      });
    }
    if (pickup.wasteRequest) {
      await WasteRequest.findByIdAndUpdate(pickup.wasteRequest._id, {
        status: 'pickup_scheduled'
      });
    }

    // Send real-time notifications
    const donorUserId = pickup.donation?.donor || pickup.wasteRequest?.donor;
    const recipientUserId = pickup.receivingOrganization?.linkedUser;

    if (donorUserId) {
      await createNotification({
        recipientUser: donorUserId,
        message: `Courier ${req.user.name} has accepted pickup for your listing. Dispatch is scheduled!`,
        relatedType: 'pickup',
        relatedId: pickup._id
      });
    }

    if (recipientUserId) {
      await createNotification({
        recipientUser: recipientUserId,
        message: `Courier ${req.user.name} is scheduled to transport your claimed surplus rescue batch.`,
        relatedType: 'pickup',
        relatedId: pickup._id
      });
    }

    const updated = await Pickup.findById(pickup._id)
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate('volunteer', 'name email contactNumber district')
      .populate({
        path: 'receivingOrganization',
        populate: { path: 'linkedUser', select: 'name email contactNumber district' }
      });

    res.json({
      success: true,
      message: 'Pickup job successfully accepted!',
      pickup: enrichPickupWithRoute(updated, req.user?.district || 'Colombo')
    });
  } catch (error) {
    console.error('Error accepting pickup job:', error);
    res.status(500).json({ success: false, message: 'Server error accepting pickup job' });
  }
};

/**
 * @route   PUT /api/pickups/:id/status
 * @desc    Update pickup status milestone (picked_up -> delivered_or_recycled -> completed)
 * @access  Private (Volunteer, Admin)
 */
const updatePickupStatus = async (req, res) => {
  try {
    const { status, note, proofNotes, lat, lng } = req.body;

    const validStages = ['picked_up', 'delivered_or_recycled', 'completed'];
    if (!validStages.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status milestone. Must be one of: ${validStages.join(', ')}`
      });
    }

    const pickup = await Pickup.findById(req.params.id)
      .populate('donation')
      .populate('wasteRequest')
      .populate('receivingOrganization');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup job not found' });
    }

    // Only assigned volunteer or admin can update
    const isAssigned = pickup.volunteer && pickup.volunteer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the assigned courier can update delivery milestones'
      });
    }

    // Validate sequential state transition logic
    const current = pickup.statusPipeline;
    const allowedTransitions = {
      pickup_scheduled: ['picked_up'],
      picked_up: ['delivered_or_recycled', 'completed'],
      delivered_or_recycled: ['completed']
    };

    if (!allowedTransitions[current] || !allowedTransitions[current].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition status from "${current}" to "${status}".`
      });
    }

    // Apply status update
    pickup.statusPipeline = status;

    if (proofNotes) pickup.proofNotes = proofNotes;
    if (lat && lng) pickup.routeLocation = { lat, lng };

    if (status === 'completed') {
      pickup.completionConfirmedAt = new Date();
    }

    pickup.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status advanced to ${status} by courier ${req.user.name}`
    });

    await pickup.save();

    // Synchronize Donation or WasteRequest status
    if (pickup.donation) {
      let donStatus = 'picked_up';
      if (status === 'delivered_or_recycled') donStatus = 'delivered';
      if (status === 'completed') donStatus = 'completed';

      await Donation.findByIdAndUpdate(pickup.donation._id, { status: donStatus });
    }

    if (pickup.wasteRequest) {
      let wasteStatus = 'picked_up';
      if (status === 'delivered_or_recycled') wasteStatus = 'recycled';
      if (status === 'completed') wasteStatus = 'completed';

      await WasteRequest.findByIdAndUpdate(pickup.wasteRequest._id, { status: wasteStatus });
    }

    // Send context-aware notifications
    const donorUserId = pickup.donation?.donor || pickup.wasteRequest?.donor;
    const recipientUserId = pickup.receivingOrganization?.linkedUser;

    if (status === 'picked_up') {
      if (recipientUserId) {
        await createNotification({
          recipientUser: recipientUserId,
          message: `Courier ${req.user.name} has picked up the surplus. It is currently in transit!`,
          relatedType: 'pickup',
          relatedId: pickup._id
        });
      }
      if (donorUserId) {
        await createNotification({
          recipientUser: donorUserId,
          message: `Courier ${req.user.name} has successfully collected the surplus from your premises.`,
          relatedType: 'pickup',
          relatedId: pickup._id
        });
      }
    } else if (status === 'delivered_or_recycled') {
      if (recipientUserId) {
        await createNotification({
          recipientUser: recipientUserId,
          message: `Courier ${req.user.name} has arrived and delivered your surplus rescue batch.`,
          relatedType: 'pickup',
          relatedId: pickup._id
        });
      }
      if (donorUserId) {
        await createNotification({
          recipientUser: donorUserId,
          message: `Your food surplus has safely arrived and was delivered to ${pickup.receivingOrganization?.name || 'the recipient'}.`,
          relatedType: 'pickup',
          relatedId: pickup._id
        });
      }
    } else if (status === 'completed') {
      const completionMsg = `Rescue mission #${pickup._id.toString().slice(-6).toUpperCase()} is verified and completed. Great job!`;
      if (recipientUserId) {
        await createNotification({
          recipientUser: recipientUserId,
          message: completionMsg,
          relatedType: 'pickup',
          relatedId: pickup._id
        });
      }
      if (donorUserId) {
        await createNotification({
          recipientUser: donorUserId,
          message: completionMsg,
          relatedType: 'pickup',
          relatedId: pickup._id
        });
      }
    }

    const updated = await Pickup.findById(pickup._id)
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate({
        path: 'wasteRequest',
        populate: { path: 'donor', select: 'name email contactNumber district' }
      })
      .populate('volunteer', 'name email contactNumber district')
      .populate({
        path: 'receivingOrganization',
        populate: { path: 'linkedUser', select: 'name email contactNumber district' }
      });

    res.json({
      success: true,
      message: `Delivery milestone updated to "${status}"`,
      pickup: enrichPickupWithRoute(updated, req.user?.district || 'Colombo')
    });
  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({ success: false, message: 'Server error updating pickup status' });
  }
};

/**
 * @route   PUT /api/pickups/:id/cancel
 * @desc    Volunteer cancels/unassigns an accepted job before pickup
 * @access  Private (Volunteer, Admin)
 */
const cancelPickupJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const pickup = await Pickup.findById(req.params.id)
      .populate('donation')
      .populate('wasteRequest')
      .populate('receivingOrganization');

    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup job not found' });
    }

    const isAssigned = pickup.volunteer && pickup.volunteer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAssigned && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to cancel this job' });
    }

    if (pickup.statusPipeline !== 'pickup_scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a pickup that has already been collected or completed'
      });
    }

    // Revert to matched so another volunteer can accept
    pickup.volunteer = null;
    pickup.statusPipeline = 'matched';
    pickup.statusHistory.push({
      status: 'matched',
      timestamp: new Date(),
      note: `Courier ${req.user.name} cancelled assignment: ${reason || 'Emergency re-allocation'}`
    });

    await pickup.save();

    if (pickup.donation) {
      await Donation.findByIdAndUpdate(pickup.donation._id, { status: 'matched' });
    }
    if (pickup.wasteRequest) {
      await WasteRequest.findByIdAndUpdate(pickup.wasteRequest._id, { status: 'matched' });
    }

    // Notify donor and recipient
    const donorUserId = pickup.donation?.donor || pickup.wasteRequest?.donor;
    const recipientUserId = pickup.receivingOrganization?.linkedUser;

    if (donorUserId) {
      await createNotification({
        recipientUser: donorUserId,
        message: `Courier assignment was released. The job is back on the open logistics board.`,
        relatedType: 'pickup',
        relatedId: pickup._id
      });
    }
    if (recipientUserId) {
      await createNotification({
        recipientUser: recipientUserId,
        message: `Courier assignment was released. Awaiting next available courier.`,
        relatedType: 'pickup',
        relatedId: pickup._id
      });
    }

    res.json({
      success: true,
      message: 'Pickup job successfully cancelled and reopened for courier discovery'
    });
  } catch (error) {
    console.error('Error cancelling pickup job:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling pickup job' });
  }
};

/**
 * @route   PUT /api/pickups/:id/location
 * @desc    Live GPS location coordinate telemetry
 * @access  Private (Volunteer, Admin)
 */
const updatePickupLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Coordinates (lat, lng) required' });
    }

    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) {
      return res.status(404).json({ success: false, message: 'Pickup job not found' });
    }

    pickup.routeLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };
    await pickup.save();

    res.json({
      success: true,
      routeLocation: pickup.routeLocation
    });
  } catch (error) {
    console.error('Error updating pickup location:', error);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
};

module.exports = {
  getOpenPickupJobs,
  getMyActiveJobs,
  getPickupHistory,
  getVolunteerStats,
  getPickupById,
  acceptPickupJob,
  updatePickupStatus,
  cancelPickupJob,
  updatePickupLocation,
  parseQuantityMetrics
};
