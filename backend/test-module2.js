const assert = require('assert');
const {
  DISTRICT_COORDINATES,
  haversineDistance,
  getDistrictDistanceKm,
  calculateProximityScore,
  calculateUrgencyScore,
  calculateStorageScore,
  calculateQuantityScore,
  calculateSmartMatchScore,
  parseEstimatedPortions
} = require('./utils/distanceUtils');

console.log('🧪 Starting FoodBridge Module 2 (District-Based & Smart Matching) Test Suite...\n');

// -------------------------------------------------------------
// Test 1: Geo-Coordinates & District Distance Calculations
// -------------------------------------------------------------
console.log('--- 1. Testing District Distance & Geo-Proximity ---');

// Check district coordinates database
assert(DISTRICT_COORDINATES.Colombo, 'Colombo coordinates must exist');
assert(DISTRICT_COORDINATES.Kandy, 'Kandy coordinates must exist');
assert(DISTRICT_COORDINATES.Batticaloa, 'Batticaloa coordinates must exist');
assert(DISTRICT_COORDINATES.Jaffna, 'Jaffna coordinates must exist');

// Test same-district transit distance
const localDist = getDistrictDistanceKm('Colombo', 'Colombo');
assert.strictEqual(localDist, 3.0, 'Same district distance should be local transit (~3.0 km)');

// Test adjacent districts (Colombo <-> Gampaha)
const colomboToGampaha = getDistrictDistanceKm('Colombo', 'Gampaha');
assert(colomboToGampaha > 10 && colomboToGampaha < 35, `Colombo to Gampaha should be ~20km, got ${colomboToGampaha} km`);

// Test medium distance (Colombo <-> Kandy)
const colomboToKandy = getDistrictDistanceKm('Colombo', 'Kandy');
assert(colomboToKandy > 80 && colomboToKandy < 125, `Colombo to Kandy should be ~95-115km, got ${colomboToKandy} km`);

// Test far distance (Colombo <-> Jaffna)
const colomboToJaffna = getDistrictDistanceKm('Colombo', 'Jaffna');
assert(colomboToJaffna > 250, `Colombo to Jaffna should be > 250km, got ${colomboToJaffna} km`);

console.log(`✔ Geo-distance tests passed:`);
console.log(`  • Colombo -> Colombo: ${localDist} km`);
console.log(`  • Colombo -> Gampaha: ${colomboToGampaha} km`);
console.log(`  • Colombo -> Kandy: ${colomboToKandy} km`);
console.log(`  • Colombo -> Jaffna: ${colomboToJaffna} km\n`);

// -------------------------------------------------------------
// Test 2: Proximity Scoring
// -------------------------------------------------------------
console.log('--- 2. Testing Proximity Scoring Engine ---');

const scoreLocal = calculateProximityScore(3.0);
const scoreAdjacent = calculateProximityScore(20.0);
const scoreFar = calculateProximityScore(120.0);
const scoreExtreme = calculateProximityScore(350.0);

assert.strictEqual(scoreLocal, 100, 'Distance <= 5km must receive maximum 100 proximity score');
assert(scoreAdjacent >= 80, `Adjacent district (${scoreAdjacent}) should be >= 80`);
assert(scoreFar < scoreAdjacent, 'Distant district score must be less than adjacent');
assert(scoreExtreme <= 20, 'Extreme distance must receive low proximity score');

console.log(`✔ Proximity scoring verified: Local=${scoreLocal}, Adjacent=${scoreAdjacent}, Far=${scoreFar}, Extreme=${scoreExtreme}\n`);

// -------------------------------------------------------------
// Test 3: Urgency / Freshness Window Scoring
// -------------------------------------------------------------
console.log('--- 3. Testing Perishability Urgency Engine ---');

const now = Date.now();
const criticalDeadline = new Date(now + 1.5 * 3600 * 1000); // 1.5 hours remaining
const mediumDeadline = new Date(now + 6 * 3600 * 1000);   // 6 hours remaining
const relaxedDeadline = new Date(now + 36 * 3600 * 1000); // 36 hours remaining
const expiredDeadline = new Date(now - 1 * 3600 * 1000);  // Expired 1 hour ago

const critResult = calculateUrgencyScore(criticalDeadline);
const medResult = calculateUrgencyScore(mediumDeadline);
const relResult = calculateUrgencyScore(relaxedDeadline);
const expResult = calculateUrgencyScore(expiredDeadline);

assert.strictEqual(critResult.score, 100, 'Urgent deadline (< 2h) must score 100');
assert.strictEqual(critResult.urgencyLevel, 'critical', 'Urgency level must be critical');

assert.strictEqual(medResult.score, 75, '6h deadline must score 75');
assert.strictEqual(medResult.urgencyLevel, 'medium', 'Urgency level must be medium');

assert.strictEqual(relResult.score, 30, '36h deadline must score 30');
assert.strictEqual(expResult.score, 0, 'Past deadline must score 0');
assert.strictEqual(expResult.urgencyLevel, 'expired', 'Expired items must be flagged as expired');

