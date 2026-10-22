const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    // Exactly one of these two will be set, depending on whether this pickup is for a Donation or a WasteRequest
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      default: null
    },
    wasteRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WasteRequest',
      default: null
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    receivingOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true
    },
    statusPipeline: {
      type: String,
      enum: ['posted', 'matched', 'pickup_scheduled', 'picked_up', 'delivered_or_recycled', 'completed'],
      default: 'posted'
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ],
    routeLocation: {
      lat: Number,
      lng: Number
    },
    proofNotes: {
      type: String,
      default: ''
    },
    deliveryNotes: {
      type: String,
      default: ''
    },
    completionConfirmedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pickup', pickupSchema);
