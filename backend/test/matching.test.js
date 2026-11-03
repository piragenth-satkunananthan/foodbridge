const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  setup,
  user,
  foodBody,
  Donation,
  Pickup,
  Organization
} = require('./helpers');
const api = setup();
test('simultaneous claims allocate once and cancellation retains history and releases capacity', async () => {
  const donor = await user('donor'),
    a = await user('recipient', 'ngo'),
    b = await user('recipient', 'ngo'),
    outsider = await user('recipient');
  const post = await api('POST', '/donations', donor, foodBody());
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      api('POST', `/match/${post.body._id}/claim`, i % 2 ? a : b, {})
    )
  );
  assert.equal(
    results.filter((r) => r.status === 200).length,
    1,
    JSON.stringify(results)
  );
  assert.equal(
    await Pickup.countDocuments({ donation: post.body._id, active: true }),
    1
  );
  const matched = await Donation.findById(post.body._id);
  const winner =
    String(matched.matchedRecipient) === String(a.organization) ? a : b;
  assert.equal(
    (await api('PUT', `/match/${post.body._id}/cancel-claim`, outsider, {}))
      .status,
    403
  );
  assert.equal(
    (await api('PUT', `/match/${post.body._id}/cancel-claim`, winner, {}))
      .status,
    200
  );
  assert.equal(
    (await Organization.findById(winner.organization)).reservedKg,
    0
  );
  assert.equal(
    await Pickup.countDocuments({
      donation: post.body._id,
      statusPipeline: 'cancelled',
      active: false
    }),
    1
  );
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, winner, {})).status,
    200
  );
  assert.equal(await Pickup.countDocuments({ donation: post.body._id }), 2);
});
test('claim transaction rolls back source and pickup when the final reservation write fails', async (t) => {
  const donor = await user('donor'),
    recipient = await user('recipient', 'ngo');
  const post = await api('POST', '/donations', donor, foodBody());
  const mock = t.mock.method(
    Organization.prototype,
    'save',
    async function (options) {
      throw new Error('Injected failure after source and pickup writes');
    }
  );
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, recipient, {})).status,
    500
  );
  mock.mock.restore();
  assert.equal((await Donation.findById(post.body._id)).status, 'posted');
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    0
  );
  assert.equal(await Pickup.countDocuments({ donation: post.body._id }), 0);
});
test('capacity, storage, availability/deadline and verification determine eligibility', async () => {
  const donor = await user('donor'),
    recipient = await user('recipient', 'ngo'),
    admin = await user('admin');
  const post = await api('POST', '/donations', donor, foodBody());
  await Organization.findByIdAndUpdate(recipient.organization, {
    capacityKg: 5
  });
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, recipient, {})).status,
    409
  );
  await Organization.findByIdAndUpdate(recipient.organization, {
    capacityKg: 100,
    storageConditions: ['frozen']
  });
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, recipient, {})).status,
    409
  );
  await Organization.findByIdAndUpdate(recipient.organization, {
    storageConditions: ['refrigerated'],
    verificationStatus: 'rejected'
  });
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, recipient, {})).status,
    403
  );
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, admin, {})).status,
    403
  );
  assert.equal((await Donation.findById(post.body._id)).status, 'posted');
});
test('concurrent claims on different posts cannot overbook one organization', async () => {
  const donor = await user('donor'),
    recipient = await user('recipient', 'ngo');
  await Organization.findByIdAndUpdate(recipient.organization, {
    capacityKg: 25
  });
  const posts = await Promise.all([
    api('POST', '/donations', donor, foodBody()),
    api('POST', '/donations', donor, foodBody())
  ]);
  const claims = await Promise.all(
    posts.map((post) =>
      api('POST', `/match/${post.body._id}/claim`, recipient, {})
    )
  );
  assert.equal(claims.filter((r) => r.status === 200).length, 1);
  assert.equal(claims.filter((r) => r.status === 409).length, 1);
  assert.equal(
    (await Organization.findById(recipient.organization)).reservedKg,
    20
  );
});
test('city filters and coordinate distances influence ranked matching', async () => {
  const donor = await user('donor'),
    recipient = await user('recipient', 'ngo');
  await Organization.findByIdAndUpdate(recipient.organization, {
    location: { lat: 6.9271, lng: 79.8612 }
  });
  const near = await api(
    'POST',
    '/donations',
    donor,
    foodBody({
      foodType: 'Nearby rice',
      city: 'Review City',
      area: 'Central',
      location: { lat: 6.928, lng: 79.862 }
    })
  );
  const far = await api(
    'POST',
    '/donations',
    donor,
    foodBody({
      foodType: 'Distant rice',
      city: 'Review City',
      area: 'Outer',
      location: { lat: 7.1, lng: 80.1 }
    })
  );
  assert.equal(near.status, 201);
  assert.equal(far.status, 201);
  const feed = await api(
    'GET',
    '/match/nearby-donations?city=Review%20City',
    recipient
  );
  assert.equal(feed.status, 200, JSON.stringify(feed.body));
  assert.equal(feed.body.donations.length, 2);
  assert.equal(feed.body.donations[0]._id, near.body._id);
  assert.ok(
    feed.body.donations[0].matchScore > feed.body.donations[1].matchScore
  );
  assert.equal(
    feed.body.donations[0].distanceBasis,
    'straight-line coordinates estimate'
  );
  const local = await api(
    'GET',
    '/match/nearby-donations?city=Review%20City&area=Central',
    recipient
  );
  assert.equal(local.body.donations.length, 1);
});
