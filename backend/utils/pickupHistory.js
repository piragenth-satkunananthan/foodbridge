function snapshotSource(post) {
  const fields = [
    '_id',
    'donor',
    'foodType',
    'wasteCategory',
    'quantity',
    'quantityValue',
    'quantityUnit',
    'district',
    'city',
    'area',
    'address',
    'location',
    'availableTime',
    'pickupDeadline',
    'preparedTime',
    'storageCondition',
    'specialInstructions',
    'photo'
  ];
  return Object.fromEntries(
    fields
      .filter((key) => post[key] !== undefined)
      .map((key) => [key, post[key]])
  );
}

function historicalPickup(doc) {
  const pickup = doc.toObject ? doc.toObject() : { ...doc };
  if (
    !['cancelled', 'expired', 'rejected', 'completed'].includes(pickup.statusPipeline)
  ) return pickup;
  const kind = pickup.donation ? 'donation' : 'wasteRequest';
  // shortcut: legacy claims have no snapshot; show only their source ID until verified history is available.
  pickup[kind] = pickup.sourceSnapshot
    ? { ...pickup.sourceSnapshot, status: pickup.statusPipeline }
    : { _id: pickup[kind]?._id || pickup[kind] };
  return pickup;
}
module.exports = { snapshotSource, historicalPickup };
