const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    foodType: {
      type: String,
      required: true
    },
    quantity: {
      type: String, // e.g. "20 kg" or "50 plates" - kept flexible per proposal
      required: true
    },
    preparedTime: {
      type: Date,
      required: true
    },
    storageCondition: {
      type: String,
      enum: ['refrigerated', 'room_temperature', 'frozen'],
      required: true
    },
    pickupDeadline: {
      type: Date,
      required: true
    },
    photo: {
      type: String, // URL from cloud image storage
      default: null
    },
    district: {
      type: String,
      required: true
    },
    specialInstructions: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['posted', 'matched', 'pickup_scheduled', 'picked_up', 'delivered', 'completed', 'cancelled', 'expired'],
      default: 'posted'
    },
    matchedRecipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
