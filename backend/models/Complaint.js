const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    relatedType: {
      type: String,
      enum: ['donation', 'wasteRequest', 'pickup', 'user', 'system'],
      default: 'system'
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open'
    },
    history: [
      {
        status: String,
        note: String,
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);
module.exports = mongoose.model('Complaint', schema);
