const mongoose = require('mongoose');

const wasteRequestSchema = new mongoose.Schema(
  {
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
      enum: ['posted', 'matched', 'pickup_scheduled', 'picked_up', 'recycled', 'completed', 'cancelled', 'expired'],
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
