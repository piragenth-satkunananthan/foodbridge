const mongoose = require('mongoose');

const pickupSchema = new mongoose.Schema(
  {
    active: { type: Boolean, default: true },
    reservedKg: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processingOutcome: { type: String, enum: ['recycled', 'composted', 'disposed'], default: null },
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
      enum: ['posted', 'matched', 'pickup_scheduled', 'picked_up', 'delivered_or_recycled', 'completed', 'cancelled', 'expired', 'rejected'],
      default: 'posted'
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' }
      }
    ],
    locationUpdatedAt: { type: Date, default: null },
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

pickupSchema.pre('validate', function () {
  if (Boolean(this.donation) === Boolean(this.wasteRequest)) this.invalidate('donation', 'Exactly one source is required');
});
pickupSchema.index({ donation: 1 }, { unique: true, partialFilterExpression: { active: true, donation: { $type: 'objectId' } } });
pickupSchema.index({ wasteRequest: 1 }, { unique: true, partialFilterExpression: { active: true, wasteRequest: { $type: 'objectId' } } });

module.exports = mongoose.model('Pickup', pickupSchema);
