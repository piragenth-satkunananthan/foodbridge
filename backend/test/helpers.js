const { before, after } = require('node:test');
const mongoose = require('mongoose');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Donation = require('../models/Donation');
const WasteRequest = require('../models/WasteRequest');
const Pickup = require('../models/Pickup');
const tokenFor = require('../config/generateToken');
function setup() {
  let server, base;
  before(async () => {
    const uri = process.env.MONGO_URI || '';
    if (!/^mongodb:\/\/127\.0\.0\.1:\d+\/foodbridge_test_[\w]+\?directConnection=true$/.test(uri)) throw new Error('Use npm run test:api with its disposable database');
    await mongoose.connect(uri);
    await mongoose.connection.dropDatabase();
    const app = require('../server');
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
  return async (method, route, user, body) => {
    const response = await fetch(base + '/api' + route, {
      method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token || tokenFor(user._id, user.role)}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return { status: response.status, body: await response.json() };
  };
}
let counter = 0;
async function user(role, orgType) {
  const account = await User.create({ name: `Test ${++counter}`, email: `test${counter}@example.invalid`, password: 'unused-test-hash', role, district: 'Colombo', contactNumber: '0700000000' });
  if (orgType) {
    const org = await Organization.create({ name: account.name, type: orgType, registrationInfo: `TEST${counter}`, district: 'Colombo', linkedUser: account._id, verificationStatus: 'verified', capacityKg: 1000, storageConditions: ['refrigerated','room_temperature','frozen'], materialTypesHandled: orgType === 'composting_facility' ? ['organic'] : ['plastic','glass','paper','metal','non_recyclable'] });
    account.organization = org._id;
    account.verificationStatus = 'verified';
    await account.save();
  }
  return account;
}
function foodBody(overrides = {}) {
  return { foodType: 'Rice', quantity: '20 kg', preparedTime: new Date(Date.now()-3600000).toISOString(), availableTime: new Date(Date.now()-60000).toISOString(), pickupDeadline: new Date(Date.now()+86400000).toISOString(), storageCondition: 'refrigerated', district: 'Colombo', ...overrides };
}
module.exports = { setup, user, foodBody, mongoose, User, Organization, Donation, WasteRequest, Pickup };
