const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup, user } = require('./helpers');
const Notification = require('../models/Notification');
const api = setup();
const wasteBody = () => ({
  wasteCategory: 'plastic',
  quantity: '20 kg',
  district: 'Colombo',
  pickupDeadline: new Date(Date.now() + 86400000).toISOString()
});

test('processing record requires participation and a confirmed outcome', async () => {
  const donor = await user('donor'),
    recycler = await user('recycler', 'recycler'),
    courier = await user('volunteer'),
    stranger = await user('donor'),
    admin = await user('admin');
  const post = await api('POST', '/waste', donor, wasteBody());
  const id = post.body._id;
  assert.equal((await api('GET', `/waste/${id}/certificate`, stranger)).status, 403);
  assert.equal((await api('GET', `/waste/${id}/certificate`, donor)).status, 409);
  const claim = await api('POST', `/waste/${id}/claim`, recycler, {});
  const pickupId = claim.body.pickup._id;
  assert.equal(
    (await api('POST', `/pickups/${pickupId}/accept`, admin, {})).status,
    403,
    'admins cannot become the courier of record'
  );
  assert.equal(
    (
      await api('PUT', `/admin/organizations/${recycler.organization}/verify`, admin, {
        verificationStatus: 'rejected'
      })
    ).status,
    409,
    'rejection is refused while the organization holds an active claim'
  );
  await api('POST', `/pickups/${pickupId}/accept`, courier, {});
  await api('PUT', `/pickups/${pickupId}/status`, courier, { status: 'picked_up' });
  await api('PUT', `/pickups/${pickupId}/status`, courier, {
    status: 'delivered_or_recycled'
  });
  await api('PUT', `/waste/${id}/confirm-recycled`, recycler, {
    processingOutcome: 'recycled',
    processingNotes: 'Baled'
  });
  const record = await api('GET', `/waste/${id}/certificate`, donor);
  assert.equal(record.status, 200, JSON.stringify(record.body));
  assert.equal(record.body.certificate.processingOutcome, 'recycled');
  assert.ok(record.body.certificate.issuedAt);
});

test('admin search treats input literally and the public feed hides donors', async () => {
  const admin = await user('admin'),
    donor = await user('donor');
  for (const route of ['users', 'organizations', 'donations', 'waste-requests'])
    assert.equal(
      (await api('GET', `/admin/${route}?search=${encodeURIComponent('(a+)+$[')}`, admin)).status,
      200,
      route
    );
  await api('POST', '/waste', donor, wasteBody());
  const feed = await api('GET', '/impact/live-feed');
  assert.equal(feed.status, 200);
  assert.ok(feed.body.items.length);
  for (const item of feed.body.items) assert.equal(item.origin, undefined);
  const own = await Notification.find({ recipientUser: donor._id });
  assert.ok(own.length);
  assert.ok(own.every((n) => !/available in your district/.test(n.message)));
});

test('demonstration and real activity stay separate in discovery and claims', async () => {
  const { foodBody, User, Organization } = require('./helpers');
  const demoDonor = await user('donor'),
    demoOrg = await user('recipient', 'ngo'),
    realOrg = await user('recipient', 'ngo');
  await User.updateMany({ _id: { $in: [demoDonor._id, demoOrg._id] } }, { isDemo: true });
  await Organization.updateOne({ linkedUser: demoOrg._id }, { isDemo: true });
  demoDonor.isDemo = true;
  const post = await api('POST', '/donations', demoDonor, foodBody());
  assert.equal(post.status, 201, JSON.stringify(post.body));
  const ids = async (who) =>
    (await api('GET', '/match/nearby-donations', who)).body.donations.map((d) => d._id);
  assert.ok((await ids(demoOrg)).includes(post.body._id), 'demo org sees demo post');
  assert.ok(!(await ids(realOrg)).includes(post.body._id), 'real org does not');
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, realOrg, {})).status,
    409
  );
  assert.equal(
    (await api('POST', `/match/${post.body._id}/claim`, demoOrg, {})).status,
    200
  );
});
