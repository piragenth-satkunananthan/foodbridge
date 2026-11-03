const test = require('node:test');
const assert = require('node:assert/strict');
const { parseMealsCount, parseWeightKg } = require('./utils/impactMetrics');

test('weight conversions use explicit units, including grams and tonnes', () => {
  assert.equal(parseWeightKg('25 kg'), 25);
  assert.equal(parseWeightKg('500 g'), 0.5);
  assert.equal(parseWeightKg('2 tonnes'), 2000);
  assert.equal(parseWeightKg('0.5 kilograms of plastic'), 0.5);
});

test('unknown quantities never invent reported kilograms or meals', () => {
  for (const input of ['40 bags', '10 crates', 'unknown', '-5 kg', '0 kg', '2e309 kg', '40', '', null]) {
    assert.equal(parseWeightKg(input), 0, String(input));
    assert.equal(parseMealsCount(input), 0, String(input));
  }
});

test('food portions and weight conversions produce consistent meal estimates', () => {
  assert.equal(parseMealsCount('50 plates'), 50);
  assert.equal(parseMealsCount('100 meals'), 100);
  assert.equal(parseMealsCount('20 kg'), 50);
  assert.equal(parseMealsCount('10 kg cooked rice'), 25);
  assert.equal(parseMealsCount('800 grams'), 2);
  assert.equal(parseMealsCount('0.1 tonnes'), 250);
});

const Donation = require('./models/Donation');
const WasteRequest = require('./models/WasteRequest');
const { calculateImpactMetrics, recordMonthlySnapshot } = require('./controllers/impactController');

test('impact aggregation excludes non-recyclables and counts recognised units', async (t) => {
  t.mock.method(Donation, 'find', (query) => {
    assert.equal(query.status, 'completed');
    assert.deepEqual(query.isDemo, {$ne:true});
    assert.deepEqual(query.completedAt, {$type:'date'});
    return { select: async () => [{ quantity: '20 kg', district: 'Colombo' }] };
  });
  t.mock.method(WasteRequest, 'find', () => ({ select: async () => [
    { wasteCategory: 'plastic', processingOutcome: 'recycled', quantity: '500 g', district: 'Colombo' },
    { wasteCategory: 'organic', processingOutcome: 'composted', quantity: '2 tonnes', district: 'Kandy' },
    { wasteCategory: 'non_recyclable', quantity: '100 kg', district: 'Kandy' },
    { wasteCategory: 'paper', quantity: '40 bags', district: 'Kandy' }
  ] }));
  const result = await calculateImpactMetrics();
  assert.equal(result.mealsRescued, 50);
  assert.deepEqual(result.kgRecycled, { plastic: 0.5, glass: 0, paper: 0, metal: 0 });
  assert.equal(result.kgOrganicDiverted, 2000);
  assert.deepEqual(result.districtsCovered, ['Colombo', 'Kandy']);
});

test('current cumulative totals cannot be saved as a historical month', async () => {
  let error;
  await recordMonthlySnapshot({ body: { period: '2000-01' } }, {}, (err) => {error=err;});
  assert.equal(error.status,400);
  assert.match(error.message,/current month/);
});
