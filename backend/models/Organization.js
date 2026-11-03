const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    capacityKg: { type: Number, min: 0, default: null },
    reservedKg: { type: Number, min: 0, default: 0 },
    accepting: { type: Boolean, default: true },
    serviceDistricts: { type: [String], default: [] },
    foodTypes: { type: [String], default: [] },
    storageConditions: {
      type: [String],
      enum: ['refrigerated', 'room_temperature', 'frozen'],
      default: []
    },
    city: { type: String, default: '' },
    area: { type: String, default: '' },
    address: { type: String, default: '' },
    location: { lat: Number, lng: Number },
    isDemo: { type: Boolean, default: false },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'ngo',
        'charity',
        'shelter',
        'recycler',
        'composting_facility',
        'waste_management'
      ],
      required: true
    },
    registrationInfo: {
      type: String, // license/registration number
      required: true
    },
    district: {
      type: String,
      required: true
    },
    // Which waste categories this org can handle (only relevant if type is recycler/composting)
    materialTypesHandled: {
      type: [String],
      enum: ['plastic', 'glass', 'paper', 'metal', 'organic', 'non_recyclable'],
      default: []
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationRemarks: {
      type: String,
      default: ''
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

organizationSchema.index({ linkedUser: 1 }, { unique: true });

module.exports = mongoose.model('Organization', organizationSchema);
