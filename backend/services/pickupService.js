const Pickup = require('../models/Pickup');
const Organization = require('../models/Organization');
const User = require('../models/User');
const transaction = require('../utils/transaction');
const { fail, sameId, coordinates, text } = require('../utils/domain');
const { modelFor, releaseCapacity } = require('./allocationService');
const { queueNotifications } = require('../utils/notificationService');
async function load(id, session) {
  const pickup = await Pickup.findById(id).session(session);
  if (!pickup) fail(404, 'Pickup not found');
  const kind = pickup.donation ? 'donation' : 'wasteRequest';
  const source = await modelFor(kind).findById(pickup[kind]).session(session);
  if (!source) fail(409, 'Pickup source is unavailable');
  return { pickup, source, kind };
}
async function notify(result, session) {
  const org = await Organization.findById(
    result.pickup.receivingOrganization
  ).session(session);
  await queueNotifications(
    [result.source.donor, result.pickup.volunteer, org?.linkedUser].filter(
      Boolean
    ),
    `Pickup status: ${result.pickup.statusPipeline}.`,
    'pickup',
    result.pickup._id,
    session
  );
}
function assigned(pickup, user) {
  if (user.role !== 'admin' && !sameId(pickup.volunteer, user._id))
    fail(403, 'Only the assigned volunteer may change this pickup');
}
function active(pickup) {
  if (!pickup.active) fail(409, 'Pickup is closed');
}
async function receivingOrganization(pickup, session) {
  const org = await Organization.findById(pickup.receivingOrganization).session(
    session
  );
  const owner = org
    ? await User.findById(org.linkedUser).session(session)
    : null;
  if (
    !org ||
    org.verificationStatus !== 'verified' ||
    !owner ||
    owner.status !== 'active'
  )
    fail(409, 'Receiving organization is unavailable');
  return org;
}
function history(result, status, user, note) {
  result.pickup.statusPipeline = status;
  result.pickup.statusHistory.push({
    status,
    timestamp: new Date(),
    note: note || `Recorded by ${user.name}`
  });
  result.source.statusHistory.push({
    status: result.source.status,
    timestamp: new Date(),
    actor: user._id,
    note
  });
}
async function accept(id, user) {
  const result = await transaction(async (session) => {
    const result = await load(id, session);
    const { pickup, source } = result;
    active(pickup);
    if (
      pickup.statusPipeline !== 'matched' ||
      pickup.volunteer ||
      source.status !== 'matched'
    )
      fail(409, 'Pickup has already been assigned or closed');
    if (source.pickupDeadline <= new Date())
      fail(409, 'Pickup deadline has passed');
    await receivingOrganization(pickup, session);
    const donor = await User.findById(source.donor).session(session);
    if (!donor || donor.status !== 'active') fail(409, 'Donor is unavailable');
    pickup.volunteer = user._id;
    source.status = 'pickup_scheduled';
    history(result, 'pickup_scheduled', user);
    await pickup.save({ session });
    await source.save({ session });
    await notify(result, session);
    return result;
  });
  return result;
}
async function advance(id, user, body) {
  const result = await transaction(async (session) => {
    const result = await load(id, session);
    const { pickup, source } = result;
    assigned(pickup, user);
    active(pickup);
    const expected = {
      picked_up: 'pickup_scheduled',
      delivered_or_recycled: 'picked_up'
    };
    if (
      !expected[body.status] ||
      pickup.statusPipeline !== expected[body.status]
    )
      fail(
        409,
        'Record collection, then arrival; the receiving organization confirms completion'
      );
    if (body.status === 'picked_up') {
      if (
        source.pickupDeadline <= new Date() ||
        source.availableTime > new Date()
      )
        fail(409, 'Collection is outside the availability window');
      await receivingOrganization(pickup, session);
      const donor = await User.findById(source.donor).session(session);
      if (!donor || donor.status !== 'active') fail(409, 'Donor is unavailable');
    }
    pickup.proofNotes = body.proofNotes
      ? text(body.proofNotes, 'Proof notes')
      : pickup.proofNotes;
    if (body.lat !== undefined || body.lng !== undefined) {
      pickup.routeLocation = coordinates({ lat: body.lat, lng: body.lng });
      pickup.locationUpdatedAt = new Date();
    }
    source.status = body.status === 'picked_up' ? 'picked_up' : 'delivered';
    history(
      result,
      body.status,
      user,
      body.note ? text(body.note, 'Note') : undefined
    );
    await pickup.save({ session });
    await source.save({ session });
    await notify(result, session);
    return result;
  });
  return result;
}
async function confirmReceipt(id, user, body = {}) {
  const result = await transaction(async (session) => {
    const result = await load(id, session);
    const { pickup, source, kind } = result;
    active(pickup);
    const org = await Organization.findById(
      pickup.receivingOrganization
    ).session(session);
    if (user.role !== 'admin' && (!org || !sameId(org.linkedUser, user._id)))
      fail(403, 'Only the receiving organization may confirm receipt');
    if (user.role === 'admin' && !body.note)
      fail(400, 'Administrative confirmation requires an audit note');
    if (user.role !== 'admin') await receivingOrganization(pickup, session);
    if (
      pickup.statusPipeline !== 'delivered_or_recycled' ||
      source.status !== 'delivered'
    )
      fail(
        409,
        'Arrival must be recorded before receipt or processing confirmation'
      );
    const accepted = body.accepted === undefined ? true : body.accepted;
    if (typeof accepted !== 'boolean') fail(400, 'accepted must be boolean');
    if (!accepted && !body.note) fail(400, 'Rejection requires a reason');
    if (accepted && kind === 'wasteRequest') {
      const outcome =
        source.wasteCategory === 'organic'
          ? 'composted'
          : source.wasteCategory === 'non_recyclable'
            ? 'disposed'
            : 'recycled';
      if (body.processingOutcome !== outcome)
        fail(
          400,
          `Confirm processingOutcome '${outcome}' after processing is complete`
        );
      pickup.processingOutcome = outcome;
      source.processingOutcome = outcome;
      source.processingNotes = text(
        body.processingNotes || body.note,
        'Processing notes'
      );
    }
    const now = new Date();
    pickup.active = false;
    pickup.receivedBy = user._id;
    pickup.deliveryNotes = body.note ? text(body.note, 'Receipt note') : '';
    pickup.completionConfirmedAt = accepted ? now : null;
    source.completedAt = accepted ? now : null;
    source.activePickup = null;
    source.status = accepted ? 'completed' : 'cancelled';
    history(
      result,
      accepted ? 'completed' : 'rejected',
      user,
      pickup.deliveryNotes
    );
    await pickup.save({ session });
    await source.save({ session });
    await releaseCapacity(pickup, session);
    await notify(result, session);
    return result;
  });
  return result;
}
async function cancelAssignment(id, user, body = {}) {
  const result = await transaction(async (session) => {
    const result = await load(id, session);
    const { pickup, source } = result;
    assigned(pickup, user);
    active(pickup);
    if (pickup.statusPipeline !== 'pickup_scheduled')
      fail(409, 'Only scheduled assignments may be released');
    if (source.pickupDeadline <= new Date())
      fail(409, 'Pickup is overdue and must expire');
    pickup.active = false;
    source.status = 'matched';
    history(
      result,
      'cancelled',
      user,
      body.reason
        ? text(body.reason, 'Reason')
        : 'Volunteer released assignment'
    );
    await pickup.save({ session });
    const replacement = new Pickup({
      donation: pickup.donation,
      wasteRequest: pickup.wasteRequest,
      receivingOrganization: pickup.receivingOrganization,
      reservedKg: pickup.reservedKg,
      isDemo: pickup.isDemo,
      statusPipeline: 'matched',
      statusHistory: [{ status: 'matched', note: 'Awaiting a replacement volunteer' }]
    });
    await replacement.save({ session });
    source.activePickup = replacement._id;
    await source.save({ session });
    await notify(result, session);
    return result;
  });
  return result;
}
async function updateLocation(id, user, body) {
  const location = coordinates(body);
  return transaction(async (session) => {
    const { pickup } = await load(id, session);
    assigned(pickup, user);
    active(pickup);
    if (
      !['pickup_scheduled', 'picked_up', 'delivered_or_recycled'].includes(
        pickup.statusPipeline
      )
    )
      fail(409, 'Pickup has no active assignment');
    pickup.routeLocation = location;
    pickup.locationUpdatedAt = new Date();
    await pickup.save({ session });
    return pickup;
  });
}
async function expireOverdue() {
  for (const kind of ['donation', 'wasteRequest']) {
    const model = modelFor(kind);
    const sources = await model
      .find({
        status: { $in: ['posted', 'matched', 'pickup_scheduled'] },
        pickupDeadline: { $lte: new Date() }
      })
      .select('_id');
    for (const sourceId of sources) {
      const result = await transaction(async (session) => {
        const source = await model.findById(sourceId._id).session(session);
        if (
          !source ||
          !['posted', 'matched', 'pickup_scheduled'].includes(source.status) ||
          source.pickupDeadline > new Date()
        )
          return null;
        const pickup = await Pickup.findOne({
          [kind]: source._id,
          active: true
        }).session(session);
        if (pickup) {
          if (!['matched', 'pickup_scheduled'].includes(pickup.statusPipeline))
            return null;
          pickup.active = false;
          pickup.statusPipeline = 'expired';
          pickup.statusHistory.push({
            status: 'expired',
            timestamp: new Date(),
            note: 'Collection deadline passed'
          });
          await pickup.save({ session });
          await releaseCapacity(pickup, session);
        }
        source.status = 'expired';
        source.activePickup = null;
        source.statusHistory.push({ status: 'expired', timestamp: new Date() });
        await source.save({ session });
        if (pickup) await notify({ pickup, source }, session);
        return pickup ? { pickup, source } : null;
      });
    }
  }
}
module.exports = {
  accept,
  advance,
  confirmReceipt,
  cancelAssignment,
  updateLocation,
  expireOverdue
};
