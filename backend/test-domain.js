const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseQuantity,
  parseMealsCount,
  parseWeightKg
} = require('./utils/quantity');
const { coordinates, district, literalRegex } = require('./utils/domain');
const Pickup = require('./models/Pickup');
const mongoose = require('mongoose');
test('quantities preserve explicit units and do not invent container weights', () => {
  assert.equal(parseMealsCount('500 g'), 1);
  assert.equal(parseWeightKg('2 tonnes'), 2000);
  for (const value of ['unknown', '40 bags', '-5 kg', '1e3 kg', '20'])
    assert.equal(parseQuantity(value), null);
  assert.equal(parseQuantity('50 plates').estimatedWeight, true);
});
test('location and district validation accepts zero and rejects invalid coordinates', () => {
  assert.deepEqual(coordinates({ lat: 0, lng: 0 }), { lat: 0, lng: 0 });
  assert.throws(() => coordinates({ lat: 95, lng: 20 }));
  assert.equal(district(' colombo '), 'Colombo');
  assert.throws(() => district('imaginary'));
  assert.equal(literalRegex('a.*'), 'a\\.\\*');
});
test('pickup requires exactly one source', async () => {
  const id = new mongoose.Types.ObjectId();
  await assert.rejects(new Pickup({ receivingOrganization: id }).validate());
  await assert.rejects(
    new Pickup({
      receivingOrganization: id,
      donation: id,
      wasteRequest: id
    }).validate()
  );
  await new Pickup({ receivingOrganization: id, donation: id }).validate();
});
