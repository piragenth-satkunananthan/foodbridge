const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  setup,
  user,
  foodBody,
  Pickup,
  WasteRequest,
  Organization
} = require('./helpers');
const api = setup();
const wasteBody = (overrides = {}) => ({
  wasteCategory: 'plastic',
  quantity: '20 kg',
  district: 'Colombo',
  pickupDeadline: new Date(Date.now() + 86400000).toISOString(),
  ...overrides
});
test('surplus posting branches from explicit declarations and refuses ambiguous material', async () => {
  const donor = await user('donor');
  const food = await api('POST', '/surplus', donor, {
    itemType: 'food',
    condition: 'edible',
    ...foodBody()
  });
  assert.equal(food.status, 201, JSON.stringify(food.body));
  assert.equal(food.body.kind, 'donation');
  const organic = await api('POST', '/surplus', donor, {
    itemType: 'food',
    condition: 'inedible',
    ...foodBody()
  });
  assert.equal(organic.status, 201);
  assert.equal(organic.body.post.wasteCategory, 'organic');
  const { wasteCategory, ...base } = wasteBody();
  const material = await api('POST', '/surplus', donor, {
    itemType: 'material',
    description: 'glass jars',
    ...base
  });
  assert.equal(material.status, 201);
  assert.equal(material.body.post.wasteCategory, 'glass');
  assert.equal(
    (
      await api('POST', '/surplus', donor, {
        itemType: 'material',
        description: 'plastic and glass',
        ...base
      })
    ).status,
    422
  );
  assert.equal(
    (
      await api('POST', '/surplus', donor, {
        itemType: 'food',
        condition: 'unknown',
        ...foodBody()
      })
    ).status,
    400
  );
});
test('waste claims are atomic, compatible, and processing requires recorded delivery', async () => {
  const donor = await user('donor'),
    recycler = await user('recycler', 'recycler'),
    composter = await user('recycler', 'composting_facility'),
    courier = await user('volunteer');
  const post = await api('POST', '/waste', donor, wasteBody());
  assert.equal(
    (await api('POST', `/waste/${post.body._id}/claim`, composter, {})).status,
    409
  );
  const results = await Promise.all(
    Array.from({ length: 6 }, () =>
      api('POST', `/waste/${post.body._id}/claim`, recycler, {})
    )
  );
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  const pickup = results.find((r) => r.status === 200).body.pickup;
  assert.equal(
    (
      await api('PUT', `/waste/${post.body._id}/confirm-recycled`, recycler, {
        processingOutcome: 'recycled',
        processingNotes: 'Processed'
      })
    ).status,
    409
  );
  await api('POST', `/pickups/${pickup._id}/accept`, courier, {});
  await api('PUT', `/pickups/${pickup._id}/status`, courier, {
    status: 'picked_up'
  });
  await api('PUT', `/pickups/${pickup._id}/status`, courier, {
    status: 'delivered_or_recycled'
  });
  const done = await api(
    'PUT',
    `/waste/${post.body._id}/confirm-recycled`,
    recycler,
    { processingOutcome: 'recycled', processingNotes: '20 kg processed' }
  );
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(done.body.processingRecord.outcome, 'recycled');
  assert.equal(
    (await api('GET', '/pickups/stats', courier)).body.stats
      .totalMealsTransported,
    0
  );
  assert.equal(
    (await Organization.findById(recycler.organization)).reservedKg,
    0
  );
  const second = await api('POST', '/waste', donor, wasteBody());
  await api('POST', `/waste/${second.body._id}/claim`, recycler, {});
  assert.equal(
    (await api('PUT', `/waste/${second.body._id}/cancel-claim`, recycler, {}))
      .status,
    200
  );
  assert.equal(
    await Pickup.countDocuments({
      wasteRequest: second.body._id,
      statusPipeline: 'cancelled'
    }),
    1
  );
  assert.equal(
    (await api('GET', '/waste/recycler/claims', recycler)).body.claims.length,
    2
  );
});
test('non-recyclable waste uses disposal rather than recycling and overdue claims fail', async () => {
  const donor = await user('donor'),
    collector = await user('recycler', 'waste_management'),
    recycler = await user('recycler', 'recycler');
  const post = await api(
    'POST',
    '/waste',
    donor,
    wasteBody({ wasteCategory: 'non_recyclable' })
  );
  assert.equal(
    (await api('POST', `/waste/${post.body._id}/claim`, recycler, {})).status,
    409
  );
  await WasteRequest.findByIdAndUpdate(post.body._id, {
    pickupDeadline: new Date(Date.now() - 1000)
  });
  assert.equal(
    (await api('POST', `/waste/${post.body._id}/claim`, collector, {})).status,
    409
  );
});
test('completed composting and disposal are recorded as distinct outcomes', async () => {
  for (const [category, type, outcome] of [
    ['organic', 'composting_facility', 'composted'],
    ['non_recyclable', 'waste_management', 'disposed']
  ]) {
    const donor = await user('donor'),
      collector = await user('recycler', type),
      courier = await user('volunteer');
    const post = await api(
      'POST',
      '/waste',
      donor,
      wasteBody({ wasteCategory: category })
    );
    const claim = await api(
      'POST',
      `/waste/${post.body._id}/claim`,
      collector,
      {}
    );
    assert.equal(claim.status, 200, JSON.stringify(claim.body));
    const id = claim.body.pickup._id;
    assert.equal(
      (await api('POST', `/pickups/${id}/accept`, courier, {})).status,
      200
    );
    assert.equal(
      (
        await api('PUT', `/pickups/${id}/status`, courier, {
          status: 'picked_up'
        })
      ).status,
      200
    );
    assert.equal(
      (
        await api('PUT', `/pickups/${id}/status`, courier, {
          status: 'delivered_or_recycled'
        })
      ).status,
      200
    );
    assert.equal(
      (
        await api('PUT', `/pickups/${id}/confirm-receipt`, collector, {
          processingOutcome: 'recycled',
          processingNotes: 'Wrong outcome'
        })
      ).status,
      400
    );
    assert.equal(
      (
        await api('PUT', `/pickups/${id}/confirm-receipt`, collector, {
          processingOutcome: outcome,
          processingNotes: 'Processing completed'
        })
      ).status,
      200
    );
    const stats = await api('GET', '/waste/recycler/stats', collector);
    assert.equal(stats.body.totalDivertedKg, outcome === 'disposed' ? 0 : 20);
    assert.equal(
      (await WasteRequest.findById(post.body._id)).processingOutcome,
      outcome
    );
  }
});
test('recycler discovery filters service compatibility and city without exposing contacts', async () => {
  const donor = await user('donor'),
    recycler = await user('recycler', 'recycler');
  const post = await api(
    'POST',
    '/waste',
    donor,
    wasteBody({ city: 'Review City', area: 'Central' })
  );
  assert.equal(post.status, 201);
  const feed = await api(
    'GET',
    '/waste/recycler/feed?city=Review%20City&area=Central',
    recycler
  );
  assert.equal(feed.status, 200, JSON.stringify(feed.body));
  assert.equal(feed.body.feed.length, 1);
  assert.equal(feed.body.feed[0].donor.contactNumber, undefined);
  assert.equal(
    (await api('GET', '/waste?city=Review%20City', donor)).status,
    200
  );
});
