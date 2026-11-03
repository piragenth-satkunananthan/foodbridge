/**
 * Smart Waste Classification & Category-to-Pathway Routing Engine (Module 3)
 * FoodBridge Platform — MA. Fathima Amna (SEU/IS/22/ICT/082)
 *
 * Implements:
 * 1. Multi-stream classification: Plastic, Glass, Paper, Metal, Organic, Non-Recyclable.
 * 2. Industrial pathway routing: Recycler vs Composting Facility vs Waste Management.
 * 3. Pre-treatment handling guidelines & contaminant exclusion rules.
 * 4. Circular economy impact calculators (EPA WARM & FAO methodology).
 * 5. Proximity-aware collector eligibility ranking.
 */

const { getDistrictDistanceKm } = require('./distanceUtils');

// Comprehensive Industrial Waste Streams & Circular Pathways Database
const WASTE_STREAMS = {
  plastic: {
    key: 'plastic',
    label: 'Plastics & Synthetic Polymers',
    facilityType: 'recycler',
    facilityTypeLabel: 'Industrial Plastic Reprocessing Facility',
    pathwayTitle: 'Mechanical Polymer Reprocessing & Pelleting',
    pathwayDescription: 'Sorted by polymer resin code (PET, HDPE, LDPE, PP), shredded, hot-washed, and extruded into circular polymer pellets for industrial molding.',
    handlingGuidelines: [
      'Rinse containers thoroughly to remove food grease, sugars, and liquid residues.',
      'Segregate bottle caps, closures, and cling wraps if made from incompatible resins.',
      'Flatten or bale hollow containers (bottles, jerrycans) to optimize courier transport efficiency.'
    ],
    co2FactorKg: 1.80, // kg CO2e avoided per kg recycled (EPA WARM)
    landfillDivertRate: 1.0,
    keywords: [
      'plastic', 'bottle', 'bottles', 'pet', 'hdpe', 'ldpe', 'pp', 'polythene',
      'crate', 'crates', 'tub', 'tubs', 'wrapper', 'wrappers', 'packaging',
      'jug', 'jugs', 'container', 'containers', 'cups', 'clamshell', 'styrofoam', 'pvc'
    ]
  },

  glass: {
    key: 'glass',
    label: 'Glass Bottles & Cullet',
    facilityType: 'recycler',
    facilityTypeLabel: 'Glass Remanufacturing & Cullet Processing Plant',
    pathwayTitle: 'High-Temperature Cullet Melting & Remanufacturing',
    pathwayDescription: 'Crushed into uniform cullet, optically sorted by color (flint/clear, amber, green), and melted in high-efficiency regenerative furnaces for 100% circular glass container reproduction.',
    handlingGuidelines: [
      'Empty and rinse beverage and food jars; remove metal crowns and synthetic corks.',
      'Segregate by color where possible (Clear/Flint, Amber/Brown, Emerald Green).',
      'Strictly exclude ceramic plates, porcelain, window pane glass, and heat-resistant Pyrex.'
    ],
    co2FactorKg: 0.31, // kg CO2e avoided per kg recycled
    landfillDivertRate: 1.0,
    keywords: [
      'glass', 'cullet', 'bottle', 'bottles', 'jar', 'jars', 'amber', 'flint',
      'beverage', 'beer bottle', 'wine bottle', 'sauce bottle', 'broken glass', 'vial'
    ]
  },

  paper: {
    key: 'paper',
    label: 'Paperboard & Corrugated Cardboard',
    facilityType: 'recycler',
    facilityTypeLabel: 'Paper Pulping & Packaging Board Mill',
    pathwayTitle: 'Hydropulping & Recycled Linerboard Fabrication',
    pathwayDescription: 'Repulped in warm water slurry, de-inked, screened for contaminants, and re-pressed into circular corrugated linerboard and Kraft packaging boxes.',
    handlingGuidelines: [
      'Store in dry conditions; wet or mold-compromised cardboard cannot be pulped.',
      'Ensure free of heavy cooking oil, food grease, and wax-coated waterproof linings.',
      'Flatten all corrugated boxes, remove heavy plastic strapping, and bundle securely.'
    ],
    co2FactorKg: 1.05, // kg CO2e avoided per kg recycled
    landfillDivertRate: 1.0,
    keywords: [
      'paper', 'cardboard', 'carton', 'cartons', 'box', 'boxes', 'kraft',
      'corrugated', 'newspaper', 'documents', 'magazines', 'sheets', 'shredded paper',
      'paperboard', 'packing box'
    ]
  },

  metal: {
    key: 'metal',
    label: 'Ferrous & Non-Ferrous Scrap Metals',
    facilityType: 'recycler',
    facilityTypeLabel: 'Metal Smelting & Ingot Foundry',
    pathwayTitle: 'Electric Arc Smelting & Circular Ingot Casting',
    pathwayDescription: 'Magnetic and eddy-current separation segregates ferrous steel from aluminum; scrap is compacted and melted, saving up to 95% of virgin ore extraction energy.',
    handlingGuidelines: [
      'Rinse food and beverage cans to eliminate organic odor and pest attraction.',
      'Separate tin/steel food cans (magnetic) from aluminum beverage cans (non-magnetic).',
      'Crush empty cans to maximize volumetric storage and logistics payload density.'
    ],
    co2FactorKg: 4.20, // kg CO2e avoided per kg metal recycled
    landfillDivertRate: 1.0,
    keywords: [
      'metal', 'can', 'cans', 'tin', 'tins', 'aluminum', 'aluminium', 'steel',
      'scrap', 'foil', 'beverage can', 'canned food', 'drum', 'drums', 'ferrous',
      'brass', 'copper', 'iron'
    ]
  },

  organic: {
    key: 'organic',
    label: 'Organic Waste & Kitchen Scraps',
    facilityType: 'composting_facility',
    facilityTypeLabel: 'Commercial Composting & Biomethanation Facility',
    pathwayTitle: 'Thermophilic Windrow Composting & Bio-Energy Capture',
    pathwayDescription: 'Microbially digested under controlled aerobic or anaerobic conditions, averting landfill methane emission and generating nutrient-dense bio-fertilizer for local agriculture.',
    handlingGuidelines: [
      'Collect in designated ventilated or sealed organic containers with drain inserts.',
      'Strictly avoid plastic bags, twist ties, cling wraps, or chemical sanitizer residue.',
      'Schedule dispatch within 24–48 hours to prevent anaerobic souring and vector breeding.'
    ],
    co2FactorKg: 2.50, // kg CO2e avoided per kg diverted from anaerobic landfill
    landfillDivertRate: 1.0,
    keywords: [
      'organic', 'food scrap', 'scraps', 'spoiled', 'vegetable', 'vegetables',
      'peels', 'peeling', 'peelings', 'fruit', 'fruits', 'waste food', 'rotten',
      'kitchen waste', 'compost', 'coffee grounds', 'leftovers', 'plate waste',
      'cooked waste', 'tea waste', 'egg shells', 'trimming'
    ]
  },

  non_recyclable: {
    key: 'non_recyclable',
    label: 'Non-Recyclable General Residuals',
    facilityType: 'waste_management',
    facilityTypeLabel: 'Municipal Waste Management Authority',
    pathwayTitle: 'Engineered Sanitary Landfill & Safe Containment',
    pathwayDescription: 'Incompatible composite materials routed to engineered municipal landfills with geomembrane liners and leachate treatment systems to prevent ground contamination.',
    handlingGuidelines: [
      'Contain securely in heavy-duty commercial refuse bags to prevent spillages.',
      'Comply with municipal hazardous and bio-solid separation standards.',
      'Review operational procurement to substitute single-use composite materials with circular alternatives.'
    ],
    co2FactorKg: 0.0,
    landfillDivertRate: 0.0,
    keywords: [
      'non_recyclable', 'non recyclable', 'general waste', 'composite',
      'multi-layer', 'contaminated', 'landfill', 'trash', 'refuse', 'unusable',
      'rubber', 'ceramic', 'mirrors', 'soiled'
    ]
  }
};

