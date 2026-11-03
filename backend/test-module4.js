/**
 * Integration Test Suite for Module 4 (Volunteer Logistics & Route Tracking)
 * FoodBridge Platform
 */

const assert = require('assert');
const path = require('path');
const {
  DISTRICT_COORDINATES,
  haversineDistance,
  getDistrictDistanceKm,
  estimateTransitMinutes,
  parseQuantityMetrics
} = require('./utils/routeUtils');

console.log('🧪 Starting FoodBridge Module 4 (Volunteer Logistics & Route Tracking) Test Suite...\n');

// -------------------------------------------------------------
// Test 1: Geolocation Coordinates & Sri Lanka District Distances
// -------------------------------------------------------------
console.log('--- 1. Testing District Distance & Route Calculations ---');

assert(DISTRICT_COORDINATES.Colombo, 'Colombo coordinates must exist');
assert(DISTRICT_COORDINATES.Kandy, 'Kandy coordinates must exist');
assert(DISTRICT_COORDINATES.Gampaha, 'Gampaha coordinates must exist');
assert(DISTRICT_COORDINATES.Jaffna, 'Jaffna coordinates must exist');
assert(DISTRICT_COORDINATES.Galle, 'Galle coordinates must exist');

const sameDistrictKm = getDistrictDistanceKm('Colombo', 'Colombo');
assert.strictEqual(sameDistrictKm, 3.5, 'Same-district transit should default to ~3.5 km');

const colomboToGampaha = getDistrictDistanceKm('Colombo', 'Gampaha');
assert(colomboToGampaha >= 20 && colomboToGampaha <= 35, `Colombo to Gampaha should be ~25-30 km, got ${colomboToGampaha}`);

const colomboToKandy = getDistrictDistanceKm('Colombo', 'Kandy');
assert(colomboToKandy >= 90 && colomboToKandy <= 130, `Colombo to Kandy should be ~100-125 km, got ${colomboToKandy}`);

const colomboToJaffna = getDistrictDistanceKm('Colombo', 'Jaffna');
assert(colomboToJaffna > 300, `Colombo to Jaffna should be > 300 km, got ${colomboToJaffna}`);

console.log(`✔ Geo-distance tests passed:`);
console.log(`  • Colombo -> Colombo: ${sameDistrictKm} km`);
console.log(`  • Colombo -> Gampaha: ${colomboToGampaha} km`);
console.log(`  • Colombo -> Kandy: ${colomboToKandy} km`);
console.log(`  • Colombo -> Jaffna: ${colomboToJaffna} km\n`);

// -------------------------------------------------------------
// Test 2: Transit Time Estimation
// -------------------------------------------------------------
console.log('--- 2. Testing Transit Time Estimation Engine ---');

const localMins = estimateTransitMinutes(3.5);
const mediumMins = estimateTransitMinutes(28.5);
const longMins = estimateTransitMinutes(115.0);

assert(localMins >= 15 && localMins <= 20, `Local 3.5km transit should be ~17 mins (with loading), got ${localMins}`);
assert(mediumMins > localMins, 'Medium distance must take longer than local');
assert(longMins > mediumMins, 'Long distance must take longer than medium');

console.log(`✔ Transit time estimates verified: 3.5km = ${localMins}m, 28.5km = ${mediumMins}m, 115km = ${longMins}m\n`);

// -------------------------------------------------------------
// Test 3: Metric & Quantity Parsing
// -------------------------------------------------------------
console.log('--- 3. Testing Cargo & Portion Parsers ---');

const platesResult = parseQuantityMetrics('40 plates');
assert.strictEqual(platesResult.meals, 40, '40 plates should equal 40 meals');
assert.strictEqual(platesResult.kg, 16, '40 plates should equal 16 kg (0.4 kg/plate)');

const kgResult = parseQuantityMetrics('20 kg');
assert.strictEqual(kgResult.kg, 20, '20 kg should parse to 20');
assert.strictEqual(kgResult.meals, 50, '20 kg should convert to 50 meals (2.5 meals/kg)');

const tonsResult = parseQuantityMetrics('2 tons');
assert.strictEqual(tonsResult.kg, 2000, '2 tons should equal 2000 kg');

console.log('✔ parseQuantityMetrics correctly calculates meals and kg across units\n');

// -------------------------------------------------------------
// HTTP lifecycle and authorization coverage: test/pickup.test.js and test/security.test.js.
console.log('Route utility checks passed. Run npm run test:api for workflow coverage.');
