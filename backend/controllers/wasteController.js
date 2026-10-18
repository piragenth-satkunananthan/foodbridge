const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const { createNotification } = require('../utils/notificationService');

const validCategories = new Set(['plastic', 'glass', 'paper', 'metal', 'organic', 'non_recyclable']);

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
        .populate('matchedCollector', 'name type district')
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
      .populate('matchedCollector', 'name type district contactNumber')
      .populate('donor', 'name district contactNumber');

    if (!wasteRequest) {
      return res.status(404).json({ message: 'Waste request not found' });
    }

    const pickup = await Pickup.findOne({ wasteRequest: wasteRequest._id })
      .populate('volunteer', 'name contactNumber')
      .populate('receivingOrganization', 'name district');

    res.json({ wasteRequest, pickup });
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

module.exports = {
  createWasteRequest,
  getWasteRequests,
  getWasteRequestById,
  updateWasteRequest,
  cancelWasteRequest
};
