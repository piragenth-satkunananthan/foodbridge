const Donation = require("../models/Donation");

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
    return res.status(201).json(donation);
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: "Donation details are invalid", error: error.message });
    }
    console.error("Donation creation error:", error);
    return res.status(500).json({ message: "Unable to save donation" });
  }
};

module.exports = { createDonation };
