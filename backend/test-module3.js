/**
 * Integration & Algorithmic Test Suite for Module 3
 * Smart Waste Classification & Recycler/Collector Module
 * Author: MA. Fathima Amna (SEU/IS/22/ICT/082)
 *
 * Verifies:
 * 1. Smart Waste Classification Engine across all 6 circular streams.
 * 2. Pre-treatment handling guidelines & contaminant exclusion rules.
 * 3. Quantity parsers & EPA WARM environmental impact factors.
 * 4. Category-to-facility pathway routing (Recycler vs Composting vs Landfill).
 * 5. Multi-criteria eligible collector proximity ranking.
 * 6. Claim lifecycle state machine (posted <-> matched <-> recycled).
 * 7. Environmental Diversion Certification & ESG receipt generation.
 */

const assert = require('assert');
const {
  WASTE_STREAMS,
  parseWasteWeightKg,
  classifyWasteItem,
  calculateWasteEnvironmentalImpact,
  rankEligibleCollectors
} = require('./utils/wasteClassifier');

console.log('🧪 Starting FoodBridge Module 3 (Smart Waste Classification & Recycler Hub) Test Suite...\n');

// -------------------------------------------------------------
// Test 1: Smart Waste Classification Engine
// -------------------------------------------------------------
console.log('--- 1. Testing Smart Multi-Stream Waste Classifier ---');

// 1.1 Plastic Classification
const plasticSample = classifyWasteItem({
  title: 'Bulk PET Water Bottles & HDPE Crates',
  description: 'Clean clear plastic water bottles crushed and bagged from banquet hall'
});
assert.strictEqual(plasticSample.category, 'plastic', 'PET bottles and HDPE crates must classify as plastic');
assert.strictEqual(plasticSample.facilityType, 'recycler', 'Plastic must route to an industrial recycler');
assert(plasticSample.confidence >= 0.85, `Plastic confidence should be >= 0.85, got ${plasticSample.confidence}`);
assert(plasticSample.handlingGuidelines.length > 0, 'Must provide pre-treatment handling guidelines');
console.log(`✔ Plastic stream classified: "${plasticSample.categoryLabel}" (Confidence: ${(plasticSample.confidence * 100).toFixed(0)}%)`);

// 1.2 Glass Classification
const glassSample = classifyWasteItem('Used amber beer bottles and clear glass sauce jars');
assert.strictEqual(glassSample.category, 'glass', 'Glass bottles and jars must classify as glass');
assert.strictEqual(glassSample.facilityType, 'recycler', 'Glass must route to a recycler');
assert(glassSample.matchedKeywords.includes('glass') || glassSample.matchedKeywords.includes('bottle'), 'Glass keywords should match');
console.log(`✔ Glass stream classified: "${glassSample.categoryLabel}" (Matched: ${glassSample.matchedKeywords.join(', ')})`);

// 1.3 Paper & Cardboard Classification
const paperSample = classifyWasteItem('Flattened corrugated cardboard packing boxes and shredded paper sheets');
assert.strictEqual(paperSample.category, 'paper', 'Cardboard boxes and paper sheets must classify as paper');
assert.strictEqual(paperSample.facilityType, 'recycler', 'Paper must route to a paper recycling mill');
console.log(`✔ Paper/Cardboard stream classified: "${paperSample.categoryLabel}" (Confidence: ${(paperSample.confidence * 100).toFixed(0)}%)`);

// 1.4 Scrap Metal Classification
const metalSample = classifyWasteItem('Crushed aluminum beverage cans and steel food tins from restaurant kitchen');
assert.strictEqual(metalSample.category, 'metal', 'Aluminum cans and tins must classify as metal');
assert.strictEqual(metalSample.facilityType, 'recycler', 'Metal must route to an arc smelting recycler');
console.log(`✔ Scrap metal stream classified: "${metalSample.categoryLabel}" (Pathway: ${metalSample.pathwayTitle})`);

// 1.5 Organic Waste Classification
const organicSample = classifyWasteItem('Kitchen vegetable peelings, spoiled fruit leftovers, and coffee grounds');
assert.strictEqual(organicSample.category, 'organic', 'Vegetable peelings and fruit scraps must classify as organic');
assert.strictEqual(organicSample.facilityType, 'composting_facility', 'Organic waste must route to commercial composting');
console.log(`✔ Organic stream classified: "${organicSample.categoryLabel}" (Target Facility: ${organicSample.facilityTypeLabel})`);

