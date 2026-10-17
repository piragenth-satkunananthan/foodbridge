const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['donor', 'recipient', 'volunteer', 'recycler', 'admin'],
      required: true
    },
    district: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    // Only relevant for recipient / recycler roles — links to their Organization profile
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: function () {
        // Donors and volunteers don't need org verification; recipients/recyclers do
        return this.role === 'recipient' || this.role === 'recycler' ? 'pending' : 'verified';
      }
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
