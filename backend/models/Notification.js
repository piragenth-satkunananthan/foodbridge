const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedType: {
      type: String,
      enum: ['donation', 'wasteRequest', 'pickup', 'organization', 'system'],
      default: 'system'
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    readStatus: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
