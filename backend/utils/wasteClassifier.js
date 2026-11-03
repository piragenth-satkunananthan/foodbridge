const { parseWeightKg } = require('./quantity');
const { eligibility } = require('../services/eligibilityService');
const definitions = {
  plastic: [
    'Plastic',
    'recycler',
    ['plastic', 'pet', 'hdpe', 'ldpe', 'polythene']
  ],
  glass: ['Glass', 'recycler', ['glass', 'cullet']],
  paper: [
    'Paper and cardboard',
    'recycler',
    ['paper', 'cardboard', 'paperboard', 'carton']
  ],
  metal: [
    'Metal',
    'recycler',
    ['metal', 'aluminium', 'aluminum', 'steel', 'copper', 'iron', 'tin']
  ],
  organic: [
    'Organic waste',
    'composting_facility',
    [
      'organic',
      'compost',
      'peels',
      'scraps',
      'spoiled',
      'rotten',
      'food waste',
      'kitchen waste'
    ]
  ],
  non_recyclable: [
    'Non-recyclable residuals',
    'waste_management',
    ['non recyclable', 'non_recyclable', 'ceramic', 'general waste']
  ]
};
const WASTE_STREAMS = Object.fromEntries(
  Object.entries(definitions).map(([key, [label, facilityType, keywords]]) => [
    key,
    {
      key,
      label,
      facilityType,
      facilityTypeLabel: facilityType.replaceAll('_', ' '),
      keywords,
      pathwayTitle:
        facilityType === 'recycler'
          ? 'Recycling'
          : facilityType === 'composting_facility'
            ? 'Composting'
            : 'Disposal',
      pathwayDescription:
        'Collector must confirm supported material and processing outcome.',
      handlingGuidelines: [
        'Keep material streams separate and disclose contamination to the collector.'
      ],
      landfillDivertRate: key === 'non_recyclable' ? 0 : 1,
      co2FactorKg: null
    }
  ])
);
function classifyWasteItem(input) {
  const body = typeof input === 'string' ? { description: input } : input || {};
  const description = [
    body.title,
    body.description,
    body.notes,
    body.specialInstructions,
    body.item
  ]
    .filter((v) => typeof v === 'string')
    .join(' ')
    .toLowerCase();
  if (/\b(battery|batteries|medical|chemical|hazardous)\b/.test(description))
    return {
      category: null,
      requiresConfirmation: true,
      reason: 'This material is outside the supported waste streams',
      confidence: null
    };
  let categories = [];
  if (body.wasteCategory && WASTE_STREAMS[body.wasteCategory])
    categories = [body.wasteCategory];
  else
    categories = Object.keys(WASTE_STREAMS).filter((key) =>
      WASTE_STREAMS[key].keywords.some((word) =>
        new RegExp(`\\b${word}\\b`).test(description)
      )
    );
  if (categories.length !== 1)
    return {
      category: null,
      requiresConfirmation: true,
      candidates: categories,
      reason: categories.length
        ? 'Separate mixed materials or explicitly declare the category'
        : 'Explicit material information is required',
      confidence: null
    };
  const stream = WASTE_STREAMS[categories[0]];
  return {
    ...stream,
    category: stream.key,
    categoryLabel: stream.label,
    requiresConfirmation: false,
    confidence: null,
    basis: body.wasteCategory
      ? 'donor-declared category'
      : 'deterministic keyword rule'
  };
}
function calculateWasteEnvironmentalImpact(category, quantity) {
  const stream = WASTE_STREAMS[category];
  const weightKg = parseWeightKg(quantity);
  return {
    category,
    categoryLabel: stream?.label || 'Unknown',
    weightKg,
    divertedKg: stream ? weightKg * stream.landfillDivertRate : 0,
    co2eSavedKg: null,
    treeEquivalents: null,
    co2FactorKg: null,
    landfillDivertRate: stream?.landfillDivertRate || 0,
    pathwayTitle: stream?.pathwayTitle || 'Unknown',
    quantityBasis: 'declared mass',
    environmentalEstimateStatus: 'No validated emissions model configured'
  };
}
function rankEligibleCollectors(post, organizations) {
  return organizations
    .map((org) => ({
      organizationId: org._id,
      name: org.name,
      type: org.type,
      district: org.district,
      materialTypesHandled: org.materialTypesHandled,
      ...eligibility(post, org, 'wasteRequest')
    }))
    .filter((org) => org.eligible)
    .map((org) => ({
      ...org,
      matchScore: Math.max(0, 100 - Math.round(org.distanceKm)),
      isSameDistrict: org.district === post.district
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
module.exports = {
  WASTE_STREAMS,
  parseWasteWeightKg: parseWeightKg,
  classifyWasteItem,
  calculateWasteEnvironmentalImpact,
  rankEligibleCollectors
};
