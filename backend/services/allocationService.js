const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const Organization = require('../models/Organization');
const User = require('../models/User');
const transaction = require('../utils/transaction');
const { fail, sameId } = require('../utils/domain');
const { organizationFor, eligibility } = require('./eligibilityService');
const { queueNotifications } = require('../utils/notificationService');
const modelFor = (kind) => (kind === 'donation' ? Donation : WasteRequest);
const matchField = (kind) =>
  kind === 'donation' ? 'matchedRecipient' : 'matchedCollector';
async function claim(id, user, kind) {
  const result = await transaction(async (session) => {
    const org = await organizationFor(user, session);
    const post = await modelFor(kind).findById(id).session(session);
    if (!post) fail(404, 'Post not found');
    if (post.status !== 'posted')
      fail(409, 'This post has already been claimed or closed');
    const donor = await User.findById(post.donor).session(session);
    if (!donor || donor.status !== 'active') fail(409, 'Donor is not active');
    const check = eligibility(post, org, kind);
    if (!check.eligible) fail(409, check.reason);
    const pickup = new Pickup({
      [kind]: post._id,
      receivingOrganization: org._id,
      reservedKg: check.weightKg,
      isDemo: post.isDemo,
      statusPipeline: 'matched',
      statusHistory: [
        { status: 'posted', timestamp: post.createdAt },
        {
          status: 'matched',
          timestamp: new Date(),
          note: `Claimed by ${org.name}`
        }
      ]
    });
    await pickup.save({ session });
    post.status = 'matched';
    post[matchField(kind)] = org._id;
    post.activePickup = pickup._id;
    post.statusHistory.push({ status: 'matched', actor: user._id });
    await post.save({ session });
    org.reservedKg += check.weightKg;
    await org.save({ session });
    const volunteers = await User.find({
      role: 'volunteer',
      status: 'active',
      district: post.district
    })
      .select('_id')
      .session(session);
    await queueNotifications(
      [post.donor, user._id],
      'Surplus claimed; awaiting volunteer assignment.',
      kind,
      post._id,
      session
    );
    await queueNotifications(
      volunteers.map((u) => u._id),
      'A new pickup is available in your district.',
      'pickup',
      pickup._id,
      session
    );
    return { post, pickup, org };
  });
  return result;
}
async function releaseCapacity(pickup, session) {
  const org = await Organization.findById(pickup.receivingOrganization).session(
    session
  );
  if (org) {
    org.reservedKg = Math.max(
      0,
      (org.reservedKg || 0) - (pickup.reservedKg || 0)
    );
    await org.save({ session });
  }
}
async function cancelClaim(id, user, kind, reason = 'Claim released') {
  const result = await transaction(async (session) => {
    const post = await modelFor(kind).findById(id).session(session);
    if (!post) fail(404, 'Post not found');
    const org = await Organization.findOne({ linkedUser: user._id }).session(
      session
    );
    if (
      user.role !== 'admin' &&
      (!org || !sameId(post[matchField(kind)], org._id))
    )
      fail(403, 'Only the claiming organization may release this claim');
    if (!['matched', 'pickup_scheduled'].includes(post.status))
      fail(409, 'Claim cannot be released after collection or closure');
    const pickup = await Pickup.findOne({
      [kind]: post._id,
      active: true
    }).session(session);
    if (
      !pickup ||
      !['matched', 'pickup_scheduled'].includes(pickup.statusPipeline)
    )
      fail(409, 'Pickup is no longer cancellable');
    pickup.active = false;
    pickup.statusPipeline = 'cancelled';
    pickup.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: reason
    });
    await pickup.save({ session });
    await releaseCapacity(pickup, session);
    post.status = post.pickupDeadline <= new Date() ? 'expired' : 'posted';
    post[matchField(kind)] = null;
    post.activePickup = null;
    post.statusHistory.push({
      status: post.status,
      actor: user._id,
      note: reason
    });
    await post.save({ session });
    await queueNotifications(
      [post.donor, pickup.volunteer, user._id],
      'Claim released; the previous pickup is cancelled.',
      kind,
      post._id,
      session
    );
    return { post, pickup };
  });
  return result;
}
module.exports = { claim, cancelClaim, releaseCapacity, modelFor, matchField };