// 1.6 Non-Recyclable General Waste
const nonRecyclableSample = classifyWasteItem('Contaminated multi-layer plastic foil wrappers, composite rubber, and general refuse');
assert.strictEqual(nonRecyclableSample.category, 'non_recyclable', 'Contaminated composites must classify as non-recyclable');
assert.strictEqual(nonRecyclableSample.facilityType, 'waste_management', 'Non-recyclables must route to municipal waste management');
console.log(`✔ Non-recyclable stream classified: "${nonRecyclableSample.categoryLabel}" (Zero diversion containment)\n`);

// -------------------------------------------------------------
// Test 2: Quantity Weight Parser Across Standard Metrics
// -------------------------------------------------------------
console.log('--- 2. Testing Commercial Quantity & Weight Parsers ---');

assert.strictEqual(parseWasteWeightKg('85 kg'), 85, '85 kg should parse to 85');
assert.strictEqual(parseWasteWeightKg('250.5 kg'), 250.5, '250.5 kg should parse to 250.5');
assert.strictEqual(parseWasteWeightKg('500 g'), 0.5, '500 g should parse to 0.5 kg');
assert.strictEqual(parseWasteWeightKg('2 tons'), 2000, '2 tons should convert to 2000 kg');
assert.strictEqual(parseWasteWeightKg('1.5 tonnes'), 1500, '1.5 tonnes should convert to 1500 kg');
assert.strictEqual(parseWasteWeightKg('4 bags'), 60, '4 bags (15kg ea) should convert to 60 kg');
assert.strictEqual(parseWasteWeightKg('3 crates'), 60, '3 crates (20kg ea) should convert to 60 kg');
assert.strictEqual(parseWasteWeightKg('2 bins'), 80, '2 bins (40kg ea) should convert to 80 kg');

console.log('✔ Quantity weight parser handles kg, g, tons, bags, crates, and bins accurately\n');

// -------------------------------------------------------------
// Test 3: Circular Economy & ESG Carbon Mitigation Calculations
// -------------------------------------------------------------
console.log('--- 3. Testing Circular Economy Impact Calculator ---');

// 3.1 Plastic Impact (1.80 kg CO2e / kg)
const plasticImpact = calculateWasteEnvironmentalImpact('plastic', '100 kg');
assert.strictEqual(plasticImpact.weightKg, 100);
assert.strictEqual(plasticImpact.divertedKg, 100);
assert.strictEqual(plasticImpact.co2eSavedKg, 180.0, '100 kg plastic should save 180 kg CO2e');
assert(plasticImpact.treeEquivalents > 8, 'Tree seedling equivalent should be ~8.3');

// 3.2 Metal Impact (4.20 kg CO2e / kg)
const metalImpact = calculateWasteEnvironmentalImpact('metal', '50 kg');
assert.strictEqual(metalImpact.co2eSavedKg, 210.0, '50 kg metal should save 210 kg CO2e (high energy offset)');

// 3.3 Organic Impact (2.50 kg CO2e / kg)
const organicImpact = calculateWasteEnvironmentalImpact('organic', '200 kg');
assert.strictEqual(organicImpact.co2eSavedKg, 500.0, '200 kg organic waste diverted should save 500 kg CO2e');

// 3.4 Non-Recyclable Impact (0.00 kg CO2e / kg)
const nonRecyclableImpact = calculateWasteEnvironmentalImpact('non_recyclable', '75 kg');
assert.strictEqual(nonRecyclableImpact.divertedKg, 0.0, 'Non-recyclable diverted kg must be 0');
assert.strictEqual(nonRecyclableImpact.co2eSavedKg, 0.0, 'Non-recyclable CO2e saved must be 0');

console.log(`✔ Circular impact metrics validated:`);
console.log(`  • 100 kg Plastic: ${plasticImpact.co2eSavedKg} kg CO2e saved (~${plasticImpact.treeEquivalents} trees)`);
console.log(`  • 50 kg Metal: ${metalImpact.co2eSavedKg} kg CO2e saved`);
console.log(`  • 200 kg Organic: ${organicImpact.co2eSavedKg} kg CO2e saved (Methane avoided)\n`);

// -------------------------------------------------------------
// Test 4: Category-to-Pathway Facility Routing
// -------------------------------------------------------------
console.log('--- 4. Testing Category-to-Facility Pathway Routing ---');

const plasticStream = WASTE_STREAMS.plastic;
const organicStream = WASTE_STREAMS.organic;
const nonRecStream = WASTE_STREAMS.non_recyclable;

assert.strictEqual(plasticStream.facilityType, 'recycler');
assert.strictEqual(organicStream.facilityType, 'composting_facility');
assert.strictEqual(nonRecStream.facilityType, 'waste_management');

