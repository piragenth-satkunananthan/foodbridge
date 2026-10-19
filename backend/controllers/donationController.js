const Donation = require("../models/Donation");
const Pickup = require("../models/Pickup");
const WasteRequest = require("../models/WasteRequest");
const { createNotification } = require("../utils/notificationService");

const postingFields = new Set([
  "foodType",
  "quantity",
  "preparedTime",
  "storageCondition",
  "pickupDeadline",
  "photo",
  "district",
  "specialInstructions"
]);
const storageConditions = new Set(["refrigerated", "room_temperature", "frozen"]);

const parseQuantity = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? String(value) : null;
  }
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  const match = normalized.match(/^((?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)(?:\s+([A-Za-z][A-Za-z -]*))?$/);
  if (!match || !Number.isFinite(Number(match[1])) || Number(match[1]) <= 0) {
    return null;
  }

  return normalized;
};

const parseDate = (value) => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// @route POST /api/donations
// @access Private (Donor only)
const createDonation = async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ message: "Request body must be a JSON object" });
  }

  const unsupportedFields = Object.keys(body).filter((field) => !postingFields.has(field));
  if (unsupportedFields.length > 0) {
    return res.status(400).json({
      message: `Unsupported field(s): ${unsupportedFields.join(", ")}`
    });
  }

  const errors = {};
  for (const field of ["foodType", "district", "storageCondition"]) {
    if (typeof body[field] !== "string" || !body[field].trim()) {
      errors[field] = "This field is required and must be a non-empty string";
    }
  }

  const quantity = parseQuantity(body.quantity);
  if (!quantity) {
    errors.quantity = "Quantity must be a positive finite number, optionally followed by a unit (for example, '20 kg')";
  }

  const preparedTime = parseDate(body.preparedTime);
  if (!preparedTime) {
    errors.preparedTime = "A valid preparation/available date is required";
  }

  const pickupDeadline = parseDate(body.pickupDeadline);
  if (!pickupDeadline) {
    errors.pickupDeadline = "A valid pickup deadline is required";
  } else {
    if (pickupDeadline.getTime() <= Date.now()) {
      errors.pickupDeadline = "Pickup deadline must be in the future";
    }
    if (preparedTime && pickupDeadline.getTime() <= preparedTime.getTime()) {
      errors.pickupDeadline = "Pickup deadline must be after preparation/available time";
    }
  }

  if (body.storageCondition && !storageConditions.has(body.storageCondition)) {
    errors.storageCondition = "Storage condition must be refrigerated, room_temperature, or frozen";
  }
  if (body.photo !== undefined && body.photo !== null && typeof body.photo !== "string") {
    errors.photo = "Photo must be a URL string or null";
  }
  if (body.specialInstructions !== undefined && typeof body.specialInstructions !== "string") {
    errors.specialInstructions = "Special instructions must be a string";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Donation details are invalid", errors });
  }

  const donationDetails = {
    donor: req.user._id,
    foodType: body.foodType.trim(),
    quantity,
    preparedTime,
    storageCondition: body.storageCondition,
    pickupDeadline,
    district: body.district.trim(),
    status: "posted"
  };

  if (body.photo !== undefined) {
    donationDetails.photo = body.photo;
  }
  if (body.specialInstructions !== undefined) {
    donationDetails.specialInstructions = body.specialInstructions;
  }

  try {
    const donation = await Donation.create(donationDetails);

    // Create confirmation in-app notification
    await createNotification({
      recipientUser: req.user._id,
      message: `Your food surplus post for "${donation.foodType}" (${donation.quantity}) was created successfully.`,
      relatedType: "donation",
      relatedId: donation._id
    });

    return res.status(201).json(donation);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Donation details are invalid", error: error.message });
    }
    console.error("Donation creation error:", error);
    return res.status(500).json({ message: "Unable to save donation" });
  }
};

