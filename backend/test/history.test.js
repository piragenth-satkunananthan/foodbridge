const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup, user, foodBody, Pickup } = require('./helpers');
const api = setup();
for (const waste of [false, true]) {
  test(`${waste ? 'waste' : 'food'} history keeps original details after cancellation and reassignment`, async () => {
    const donor = await user('donor');
    const recipient = await user(
      waste ? 'recycler' : 'recipient',
      waste ? 'recycler' : 'ngo'
    );
    const nextRecipient = await user(
      waste ? 'recycler' : 'recipient',
      waste ? 'recycler' : 'ngo'
    );
    const courier = await user('volunteer');
    const base = waste ? '/waste' : '/donations';
    const body = waste
      ? {
          quantity: '20 kg',
          wasteCategory: 'plastic',
          district: 'Colombo',
          pickupDeadline: new Date(Date.now() + 86400000).toISOString()
        }
      : foodBody();
    const created = await api('POST', base, donor, body);
    assert.equal(created.status, 201);
    const post = created.body.wasteRequest || created.body;
    const claimPath = waste ? `/waste/${post._id}` : `/match/${post._id}`;
    const claimed = await api('POST', `${claimPath}/claim`, recipient, {});
    assert.equal(claimed.status, 200);
    const pickup = claimed.body.pickup;
    assert.equal(
      (await api('POST', `/pickups/${pickup._id}/accept`, courier, {})).status,
      200
    );
    assert.equal(
      (await api('PUT', `${claimPath}/cancel-claim`, recipient, {})).status,
      200
    );
    assert.equal(
      (
        await api('PUT', `${base}/${post._id}`, donor, {
          quantity: '30 kg',
          specialInstructions: 'NEW PRIVATE INSTRUCTIONS'
        })
      ).status,
      200
    );
    assert.equal(
      (await api('POST', `${claimPath}/claim`, nextRecipient, {})).status,
      200
    );
    const history = await api(
      'GET',
      waste ? '/waste/recycler/claims' : '/match/my-claims',
      recipient
    );
    assert.equal(history.status, 200);
    const historicalSource = waste
      ? history.body.claims[0]
      : history.body.claims[0].donation;
    assert.equal(historicalSource.quantity, '20 kg');
    assert.ok(
      !JSON.stringify(history.body).includes('NEW PRIVATE INSTRUCTIONS')
    );
    assert.ok(
      !JSON.stringify(history.body).includes(String(nextRecipient.organization))
    );
    const detail = await api('GET', `/pickups/${pickup._id}`, courier);
    assert.equal(detail.status, 200);
    assert.equal(
      detail.body.pickup[waste ? 'wasteRequest' : 'donation'].quantity,
      '20 kg'
    );
    assert.equal(
      (await api('GET', `${base}/${post._id}`, courier)).status,
      403
    );
    await Pickup.updateOne(
      { _id: pickup._id },
      { $unset: { sourceSnapshot: 1, active: 1 } }
    );
    const legacy = await api('GET', `/pickups/${pickup._id}`, courier);
    assert.deepEqual(
      Object.keys(legacy.body.pickup[waste ? 'wasteRequest' : 'donation']),
      ['_id']
    );
  });
}
