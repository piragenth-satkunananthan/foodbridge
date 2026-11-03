const mongoose = require('mongoose');

const wasteRequestSchema = new mongoose.Schema(
  {
    availableTime: { type: Date, default: Date.now },
    city: { type: String, default: '' },
    area: { type: String, default: '' },
    address: { type: String, default: '' },
    location: { lat: Number, lng: Number },
    quantityValue: { type: Number, min: 0 },
    quantityUnit: String,
    completedAt: { type: Date, default: null },
    isDemo: { type: Boolean, default: false },
    activePickup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pickup',
      default: null
    },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String
      }
    ],
    specialInstructions: { type: String, default: '' },
    processingOutcome: {
      type: String,
      enum: ['recycled', 'composted', 'disposed'],
      default: null
    },
    processingNotes: { type: String, default: '' },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    wasteCategory: {
      type: String,
      enum: ['plastic', 'glass', 'paper', 'metal', 'organic', 'non_recyclable'],
      required: true
    },
    quantity: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    pickupDeadline: {
      type: Date,
      required: true
    },
    photo: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: [
        'posted',
        'matched',
        'pickup_scheduled',
        'picked_up',
        'delivered',
        'recycled',
        'composted',
        'disposed',
        'completed',
        'cancelled',
        'expired'
      ],
      default: 'posted'
    },
    matchedCollector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('WasteRequest', wasteRequestSchema);