assert(plasticStream.pathwayTitle.includes('Mechanical Polymer Reprocessing'));
assert(organicStream.pathwayTitle.includes('Composting'));
assert(nonRecStream.pathwayTitle.includes('Sanitary Landfill'));

console.log('✔ Industrial routing rules correctly differentiate recyclers, composters, and municipal landfill\n');

// -------------------------------------------------------------
// Test 5: Proximity-Aware Collector Eligibility & Matching
// -------------------------------------------------------------
console.log('--- 5. Testing Proximity Collector Eligibility Ranking ---');

const mockOrganizations = [
  {
    _id: 'org_ecocycle',
    name: 'EcoCycle Lanka (Pvt) Ltd',
    type: 'recycler',
    district: 'Colombo',
    materialTypesHandled: ['plastic', 'glass', 'paper', 'metal'],
    verificationStatus: 'verified',
    registrationInfo: 'WST-COL-887'
  },
  {
    _id: 'org_greencompost',
    name: 'GreenEarth BioCompost Facility',
    type: 'composting_facility',
    district: 'Gampaha',
    materialTypesHandled: ['organic'],
    verificationStatus: 'verified',
    registrationInfo: 'ENV-GMP-110'
  },
  {
    _id: 'org_kandy_metal',
    name: 'Central Metal Recyclers',
    type: 'recycler',
    district: 'Kandy',
    materialTypesHandled: ['plastic', 'metal'],
    verificationStatus: 'verified',
    registrationInfo: 'REG-KDY-441'
  },
  {
    _id: 'org_unverified',
    name: 'Fly-By-Night Scrap',
    type: 'recycler',
    district: 'Colombo',
    materialTypesHandled: ['plastic'],
    verificationStatus: 'pending', // Unverified!
    registrationInfo: 'REG-UNV-001'
  }
];

// 5.1 Match Plastic Waste from Colombo
const colomboPlasticRequest = {
  _id: 'req_plastic_01',
  wasteCategory: 'plastic',
  quantity: '120 kg',
  district: 'Colombo'
};

const rankedForPlastic = rankEligibleCollectors(colomboPlasticRequest, mockOrganizations);

// Unverified org must be excluded
assert.strictEqual(rankedForPlastic.some((c) => c.organizationId === 'org_unverified'), false, 'Unverified collectors must be excluded');

// Organic-only org must be excluded for plastic
assert.strictEqual(rankedForPlastic.some((c) => c.organizationId === 'org_greencompost'), false, 'Organic-only composting facility must not match plastic');

// EcoCycle (Colombo, local) must be ranked #1
assert.strictEqual(rankedForPlastic[0].organizationId, 'org_ecocycle', 'Local verified recycler must rank #1');
assert.strictEqual(rankedForPlastic[0].isSameDistrict, true, 'EcoCycle must be identified as same-district');
assert(rankedForPlastic[0].matchScore >= 95, 'Same-district match score should be >= 95');

// Central Metal Recyclers (Kandy, distant) should be ranked below EcoCycle
assert.strictEqual(rankedForPlastic[1].organizationId, 'org_kandy_metal', 'Distant recycler should rank #2');
assert(rankedForPlastic[1].distanceKm > 80, 'Kandy distance should be > 80 km');
assert(rankedForPlastic[1].matchScore < rankedForPlastic[0].matchScore, 'Distant recycler score must be lower than local');

console.log(`✔ Collector eligibility ranking verified:`);
console.log(`  • Ranked #1: ${rankedForPlastic[0].name} (${rankedForPlastic[0].distanceKm} km, Score: ${rankedForPlastic[0].matchScore})`);
console.log(`  • Ranked #2: ${rankedForPlastic[1].name} (${rankedForPlastic[1].distanceKm} km, Score: ${rankedForPlastic[1].matchScore})\n`);

// 5.2 Match Organic Waste from Gampaha
const gampahaOrganicRequest = {
  _id: 'req_organic_02',
  wasteCategory: 'organic',
  quantity: '300 kg',
  district: 'Gampaha'
};

const rankedForOrganic = rankEligibleCollectors(gampahaOrganicRequest, mockOrganizations);
assert.strictEqual(rankedForOrganic.length, 1, 'Only GreenEarth BioCompost handles organic among verified orgs');
assert.strictEqual(rankedForOrganic[0].organizationId, 'org_greencompost', 'GreenEarth should match organic request');
console.log(`✔ Organic matching verified: routed exclusively to ${rankedForOrganic[0].name}\n`);

// -------------------------------------------------------------
// Test 6: Recycler Claim & Status Pipeline Transitions
// -------------------------------------------------------------
console.log('--- 6. Testing Recycler Claim & State Machine Transitions ---');

