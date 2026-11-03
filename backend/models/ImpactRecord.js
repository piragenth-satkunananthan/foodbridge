const mongoose = require('mongoose');

const impactRecordSchema = new mongoose.Schema(
  {
    isDemo: { type: Boolean, default: false },
    mealsRescued: {
      type: Number,
      default: 0
    },
    kgRecycled: {
      plastic: { type: Number, default: 0 },
      glass: { type: Number, default: 0 },
      paper: { type: Number, default: 0 },
      metal: { type: Number, default: 0 }
    },
    kgOrganicDiverted: {
      type: Number,
      default: 0
    },
    districtsCovered: {
      type: [String],
      default: []
    },
    period: {
      type: String, // e.g. "2026-09" for monthly aggregation
      required: true
    }
  },
  { timestamps: true }
);

impactRecordSchema.index({ period: 1, isDemo: 1 }, { unique: true });

module.exports = mongoose.model('ImpactRecord', impactRecordSchema);
