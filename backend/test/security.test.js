const { test } = require('node:test');
const assert = require('node:assert/strict');
const { setup, user, Donation, Pickup } = require('./helpers');
const api = setup();
test('recipient without an organization cannot cancel another claim', async () => {
  const donor = await user('donor'), recipient = await user('recipient','ngo'), outsider = await user('recipient');
  const donation = await Donation.create({ donor: donor._id, foodType:'Rice', quantity:'20 kg', preparedTime:new Date(), pickupDeadline:new Date(Date.now()+86400000), storageCondition:'refrigerated', district:'Colombo', status:'matched', matchedRecipient:recipient.organization });
  const pickup = await Pickup.create({ donation:donation._id, receivingOrganization:recipient.organization, statusPipeline:'matched' });
  const response = await api('PUT', `/match/${donation._id}/cancel-claim`, outsider, {});
  assert.equal(response.status,403);
  assert.equal((await Donation.findById(donation._id)).status,'matched');
  assert.ok(await Pickup.findById(pickup._id));
});
test('pickup GPS and private details reject unrelated users', async () => {
  const donor = await user('donor'), recipient = await user('recipient','ngo'), courier = await user('volunteer'), outsider = await user('volunteer');
  const donation = await Donation.create({ donor:donor._id, foodType:'Rice', quantity:'20 kg', preparedTime:new Date(), pickupDeadline:new Date(Date.now()+86400000), storageCondition:'refrigerated', district:'Colombo', status:'pickup_scheduled', matchedRecipient:recipient.organization });
  const pickup = await Pickup.create({ donation:donation._id, receivingOrganization:recipient.organization, volunteer:courier._id, statusPipeline:'pickup_scheduled' });
  assert.equal((await api('PUT',`/pickups/${pickup._id}/location`,outsider,{lat:8,lng:80})).status,403);
  assert.equal((await api('GET',`/pickups/${pickup._id}`,outsider)).status,403);
});