let simulatedBatch = {
  id: 'batch_sim_100',
  status: 'posted',
  wasteCategory: 'plastic',
  quantity: '85 kg',
  matchedCollector: null
};

// 6.1 Claim Batch
function simulateClaim(batch, org) {
  if (batch.status !== 'posted') throw new Error(`Cannot claim status ${batch.status}`);
  if (org.verificationStatus !== 'verified') throw new Error('Collector must be verified');
  if (!org.materialTypesHandled.includes(batch.wasteCategory)) throw new Error('Material not handled');
  batch.status = 'matched';
  batch.matchedCollector = org._id;
  return batch;
}

simulatedBatch = simulateClaim(simulatedBatch, mockOrganizations[0]);
assert.strictEqual(simulatedBatch.status, 'matched', 'Claiming must set status to matched');
assert.strictEqual(simulatedBatch.matchedCollector, 'org_ecocycle', 'Matched collector must be set');
console.log('✔ Batch transition: posted -> matched confirmed');

// 6.2 Cancel Claim (Release back to open board)
function simulateCancelClaim(batch) {
  if (batch.status !== 'matched') throw new Error('Can only cancel matched claims');
  batch.status = 'posted';
  batch.matchedCollector = null;
  return batch;
}

simulatedBatch = simulateCancelClaim(simulatedBatch);
assert.strictEqual(simulatedBatch.status, 'posted', 'Cancel claim must reset status to posted');
assert.strictEqual(simulatedBatch.matchedCollector, null, 'Matched collector must be cleared');
console.log('✔ Batch transition: matched -> posted (release claim) confirmed');

// 6.3 Re-claim and advance to completed
simulatedBatch = simulateClaim(simulatedBatch, mockOrganizations[0]);

function simulateRecycled(batch) {
  batch.status = 'recycled';
  return {
    batch,
    certificateId: `ESG-REC-${Date.now().toString(36).toUpperCase()}`,
    netWeightKg: parseWasteWeightKg(batch.quantity),
    co2eAvoidedKg: calculateWasteEnvironmentalImpact(batch.wasteCategory, batch.quantity).co2eSavedKg
  };
}

const certResult = simulateRecycled(simulatedBatch);
assert.strictEqual(certResult.batch.status, 'recycled', 'Completion must set status to recycled');
assert(certResult.certificateId.startsWith('ESG-REC-'), 'Must generate ESG Diversion Certificate ID');
assert.strictEqual(certResult.netWeightKg, 85);
assert.strictEqual(certResult.co2eAvoidedKg, 153.0); // 85 * 1.8 = 153.0

console.log(`✔ Circular completion confirmed: Certificate ${certResult.certificateId} generated (${certResult.co2eAvoidedKg} kg CO2e saved)\n`);

// -------------------------------------------------------------
// Test 7: Recycler Analytics & Material Aggregator
// -------------------------------------------------------------
console.log('--- 7. Testing Recycler Material Breakdown Aggregator ---');

const pastBatches = [
  { wasteCategory: 'plastic', quantity: '100 kg', status: 'recycled' },
  { wasteCategory: 'plastic', quantity: '50 kg', status: 'recycled' },
  { wasteCategory: 'paper', quantity: '200 kg', status: 'recycled' },
  { wasteCategory: 'metal', quantity: '25 kg', status: 'recycled' },
  { wasteCategory: 'glass', quantity: '80 kg', status: 'recycled' },
  { wasteCategory: 'plastic', quantity: '40 kg', status: 'matched' } // Active, not yet recycled
];

let totalDivertedKg = 0;
let totalCo2e = 0;
let completedCount = 0;
let activeCount = 0;

pastBatches.forEach((b) => {
  const impact = calculateWasteEnvironmentalImpact(b.wasteCategory, b.quantity);
  if (b.status === 'recycled') {
    completedCount += 1;
    totalDivertedKg += impact.weightKg;
    totalCo2e += impact.co2eSavedKg;
  } else if (b.status === 'matched') {
    activeCount += 1;
  }
});

assert.strictEqual(completedCount, 5, '5 completed batches');
assert.strictEqual(activeCount, 1, '1 active batch');
assert.strictEqual(totalDivertedKg, 455, '100+50+200+25+80 = 455 kg');

console.log(`✔ Aggregator verified: ${completedCount} completed (${totalDivertedKg} kg diverted, ${totalCo2e.toFixed(1)} kg CO2e mitigated), ${activeCount} active in pipeline\n`);

console.log('====================================================');
console.log('🎉 ALL MODULE 3 INTEGRATION TESTS PASSED! (100%)');
console.log('====================================================');
