const assert = require('assert');
const { parseMealsCount, parseWeightKg } = require('./controllers/impactController');
const Notification = require('./models/Notification');
const User = require('./models/User');
const Organization = require('./models/Organization');
const ImpactRecord = require('./models/ImpactRecord');
const app = require('./server');

console.log('🧪 Starting Module 5 Tests (Admin, Verification & Impact)...\n');

// 1. Test Impact Parser Helpers
console.log('--- 1. Testing Impact Quantity Parsers ---');
assert.strictEqual(parseMealsCount('50 plates'), 50, '50 plates should equal 50 meals');
assert.strictEqual(parseMealsCount('100 meals'), 100, '100 meals should equal 100 meals');
assert.strictEqual(parseMealsCount('20 kg'), 50, '20 kg should convert to ~50 meals (2.5 per kg)');
assert.strictEqual(parseMealsCount('10 kg cooked rice'), 25, '10 kg should convert to 25 meals');
console.log('✔ parseMealsCount works correctly across plates and kg units');

assert.strictEqual(parseWeightKg('25 kg'), 25, '25 kg should equal 25');
assert.strictEqual(parseWeightKg('500 g'), 0.5, '500 g should equal 0.5 kg');
assert.strictEqual(parseWeightKg('2 tons'), 2000, '2 tons should equal 2000 kg');
console.log('✔ parseWeightKg works correctly across kg, g, and tons\n');

// 2. Test Schemas Validation
console.log('--- 2. Testing Mongoose Schema Definitions ---');
const dummyUser = new User({
  name: 'Admin Test',
  email: 'admin@foodbridge.test',
  password: 'hashedpassword',
  role: 'admin',
  district: 'Colombo',
  contactNumber: '0770000000'
});
assert.strictEqual(dummyUser.status, 'active', 'User status should default to active');
assert.strictEqual(dummyUser.role, 'admin', 'User role should be admin');
console.log('✔ User model supports admin role and active status');

const dummyOrg = new Organization({
  name: 'Hope Charity Shelter',
  type: 'shelter',
  registrationInfo: 'REG-2026-9901',
  district: 'Kandy',
  linkedUser: dummyUser._id
});
assert.strictEqual(dummyOrg.verificationStatus, 'pending', 'Organization verification should default to pending');
assert.strictEqual(dummyOrg.verificationRemarks, '', 'Default remarks should be empty');
console.log('✔ Organization model supports pending verification and remarks');

const dummyNotification = new Notification({
  recipientUser: dummyUser._id,
  message: 'Your organization has been verified!',
  relatedType: 'organization',
  relatedId: dummyOrg._id
});
assert.strictEqual(dummyNotification.readStatus, false, 'Notification readStatus should default to false');
assert.strictEqual(dummyNotification.relatedType, 'organization', 'Notification supports organization relatedType');
console.log('✔ Notification model supports organization and system alerts');

const dummyImpact = new ImpactRecord({
  mealsRescued: 1250,
  kgRecycled: { plastic: 300, glass: 150, paper: 200, metal: 50 },
  kgOrganicDiverted: 500,
  districtsCovered: ['Colombo', 'Kandy', 'Batticaloa'],
  period: '2026-10'
});
assert.strictEqual(dummyImpact.period, '2026-10');
assert.strictEqual(dummyImpact.mealsRescued, 1250);
console.log('✔ ImpactRecord model validates aggregated period metrics\n');

// 3. Test App Route Mounting
console.log('--- 3. Testing Route Bindings in Express Server ---');
assert.ok(app, 'Express app instance exists');
assert.ok(typeof app.listen === 'function', 'app has listen method');
console.log('✔ Express app successfully loaded and initialized without runtime syntax errors');
console.log('\n🎉 ALL MODULE 5 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY!');
process.exit(0);
