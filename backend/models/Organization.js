const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['ngo', 'charity', 'shelter', 'recycler', 'composting_facility'],
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

module.exports = mongoose.model('Organization', organizationSchema);
