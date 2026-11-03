const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  setup,
  user,
  foodBody,
  Donation,
  Pickup,
  Organization,
  WasteRequest
} = require('./helpers');
const { expireOverdue } = require('../services/pickupService');
const api = setup();
async function claimed() {
  const donor = await user('donor'),
    recipient = await user('recipient', 'ngo'),
    courier = await user('volunteer');
  const post = await api('POST', '/donations', donor, foodBody());
  const claim = await api(
    'POST',
    `/match/${post.body._id}/claim`,
    recipient,
    {}
  );
  assert.equal(claim.status, 200);
  return {
    donor,
    recipient,
    courier,
    post: post.body,
    pickup: claim.body.pickup
  };
}
test('food delivery requires authorized sequential milestones and recipient acknowledgement', async () => {
  const { donor, recipient, courier, post, pickup } = await claimed();
  const stranger = await user('volunteer');
  const accepts = await Promise.all([
    api('POST', `/pickups/${pickup._id}/accept`, courier, {}),
    api('POST', `/pickups/${pickup._id}/accept`, stranger, {})
  ]);
  assert.equal(accepts.filter((r) => r.status === 200).length, 1);
  const assigned = accepts[0].status === 200 ? courier : stranger,
    other = accepts[0].status === 200 ? stranger : courier;
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/location`, other, {
        lat: 8,
        lng: 80
      })
    ).status,
    403
  );
  assert.equal((await api('GET', `/pickups/${pickup._id}`, other)).status, 403);
  assert.equal((await api('GET', `/pickups/${pickup._id}`, donor)).status, 200);
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/location`, assigned, {
        lat: 0,
        lng: 0
      })
    ).status,
    200
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/location`, assigned, {
        lat: 91,
        lng: 0
      })
    ).status,
    400
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/status`, assigned, {
        status: 'completed'
      })
    ).status,
    409
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/status`, assigned, {
        status: 'picked_up'
      })
    ).status,
    200
  );
  assert.equal(
    (await api('PUT', `/pickups/${pickup._id}/confirm-receipt`, recipient, {}))
      .status,
    409
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/status`, assigned, {
        status: 'delivered_or_recycled'
      })
    ).status,
    200
  );
  assert.equal((await Donation.findById(post._id)).status, 'delivered');
  assert.equal(
    (await api('PUT', `/pickups/${pickup._id}/confirm-receipt`, assigned, {}))
      .status,
    403
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/confirm-receipt`, recipient, {
        accepted: true
      })
    ).status,
    200
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/confirm-receipt`, recipient, {
        accepted: true
      })
    ).status,
    409
  );
  assert.equal((await Donation.findById(post._id)).status, 'completed');
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    0
  );
  assert.equal((await Pickup.findById(pickup._id)).statusHistory.length, 6);
});
test('overdue food and waste expire atomically; future availability blocks collection', async () => {
  const { donor, recipient, courier, post, pickup } = await claimed();
  await Donation.findByIdAndUpdate(post._id, {
    pickupDeadline: new Date(Date.now() - 1000)
  });
  assert.equal(
    (await api('POST', `/pickups/${pickup._id}/accept`, courier, {})).status,
    409
  );
  const waste = await WasteRequest.create({
    donor: donor._id,
    wasteCategory: 'plastic',
    quantity: '5 kg',
    district: 'Colombo',
    pickupDeadline: new Date(Date.now() - 1000)
  });
  await expireOverdue();
  assert.equal((await Donation.findById(post._id)).status, 'expired');
  assert.equal((await Pickup.findById(pickup._id)).active, false);
  assert.equal((await WasteRequest.findById(waste._id)).status, 'expired');
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    0
  );
  const next = await claimed();
  await Donation.findByIdAndUpdate(next.post._id, {
    availableTime: new Date(Date.now() + 3600000)
  });
  assert.equal(
    (await api('POST', `/pickups/${next.pickup._id}/accept`, next.courier, {}))
      .status,
    200
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${next.pickup._id}/status`, next.courier, {
        status: 'picked_up'
      })
    ).status,
    409
  );
});
test('arrival write failure rolls back pickup milestone as well as source state', async (t) => {
  const { courier, post, pickup } = await claimed();
  await api('POST', `/pickups/${pickup._id}/accept`, courier, {});
  const mock = t.mock.method(Donation.prototype, 'save', async () => {
    throw new Error('Injected source-write failure');
  });
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/status`, courier, {
        status: 'picked_up'
      })
    ).status,
    500
  );
  mock.mock.restore();
  assert.equal(
    (await Pickup.findById(pickup._id)).statusPipeline,
    'pickup_scheduled'
  );
  assert.equal((await Donation.findById(post._id)).status, 'pickup_scheduled');
});
test('recipient rejection closes the delivery without recording rescued meals', async () => {
  const { recipient, courier, post, pickup } = await claimed();
  await api('POST', `/pickups/${pickup._id}/accept`, courier, {});
  await api('PUT', `/pickups/${pickup._id}/status`, courier, {
    status: 'picked_up'
  });
  await api('PUT', `/pickups/${pickup._id}/status`, courier, {
    status: 'delivered_or_recycled'
  });
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/confirm-receipt`, recipient, {
        accepted: false,
        note: 'Recipient declined this batch'
      })
    ).status,
    200
  );
  const source = await Donation.findById(post._id);
  assert.equal(source.status, 'cancelled');
  assert.equal(source.completedAt, null);
  assert.equal((await Pickup.findById(pickup._id)).statusPipeline, 'rejected');
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    0
  );
});

test('donor suspension after assignment blocks collection without changing the job', async () => {
  const { donor, courier, post, pickup } = await claimed();
  await api('POST', `/pickups/${pickup._id}/accept`, courier, {});
  donor.status = 'suspended';
  await donor.save();
  const result = await api('PUT', `/pickups/${pickup._id}/status`, courier, {
    status: 'picked_up'
  });
  assert.equal(result.status, 409);
  assert.equal(
    (await Pickup.findById(pickup._id)).statusPipeline,
    'pickup_scheduled'
  );
  assert.equal((await Donation.findById(post._id)).status, 'pickup_scheduled');
});

test('released assignments remain in history and replacement jobs retain capacity once', async () => {
  const { recipient, courier, post, pickup } = await claimed();
  await api('POST', `/pickups/${pickup._id}/accept`, courier, {});
  const reserved = (await Organization.findById(recipient.organization))
    .reservedKg;
  assert.equal(
    (await api('PUT', `/pickups/${pickup._id}/cancel`, courier, {})).status,
    200
  );
  const closed = await Pickup.findById(pickup._id);
  assert.equal(closed.active, false);
  assert.equal(String(closed.volunteer), String(courier._id));
  const replacement = await Pickup.findOne({
    donation: post._id,
    active: true
  });
  assert.ok(replacement);
  assert.equal(replacement.volunteer, null);
  assert.equal(
    String((await Donation.findById(post._id)).activePickup),
    String(replacement._id)
  );
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    reserved
  );
  const history = await api('GET', '/pickups/history', courier);
  assert.ok(history.body.history.some((p) => p._id === pickup._id));
  const nextCourier = await user('volunteer');
  assert.equal(
    (await api('POST', `/pickups/${replacement._id}/accept`, nextCourier, {}))
      .status,
    200
  );
  assert.equal(
    (
      await api('PUT', `/pickups/${pickup._id}/status`, courier, {
        status: 'picked_up'
      })
    ).status,
    409
  );
  assert.equal(
    (await api('PUT', `/match/${post._id}/cancel-claim`, recipient, {})).status,
    200
  );
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    0
  );
});

test('replacement creation failure rolls back assignment release', async (t) => {
  const { courier, post, pickup } = await claimed();
  await api('POST', `/pickups/${pickup._id}/accept`, courier, {});
  const save = Pickup.prototype.save;
  t.mock.method(Pickup.prototype, 'save', function (...args) {
    if (this.isNew) throw new Error('Injected replacement failure');
    return save.apply(this, args);
  });
  assert.equal(
    (await api('PUT', `/pickups/${pickup._id}/cancel`, courier, {})).status,
    500
  );
  assert.equal((await Pickup.findById(pickup._id)).active, true);
  assert.equal(
    (await Pickup.findById(pickup._id)).statusPipeline,
    'pickup_scheduled'
  );
  assert.equal((await Donation.findById(post._id)).status, 'pickup_scheduled');
  assert.equal(await Pickup.countDocuments({ donation: post._id }), 1);
});
