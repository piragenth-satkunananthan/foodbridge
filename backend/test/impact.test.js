const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup, user, foodBody, Donation, WasteRequest } = require('./helpers');
const ImpactRecord = require('../models/ImpactRecord');
const api = setup();
test('public impact excludes demo, unconfirmed arrivals and disposal', async () => {
  const donor = await user('donor');
  const base = {
    ...foodBody(),
    donor: donor._id,
    status: 'completed',
    completedAt: new Date()
  };
  await Donation.create({ ...base, quantity: '500 g' });
  await Donation.create({ ...base, quantity: '1000 kg', isDemo: true });
  await Donation.create({
    ...base,
    quantity: '1000 kg',
    status: 'delivered',
    completedAt: null
  });
  const waste = {
    donor: donor._id,
    district: 'Colombo',
    quantity: '20 kg',
    pickupDeadline: new Date(),
    status: 'completed',
    completedAt: new Date()
  };
  await WasteRequest.create({
    ...waste,
    wasteCategory: 'plastic',
    processingOutcome: 'recycled'
  });
  await WasteRequest.create({
    ...waste,
    wasteCategory: 'organic',
    processingOutcome: 'composted'
  });
  await WasteRequest.create({
    ...waste,
    wasteCategory: 'non_recyclable',
    processingOutcome: 'disposed'
  });
  await WasteRequest.create({
    ...waste,
    wasteCategory: 'metal',
    processingOutcome: 'recycled',
    isDemo: true
  });
  await ImpactRecord.create({
    period: '2000-01',
    mealsRescued: 99999,
    isDemo: true
  });
  const response = await api('GET', '/impact');
  assert.equal(response.status, 200);
  assert.equal(response.body.summary.mealsRescued, 1);
  assert.equal(response.body.summary.totalKgRecycled, 20);
  assert.equal(response.body.summary.kgOrganicDiverted, 20);
  assert.equal(response.body.monthlyHistory.length, 0);
});
test('period outcomes use completion time, and cumulative snapshots cannot be backdated', async () => {
  const donor = await user('donor'),
    admin = await user('admin');
  const donation = await Donation.create({
    ...foodBody(),
    donor: donor._id,
    quantity: '20 kg',
    status: 'completed',
    completedAt: new Date('2025-07-15T12:00:00Z')
  });
  await Donation.updateOne(
    { _id: donation._id },
    { $set: { createdAt: new Date('2025-06-01') } },
    { timestamps: false }
  );
  const result = await api(
    'GET',
    '/admin/reports?fromDate=2025-07-15&toDate=2025-07-15',
    admin
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.summary.totalDonations, 0);
  assert.equal(result.body.summary.completedDonations, 1);
  assert.equal(result.body.impact.mealsRescued, 50);
  assert.equal(
    (await api('GET', '/admin/reports?fromDate=bad', admin)).status,
    400
  );
  assert.equal(
    (await api('POST', '/admin/impact/snapshot', admin, { period: '2000-01' }))
      .status,
    400
  );
  const snapshots = await Promise.all([
    api('POST', '/admin/impact/snapshot', admin, {}),
    api('POST', '/admin/impact/snapshot', admin, {})
  ]);
  assert.ok(snapshots.every((r) => [200, 409].includes(r.status)));
  assert.equal(
    await ImpactRecord.countDocuments({
      period: new Date().toISOString().slice(0, 7),
      isDemo: false
    }),
    1
  );
});
