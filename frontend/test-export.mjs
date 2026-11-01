import test from 'node:test';
import assert from 'node:assert/strict';
import { downloadCSV, exportImpactMetricsCSV } from './src/utils/exportUtils.js';

function capture(t) {
  let blob;
  const link = { setAttribute() {}, click() {} };
  t.mock.method(URL, 'createObjectURL', (value) => { blob = value; return 'blob:test'; });
  t.mock.method(URL, 'revokeObjectURL', () => {});
  const original = globalThis.document;
  globalThis.document = { createElement: () => link, body: { appendChild() {}, removeChild() {} } };
  t.after(() => { globalThis.document = original; });
  return () => blob.text();
}

test('impact CSV preserves recorded weights and zero coverage without environmental claims', async (t) => {
  const read = capture(t);
  exportImpactMetricsCSV({ mealsRescued: 50, totalKgRecycled: 0.5, kgRecycled: {plastic: 0.5}, kgOrganicDiverted: 0, districtsCoveredCount: 0 }, {verifiedNGOs: 0, verifiedRecyclers: 0, activeVolunteers: 0});
  const csv = await read();
  assert.match(csv, /Recycled Plastic,0.5,kg/);
  assert.match(csv, /Active Districts Covered,0,Districts/);
  assert.match(csv, /Estimated Meals Rescued,50,Meals/);
  assert.doesNotMatch(csv, /CO2|Water Footprint/);
});

test('CSV escapes commas, quotes, and spreadsheet formulas', async (t) => {
  const read = capture(t);
  downloadCSV('test', [{Name: '=1+1', Note: 'A, "B"'}]);
  assert.equal(await read(), 'Name,Note\n\'=1+1,"A, ""B"""');
});
