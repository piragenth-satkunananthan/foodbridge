// Read-only rollout check. Never rewrites historical activity or guesses capacity.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const Organization = require('../models/Organization');
(async () => {
  try {
    await connectDB({ autoIndex: false, autoCreate: false });
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    const counts = {
      replicaSet: Boolean(hello.setName),
      organizationsMissingCapacity: await Organization.countDocuments({
        $or: [{ capacityKg: null }, { capacityKg: { $lte: 0 } }]
      }),
      pickupsMissingActiveFlag: await Pickup.countDocuments({
        active: { $exists: false }
      }),
      unconfirmedHistoricalFood: await Donation.countDocuments({
        status: { $in: ['delivered', 'completed'] },
        completedAt: null
      }),
      unconfirmedHistoricalWaste: await WasteRequest.countDocuments({
        status: { $in: ['recycled', 'completed'] },
        completedAt: null
      })
    };
    for (const field of ['donation', 'wasteRequest']) {
      const duplicates = await Pickup.aggregate([
        {
          $match: {
            statusPipeline: {
              $in: [
                'matched',
                'pickup_scheduled',
                'picked_up',
                'delivered_or_recycled'
              ]
            },
            [field]: { $type: 'objectId' }
          }
        },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'count' }
      ]);
      counts[`${field}DuplicateActiveSources`] = duplicates[0]?.count || 0;
    }
    console.log(JSON.stringify(counts, null, 2));
    if (
      !counts.replicaSet ||
      Object.entries(counts).some(
        ([key, value]) => key !== 'replicaSet' && value > 0
      )
    )
      process.exitCode = 1;
  } catch (error) {
    console.error('Data preflight failed:', error.name);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