// @route GET /api/donations
// @access Private
const getDonations = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // Donors only see their own donations unless admin
    if (req.user.role === "donor") {
      query.donor = req.user._id;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      query.foodType = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [donations, total] = await Promise.all([
      Donation.find(query)
        .populate("matchedRecipient", "name type district contactNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Donation.countDocuments(query)
    ]);

    res.json({
      donations,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({ message: "Error retrieving donations", error: error.message });
  }
};

// @route GET /api/donations/stats
// @access Private (Donor/Admin)
const getDonorStats = async (req, res) => {
  try {
    const donorId = req.user._id;
    const [donations, wasteRequests] = await Promise.all([
      Donation.find({ donor: donorId }),
      WasteRequest.find({ donor: donorId })
    ]);

    const activeDonations = donations.filter((d) =>
      ["posted", "matched", "pickup_scheduled", "picked_up"].includes(d.status)
    ).length;

    const completedDonations = donations.filter((d) =>
      ["delivered", "completed"].includes(d.status)
    ).length;

    const cancelledDonations = donations.filter((d) => d.status === "cancelled").length;

    const totalWasteRequests = wasteRequests.length;
    const activeWasteRequests = wasteRequests.filter((w) =>
      ["posted", "matched", "pickup_scheduled", "picked_up"].includes(w.status)
    ).length;
    const completedWasteRequests = wasteRequests.filter((w) =>
      ["recycled", "completed"].includes(w.status)
    ).length;

    // Calculate estimated meals saved from completed donations
    let estimatedMeals = 0;
    donations
      .filter((d) => ["delivered", "completed"].includes(d.status))
      .forEach((d) => {
        const raw = String(d.quantity || "");
        const match = raw.match(/^(\d+(?:\.\d+)?)/);
        if (match) {
          const num = parseFloat(match[1]);
          if (raw.toLowerCase().includes("plate") || raw.toLowerCase().includes("portion")) {
            estimatedMeals += Math.round(num);
          } else {
            // Approx. 1 kg = 2.5 meals
            estimatedMeals += Math.round(num * 2.5);
          }
        }
      });

    res.json({
      totalDonations: donations.length,
      activeDonations,
      completedDonations,
      cancelledDonations,
      totalWasteRequests,
      activeWasteRequests,
      completedWasteRequests,
      estimatedMeals
    });
  } catch (error) {
    console.error("Get donor stats error:", error);
    res.status(500).json({ message: "Error fetching donor statistics", error: error.message });
  }
};

// @route GET /api/donations/:id
// @access Private
const getDonationById = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === "donor") {
      query.donor = req.user._id;
    }

    const donation = await Donation.findOne(query).populate(
      "matchedRecipient",
      "name type district contactNumber registrationInfo"
    );

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Look for associated pickup job if one exists
    const pickup = await Pickup.findOne({ donation: donation._id })
      .populate("volunteer", "name contactNumber district")
      .populate("receivingOrganization", "name district type");

    res.json({ donation, pickup });
  } catch (error) {
    console.error("Get donation by ID error:", error);
    res.status(500).json({ message: "Error retrieving donation details", error: error.message });
  }
};

// @route PUT /api/donations/:id
// @access Private (Donor only)
const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user._id });
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.status !== "posted") {
      return res.status(400).json({
        message: `Cannot update a donation that is already '${donation.status}'. Only 'posted' donations can be edited.`
      });
    }

    const body = req.body;
    if (body.foodType !== undefined) {
      if (typeof body.foodType !== "string" || !body.foodType.trim()) {
        return res.status(400).json({ message: "Food type cannot be empty" });
      }
      donation.foodType = body.foodType.trim();
    }

    if (body.quantity !== undefined) {
      const parsed = parseQuantity(body.quantity);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid quantity format" });
      }
      donation.quantity = parsed;
    }

    if (body.preparedTime !== undefined) {
      const parsedDate = parseDate(body.preparedTime);
      if (!parsedDate) {
        return res.status(400).json({ message: "Invalid preparation time" });
      }
      donation.preparedTime = parsedDate;
    }

    if (body.storageCondition !== undefined) {
      if (!storageConditions.has(body.storageCondition)) {
        return res.status(400).json({ message: "Invalid storage condition" });
      }
      donation.storageCondition = body.storageCondition;
    }

    if (body.pickupDeadline !== undefined) {
      const parsedDeadline = parseDate(body.pickupDeadline);
      if (!parsedDeadline || parsedDeadline.getTime() <= Date.now()) {
        return res.status(400).json({ message: "Pickup deadline must be in the future" });
      }
      donation.pickupDeadline = parsedDeadline;
    }

    if (body.district !== undefined) {
      if (typeof body.district !== "string" || !body.district.trim()) {
        return res.status(400).json({ message: "District cannot be empty" });
      }
      donation.district = body.district.trim();
    }

    if (body.photo !== undefined) {
      donation.photo = body.photo;
    }

    if (body.specialInstructions !== undefined) {
      donation.specialInstructions = body.specialInstructions;
    }

    await donation.save();
    res.json(donation);
  } catch (error) {
    console.error("Update donation error:", error);
    res.status(500).json({ message: "Error updating donation", error: error.message });
  }
};

// @route DELETE /api/donations/:id
// @access Private (Donor only)
const cancelDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user._id });
    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    if (donation.status !== "posted") {
      return res.status(400).json({
        message: `Cannot cancel a donation that is already '${donation.status}'. Only 'posted' donations can be cancelled.`
      });
    }

    donation.status = "cancelled";
    await donation.save();

    await createNotification({
      recipientUser: req.user._id,
      message: `You cancelled your food donation for "${donation.foodType}".`,
      relatedType: "donation",
      relatedId: donation._id
    });

    res.json({ message: "Donation cancelled successfully", donation });
  } catch (error) {
    console.error("Cancel donation error:", error);
    res.status(500).json({ message: "Error cancelling donation", error: error.message });
  }
};

module.exports = {
  createDonation,
  getDonations,
  getDonationById,
  updateDonation,
  cancelDonation,
  getDonorStats
};