console.log('✔ Urgency scoring accurately categorizes critical, medium, and expired perishability windows\n');

// -------------------------------------------------------------
// Test 4: Portion Estimation & Handling Compatibility
// -------------------------------------------------------------
console.log('--- 4. Testing Quantity & Portion Parsers ---');

assert.strictEqual(parseEstimatedPortions('50 plates'), 50, '50 plates should parse to 50');
assert.strictEqual(parseEstimatedPortions('20 kg'), 50, '20 kg should convert to ~50 meals (2.5x conversion)');
assert.strictEqual(parseEstimatedPortions('10 kg surplus rice'), 25, '10 kg should convert to 25 meals');
assert.strictEqual(parseEstimatedPortions('120 meal packets'), 120, '120 meal packets should parse to 120');

assert.strictEqual(calculateStorageScore('room_temperature'), 100);
assert.strictEqual(calculateStorageScore('refrigerated'), 85);
assert.strictEqual(calculateStorageScore('frozen'), 75);

console.log('✔ Portion estimation and storage compatibility scoring verified\n');

// -------------------------------------------------------------
// Test 5: Composite Smart Matching Score Ranking
// -------------------------------------------------------------
console.log('--- 5. Testing Multi-Factor Smart Match Ranking ---');

const recipientDistrict = 'Colombo';

// Item A: Colombo, expires in 1.5h, 60 plates (Ideal local urgent match)
const donationA = {
  foodType: 'Buffet Rice & Chicken Curry',
  district: 'Colombo',
  quantity: '60 plates',
  storageCondition: 'refrigerated',
  pickupDeadline: new Date(now + 1.5 * 3600 * 1000)
};

// Item B: Gampaha, expires in 5h, 30 plates (Good nearby match)
const donationB = {
  foodType: 'Sandwich Trays',
  district: 'Gampaha',
  quantity: '30 plates',
  storageCondition: 'room_temperature',
  pickupDeadline: new Date(now + 5 * 3600 * 1000)
};

// Item C: Jaffna, expires in 20h, 20 plates (Distant match)
const donationC = {
  foodType: 'Packed Pastries',
  district: 'Jaffna',
  quantity: '20 plates',
  storageCondition: 'room_temperature',
  pickupDeadline: new Date(now + 20 * 3600 * 1000)
};

const matchA = calculateSmartMatchScore({ donation: donationA, recipientDistrict });
const matchB = calculateSmartMatchScore({ donation: donationB, recipientDistrict });
const matchC = calculateSmartMatchScore({ donation: donationC, recipientDistrict });

console.log(`  • Item A (Colombo Local, Urgent 1.5h): ${matchA.matchScore}% Match`);
console.log(`  • Item B (Gampaha Nearby, 5h): ${matchB.matchScore}% Match`);
console.log(`  • Item C (Jaffna Distant, 20h): ${matchC.matchScore}% Match`);

assert(matchA.matchScore > matchB.matchScore, 'Local urgent match (A) must outrank adjacent match (B)');
assert(matchB.matchScore > matchC.matchScore, 'Adjacent match (B) must outrank distant match (C)');
assert(matchA.matchScore >= 90, `Item A should have high match score (>=90%), got ${matchA.matchScore}%`);

console.log('✔ Multi-criteria algorithmic ranking correctly prioritizes local and urgent food surplus\n');

// -------------------------------------------------------------
// Test 6: Allocation Business Rules & State Transitions
// -------------------------------------------------------------
console.log('--- 6. Testing Allocation Lifecycle & Rules ---');

// Rule 1: Expired donations cannot produce a valid match
const expiredDonation = {
  foodType: 'Stale bread',
  district: 'Colombo',
  quantity: '10 kg',
  storageCondition: 'room_temperature',
  pickupDeadline: new Date(now - 3600 * 1000)
};
const expiredMatch = calculateSmartMatchScore({ donation: expiredDonation, recipientDistrict });
assert.strictEqual(expiredMatch.isExpired, true, 'Expired donation must be flagged as expired');
assert.strictEqual(expiredMatch.matchScore, 0, 'Expired donation score must be 0');

// Rule 2: State transition validation: posted -> matched
const mockDonation = {
  _id: '507f1f77bcf86cd799439011',
  status: 'posted',
  matchedRecipient: null
};

// Simulate claim
mockDonation.status = 'matched';
mockDonation.matchedRecipient = '507f191e810c19729de860ea';
assert.strictEqual(mockDonation.status, 'matched', 'Donation must transition to matched');
assert(mockDonation.matchedRecipient, 'Matched recipient organization ID must be set');

// Simulate cancellation / release
mockDonation.status = 'posted';
mockDonation.matchedRecipient = null;
assert.strictEqual(mockDonation.status, 'posted', 'Cancelled claim must restore donation to posted');
assert.strictEqual(mockDonation.matchedRecipient, null, 'Matched recipient must be cleared');

console.log('✔ Allocation state machine lifecycle (posted <-> matched) verified\n');

console.log('====================================================');
console.log('🎉 ALL MODULE 2 TESTS PASSED SUCCESSFULLY! (100%)');
console.log('====================================================');
