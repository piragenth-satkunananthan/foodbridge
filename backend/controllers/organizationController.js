const Organization = require('../models/Organization');
const User = require('../models/User');
const transaction = require('../utils/transaction');
const {
  endpoint,
  fail,
  text,
  district,
  coordinates
} = require('../utils/domain');
const { queueNotifications } = require('../utils/notificationService');
const recipientTypes = ['ngo', 'charity', 'shelter'];
const collectorTypes = ['recycler', 'composting_facility', 'waste_management'];
const materials = [
  'plastic',
  'glass',
  'paper',
  'metal',
  'organic',
  'non_recyclable'
];
const storage = ['refrigerated', 'room_temperature', 'frozen'];
function profile(body, role) {
  const allowed = [
    'name',
    'type',
    'registrationInfo',
    'district',
    'capacityKg',
    'serviceDistricts',
    'storageConditions',
    'foodTypes',
    'materialTypesHandled',
    'location',
    'accepting',
    'city',
    'area',
    'address'
  ];
  if (Object.keys(body).some((key) => !allowed.includes(key)))
    fail(400, 'Unsupported organization field');
  const types = role === 'recipient' ? recipientTypes : collectorTypes;
  if (!types.includes(body.type))
    fail(400, 'Organization type does not match account role');
  if (
    typeof body.capacityKg !== 'number' ||
    !Number.isFinite(body.capacityKg) ||
    body.capacityKg <= 0 ||
    body.capacityKg > 1e9
  )
    fail(400, 'Positive capacityKg is required');
  const array = (key, valid) => {
    const values = body[key] || [];
    if (
      !Array.isArray(values) ||
      values.length > 100 ||
      values.some(
        (v) =>
          typeof v !== 'string' || !v.trim() || (valid && !valid.includes(v))
      )
    )
      fail(400, `Invalid ${key}`);
    return [...new Set(values.map((v) => v.trim()))];
  };
  const details = {
    name: text(body.name, 'Name', 200),
    type: body.type,
    registrationInfo: text(
      body.registrationInfo,
      'Registration information',
      1000
    ),
    district: district(body.district),
    capacityKg: body.capacityKg,
    serviceDistricts: array('serviceDistricts').map(district),
    storageConditions: array('storageConditions', storage),
    foodTypes: array('foodTypes').map((v) => v.toLowerCase()),
    materialTypesHandled: array('materialTypesHandled', materials),
    accepting: body.accepting === undefined ? true : body.accepting
  };
  if (typeof details.accepting !== 'boolean')
    fail(400, 'accepting must be boolean');
  if (role === 'recipient' && !details.storageConditions.length)
    fail(400, 'Specify supported storage conditions');
  if (role === 'recycler' && !details.materialTypesHandled.length)
    fail(400, 'Specify supported materials');
  if (
    body.type === 'composting_facility' &&
    details.materialTypesHandled.some((x) => x !== 'organic')
  )
    fail(400, 'Composting facilities may only accept organic waste');
  if (
    body.type === 'waste_management' &&
    details.materialTypesHandled.some((x) => x !== 'non_recyclable')
  )
    fail(400, 'Waste management profiles handle non-recyclable disposal');
  if (
    body.type === 'recycler' &&
    details.materialTypesHandled.some((x) =>
      ['organic', 'non_recyclable'].includes(x)
    )
  )
    fail(400, 'Use a composting or waste management profile for this material');
  for (const field of ['city', 'area', 'address'])
    if (body[field] !== undefined)
      details[field] =
        body[field] === ''
          ? ''
          : text(body[field], field, field === 'address' ? 500 : 100);
  if (body.location !== undefined)
    details.location = coordinates(body.location);
  return details;
}
const getOrganization = endpoint(async (req, res) => {
  const organization = await Organization.findOne({ linkedUser: req.user._id });
  res.json({ organization });
});
const saveOrganization = endpoint(async (req, res) => {
  const details = profile(req.body, req.user.role);
  const organization = await transaction(async (session) => {
    let org = await Organization.findOne({ linkedUser: req.user._id }).session(
      session
    );
    if (org?.reservedKg > 0)
      fail(
        409,
        'Release or complete active claims before changing the organization profile'
      );
    if (!org) org = new Organization({ linkedUser: req.user._id });
    Object.assign(org, details, {
      verificationStatus: 'pending',
      verificationRemarks: '',
      verifiedAt: null,
      verifiedBy: null
    });
    await org.save({ session });
    await User.updateOne(
      { _id: req.user._id },
      { $set: { organization: org._id, verificationStatus: 'pending' } },
      { session }
    );
    const admins = await User.find({ role: 'admin', status: 'active' })
      .select('_id')
      .session(session);
    await queueNotifications(
      admins.map((u) => u._id),
      `Organization ${org.name} is awaiting verification.`,
      'organization',
      org._id,
      session
    );
    return org;
  });
  res
    .status(201)
    .json({ organization, message: 'Organization submitted for verification' });
});
module.exports = { getOrganization, saveOrganization };
