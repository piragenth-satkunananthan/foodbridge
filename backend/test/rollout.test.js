const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { setup, Organization, mongoose } = require('./helpers');
setup();

test('rollout preflight detects legacy links without mutation and the index tolerates unlinked records', async () => {
  await Organization.collection.dropIndex('linkedUser_1');
  const linkedUser = new mongoose.Types.ObjectId();
  const inserted = await Organization.collection.insertMany([
    { name: 'Legacy unlinked one', capacityKg: 100 },
    { name: 'Legacy unlinked two', capacityKg: 100 },
    { name: 'Linked one', linkedUser, capacityKg: 100 },
    { name: 'Duplicate link', linkedUser, capacityKg: 100 }
  ]);
  const before = await Organization.collection.find().toArray();
  const indexes = await Organization.collection.indexes();
  const result = spawnSync(
    process.execPath,
    [path.resolve(__dirname, '../scripts/check-data.js')],
    { env: process.env, encoding: 'utf8' }
  );
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /"organizationsMissingUserLink": 2/);
  assert.match(result.stdout, /"organizationDuplicateUserLinks": 1/);
  assert.deepEqual(await Organization.collection.find().toArray(), before);
  assert.deepEqual(await Organization.collection.indexes(), indexes);

  await Organization.collection.deleteOne({ _id: inserted.insertedIds[3] });
  await Organization.createIndexes();
  await assert.rejects(
    Organization.collection.insertOne({ name: 'Duplicate again', linkedUser }),
    { code: 11000 }
  );
  assert.equal(await Organization.countDocuments({ linkedUser: null }), 2);
});