/**
 * Robust quantity string parser converting various imperial & metric inputs to kilograms
 * Supports: kg, g, tons, bags, crates, bins
 */
function parseWasteWeightKg(quantityStr) {
  if (!quantityStr || typeof quantityStr !== 'string') return 0;
  const cleaned = quantityStr.trim().toLowerCase();

  // Pattern: <number> <unit>
  const match = cleaned.match(/^(\d+(?:\.\d+)?|\.\d+)\s*([a-z]+)?/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  if (isNaN(value) || value <= 0) return 0;

  const unit = match[2] || 'kg';

  switch (unit) {
    case 'g':
    case 'gram':
    case 'grams':
      return Number((value / 1000).toFixed(3));
    case 'ton':
    case 'tons':
    case 'tonne':
    case 'tonnes':
    case 't':
      return Number((value * 1000).toFixed(1));
    case 'bag':
    case 'bags':
      // Standard commercial solid waste bag ~15 kg
      return Number((value * 15).toFixed(1));
    case 'crate':
    case 'crates':
      // Standard produce/beverage crate ~20 kg
      return Number((value * 20).toFixed(1));
    case 'bin':
    case 'bins':
      // Standard utility waste bin ~40 kg
      return Number((value * 40).toFixed(1));
    case 'kg':
    case 'kgs':
    case 'kilo':
    case 'kilos':
    case 'kilogram':
    case 'kilograms':
    default:
      return Number(value.toFixed(2));
  }
}

/**
 * Smart Waste Classifier Algorithm
 * Classifies free-text descriptions, titles, and condition hints into one of the 6 circular streams.
 *
 * @param {string|object} input - Text description or payload object
 * @returns {object} Classification result with category, pathway, guidelines, and confidence
 */
function classifyWasteItem(input) {
  let textToAnalyze = '';
  let categoryHint = null;

  if (typeof input === 'string') {
    textToAnalyze = input.toLowerCase();
  } else if (input && typeof input === 'object') {
    textToAnalyze = [
      input.title || '',
      input.description || '',
      input.notes || '',
      input.specialInstructions || '',
      input.item || ''
    ].join(' ').toLowerCase();

    if (input.wasteCategory && WASTE_STREAMS[input.wasteCategory]) {
      categoryHint = input.wasteCategory;
    }
  }

  // Tokenize words
  const words = textToAnalyze.match(/[a-z0-9_]+/g) || [];
  const joinedText = ` ${words.join(' ')} `;

  const scores = {};
  const matchedTokens = {};

  Object.keys(WASTE_STREAMS).forEach((catKey) => {
    scores[catKey] = 0;
    matchedTokens[catKey] = [];

    const stream = WASTE_STREAMS[catKey];
    stream.keywords.forEach((keyword) => {
      // Check multi-word phrase or single word
      if (keyword.includes(' ')) {
        if (joinedText.includes(` ${keyword} `)) {
          scores[catKey] += 2.5; // Multi-word exact match gets high weight
          matchedTokens[catKey].push(keyword);
        }
      } else {
        if (words.includes(keyword)) {
          scores[catKey] += 1.0;
          matchedTokens[catKey].push(keyword);
        } else if (words.some((w) => w.startsWith(keyword) || w.endsWith(keyword))) {
          scores[catKey] += 0.5;
          matchedTokens[catKey].push(keyword);
        }
      }
    });
  });

  // If a category hint was explicitly provided, give it a positive baseline boost
  if (categoryHint && scores[categoryHint] !== undefined) {
    scores[categoryHint] += 2.0;
  }

  // Find best scoring category
  let bestCategory = 'organic'; // Default fallback for kitchen/food surplus
  let maxScore = -1;

  Object.keys(scores).forEach((catKey) => {
    if (scores[catKey] > maxScore) {
      maxScore = scores[catKey];
      bestCategory = catKey;
    }
  });

  // Calculate normalized confidence (between 0.50 and 0.98)
  let confidence = 0.65;
  if (maxScore >= 4.0) confidence = 0.98;
  else if (maxScore >= 2.5) confidence = 0.92;
  else if (maxScore >= 1.0) confidence = 0.82;
  else if (maxScore > 0) confidence = 0.72;

  const streamInfo = WASTE_STREAMS[bestCategory];

  return {
    category: bestCategory,
    categoryLabel: streamInfo.label,
    confidence: Number(confidence.toFixed(2)),
    matchedKeywords: Array.from(new Set(matchedTokens[bestCategory] || [])),
    facilityType: streamInfo.facilityType,
    facilityTypeLabel: streamInfo.facilityTypeLabel,
    pathwayTitle: streamInfo.pathwayTitle,
    pathwayDescription: streamInfo.pathwayDescription,
    handlingGuidelines: streamInfo.handlingGuidelines,
    co2FactorKg: streamInfo.co2FactorKg,
    landfillDivertRate: streamInfo.landfillDivertRate,
    scores
  };
}

/**
 * Calculates environmental impact metrics for a waste stream batch
 */
function calculateWasteEnvironmentalImpact(category, quantityStr) {
  const stream = WASTE_STREAMS[category] || WASTE_STREAMS.organic;
  const weightKg = parseWasteWeightKg(quantityStr);

  const divertedKg = Number((weightKg * stream.landfillDivertRate).toFixed(1));
  const co2eSavedKg = Number((divertedKg * stream.co2FactorKg).toFixed(2));

  // Equivalencies: EPA WARM factor (~21.77 kg CO2 absorbed per urban tree seedling grown for 10 years)
  const treeEquivalents = Number((co2eSavedKg / 21.77).toFixed(1));

  return {
    category: stream.key,
    categoryLabel: stream.label,
    weightKg,
    divertedKg,
    co2eSavedKg,
    treeEquivalents,
    co2FactorKg: stream.co2FactorKg,
    landfillDivertRate: stream.landfillDivertRate,
    pathwayTitle: stream.pathwayTitle
  };
}

/**
 * Evaluates and ranks eligible recycling/composting organizations for a given waste request
 *
 * @param {object} wasteRequest - Mongoose or plain object of WasteRequest
 * @param {Array} organizations - Array of Organization objects
 * @returns {Array} Ranked list of eligible collectors with proximity score & distance
 */
function rankEligibleCollectors(wasteRequest, organizations) {
  if (!wasteRequest || !Array.isArray(organizations)) return [];

  const requestCategory = wasteRequest.wasteCategory;
  const stream = WASTE_STREAMS[requestCategory] || WASTE_STREAMS.organic;
  const donorDistrict = wasteRequest.district || 'Colombo';

  // Filter organizations:
  // 1. Must be verified
  // 2. Must handle the wasteCategory in their materialTypesHandled OR have matching type
  const eligible = organizations.filter((org) => {
    if (org.verificationStatus !== 'verified') return false;

    // Type check
    const isRecyclerOrg = org.type === 'recycler' || org.type === 'composting_facility';
    if (!isRecyclerOrg) return false;

    // Handled materials check
    if (Array.isArray(org.materialTypesHandled) && org.materialTypesHandled.length > 0) {
      return org.materialTypesHandled.includes(requestCategory);
    }

    // If materialTypesHandled is empty, check facility type mapping
    if (requestCategory === 'organic' && org.type === 'composting_facility') return true;
    if (requestCategory !== 'organic' && org.type === 'recycler') return true;

    return false;
  });

  // Score each eligible collector by district proximity
  const ranked = eligible.map((org) => {
    const orgDistrict = org.district || 'Colombo';
    const distanceKm = getDistrictDistanceKm(donorDistrict, orgDistrict);

    // Proximity score: <= 5km -> 100, <= 25km -> 85, <= 60km -> 65, <= 120km -> 45, > 120km -> 25
    let proximityScore = 25;
    if (distanceKm <= 5) proximityScore = 100;
    else if (distanceKm <= 25) proximityScore = 85;
    else if (distanceKm <= 60) proximityScore = 65;
    else if (distanceKm <= 120) proximityScore = 45;

    // Same district bonus
    const isSameDistrict = donorDistrict.toLowerCase() === orgDistrict.toLowerCase();
    const finalScore = isSameDistrict ? Math.min(100, proximityScore + 10) : proximityScore;

    return {
      organizationId: org._id,
      name: org.name,
      type: org.type,
      district: orgDistrict,
      distanceKm: Number(distanceKm.toFixed(1)),
      isSameDistrict,
      matchScore: finalScore,
      materialTypesHandled: org.materialTypesHandled || [],
      registrationInfo: org.registrationInfo
    };
  });

  // Sort by matchScore descending, then distance ascending
  ranked.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.distanceKm - b.distanceKm;
  });

  return ranked;
}

module.exports = {
  WASTE_STREAMS,
  parseWasteWeightKg,
  classifyWasteItem,
  calculateWasteEnvironmentalImpact,
  rankEligibleCollectors
};
