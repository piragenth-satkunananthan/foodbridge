const Organization = require('../models/Organization');
const User = require('../models/User');
const { parseQuantity } = require('../utils/quantity');
const {
  getDistrictDistanceKm,
  haversineDistance
} = require('../utils/distanceUtils');
const { fail } = require('../utils/domain');
async function organizationFor(user, session) {
  const org = await Organization.findOne({ linkedUser: user._id }).session(
    session || null
  );
  if (!org) fail(403, 'A registered organization is required');
  if (org.verificationStatus !== 'verified' || !org.accepting)
    fail(403, 'Organization must be verified and accepting requests');
  const owner = await User.findById(org.linkedUser).session(session || null);
  if (!owner || owner.status !== 'active')
    fail(403, 'Organization account is not active');
  return org;
}
function distanceFor(post, org) {
  if (
    Number.isFinite(post.location?.lat) &&
    Number.isFinite(post.location?.lng) &&
    Number.isFinite(org.location?.lat) &&
    Number.isFinite(org.location?.lng)
  ) {
    return {
      distanceKm: haversineDistance(
        post.location.lat,
        post.location.lng,
        org.location.lat,
        org.location.lng
      ),
      distanceBasis: 'straight-line coordinates estimate'
    };
  }
  return {
    distanceKm: getDistrictDistanceKm(post.district, org.district),
    distanceBasis: 'district estimate'
  };
}
function eligibility(post, org, kind) {
  const q = parseQuantity(post.quantity);
  let reason = null;
  if (org.verificationStatus !== 'verified' || !org.accepting)
    reason = 'Organization is not available and verified';
  else if (!q || (kind === 'wasteRequest' && q.estimatedWeight))
    reason = 'A supported measured quantity is required';
  else if (
    !Number.isFinite(org.capacityKg) ||
    q.kg > org.capacityKg - (org.reservedKg || 0)
  )
    reason = 'Insufficient declared available capacity';
  else if (
    org.serviceDistricts?.length &&
    !org.serviceDistricts.includes(post.district)
  )
    reason = 'Outside service districts';
  else if (kind === 'donation') {
    if (!['ngo', 'charity', 'shelter'].includes(org.type))
      reason = 'Food recipient organization required';
    else if (!org.storageConditions?.includes(post.storageCondition))
      reason = 'Storage requirements are unsupported';
    else if (
      org.foodTypes?.length &&
      !org.foodTypes.some(
        (type) => type.toLowerCase() === post.foodType.toLowerCase()
      )
    )
      reason = 'Food type is not accepted';
  } else {
    const expected =
      post.wasteCategory === 'organic'
        ? 'composting_facility'
        : post.wasteCategory === 'non_recyclable'
          ? 'waste_management'
          : 'recycler';
    if (
      org.type !== expected ||
      !org.materialTypesHandled?.includes(post.wasteCategory)
    )
      reason = 'Material or processing pathway is unsupported';
  }
  const distance = distanceFor(post, org);
  // Planning estimate only. A road routing provider is not configured.
  const transitMinutes = Math.ceil(
    ((distance.distanceKm * 1.25) / 30) * 60 + 10
  );
  const start = Math.max(
    Date.now(),
    new Date(post.availableTime || 0).getTime()
  );
  if (
    !reason &&
    (!Number.isFinite(new Date(post.pickupDeadline).getTime()) ||
      start + transitMinutes * 60000 >= new Date(post.pickupDeadline).getTime())
  )
    reason = 'Insufficient time for estimated transport';
  return {
    eligible: !reason,
    reason,
    ...distance,
    estimatedTransitMinutes: transitMinutes,
    weightKg: q?.kg || 0,
    estimatedWeight: q?.estimatedWeight || false
  };
}
module.exports = { organizationFor, eligibility, distanceFor };
