/**
 * Distance and Proximity Utilities for FoodBridge Smart Matching Engine
 * Supports all 25 Sri Lankan administrative districts with centroid coordinates.
 */

const DISTRICT_COORDINATES = {
  // Western Province
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Gampaha: { lat: 7.0840, lng: 79.9943 },
  Kalutara: { lat: 6.5854, lng: 79.9607 },

  // Central Province
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Matale: { lat: 7.4675, lng: 80.6234 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },

  // Southern Province
  Galle: { lat: 6.0535, lng: 80.2210 },
  Matara: { lat: 5.9549, lng: 80.5550 },
  Hambantota: { lat: 6.1429, lng: 81.1212 },

  // Northern Province
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kilinochchi: { lat: 9.3803, lng: 80.3770 },
  Mannar: { lat: 8.9810, lng: 79.9044 },
  Vavuniya: { lat: 8.7542, lng: 80.4982 },
  Mullaitivu: { lat: 9.2671, lng: 80.8142 },

  // Eastern Province
  Batticaloa: { lat: 7.7310, lng: 81.6747 },
  Ampara: { lat: 7.2912, lng: 81.6724 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },

  // North Western Province
  Kurunegala: { lat: 7.4863, lng: 80.3623 },
  Puttalam: { lat: 8.0362, lng: 79.8283 },

  // North Central Province
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0188 },

  // Uva Province
  Badulla: { lat: 6.9934, lng: 81.0550 },
  Monaragala: { lat: 6.8728, lng: 81.3507 },

  // Sabaragamuwa Province
  Ratnapura: { lat: 6.6828, lng: 80.4037 },
  Kegalle: { lat: 7.2513, lng: 80.3464 }
};

/**
 * Standard Haversine distance between two geo-coordinates in kilometers.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates distance in kilometers between two districts.
 */
function getDistrictDistanceKm(districtA, districtB) {
  if (!districtA || !districtB) return 25; // fallback average distance
  if (districtA.toLowerCase() === districtB.toLowerCase()) {
    return 3.0; // intra-district transit distance
  }

  const coordsA = DISTRICT_COORDINATES[districtA] || DISTRICT_COORDINATES[normalizeDistrict(districtA)];
  const coordsB = DISTRICT_COORDINATES[districtB] || DISTRICT_COORDINATES[normalizeDistrict(districtB)];

  if (!coordsA || !coordsB) return 35; // default inter-district distance

  return haversineDistance(coordsA.lat, coordsA.lng, coordsB.lat, coordsB.lng);
}

function normalizeDistrict(name) {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  for (const district of Object.keys(DISTRICT_COORDINATES)) {
    if (district.toLowerCase() === clean) return district;
  }
  return null;
}

/**
 * Proximity Score (0 - 100) based on distance.
 */
function calculateProximityScore(distanceKm) {
  if (distanceKm <= 5) return 100;
  if (distanceKm <= 15) return 92;
  if (distanceKm <= 30) return 80;
  if (distanceKm <= 60) return 65;
  if (distanceKm <= 100) return 45;
  if (distanceKm <= 150) return 30;
  return Math.max(10, Math.round(100 - distanceKm * 0.5));
}

/**
 * Urgency Score (0 - 100) based on remaining time before pickup deadline.
 */
function calculateUrgencyScore(pickupDeadline) {
  const now = Date.now();
  const deadlineTime = new Date(pickupDeadline).getTime();
  const hoursRemaining = (deadlineTime - now) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return { score: 0, hoursRemaining: 0, urgencyLevel: 'expired' };
  if (hoursRemaining <= 2) return { score: 100, hoursRemaining, urgencyLevel: 'critical' };
  if (hoursRemaining <= 4) return { score: 90, hoursRemaining, urgencyLevel: 'high' };
  if (hoursRemaining <= 8) return { score: 75, hoursRemaining, urgencyLevel: 'medium' };
  if (hoursRemaining <= 16) return { score: 60, hoursRemaining, urgencyLevel: 'standard' };
  if (hoursRemaining <= 24) return { score: 45, hoursRemaining, urgencyLevel: 'flexible' };
  return { score: 30, hoursRemaining, urgencyLevel: 'relaxed' };
}

/**
 * Parse quantity helper for meal portion matching.
 */
function parseEstimatedPortions(quantityStr) {
  if (!quantityStr) return 20;
  const str = String(quantityStr).toLowerCase().trim();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 20;
  const num = parseFloat(match[1]);
  if (str.includes('kg') || str.includes('kilo')) {
    return Math.round(num * 2.5);
  }
  return Math.round(num);
}

/**
 * Storage compatibility score (0 - 100)
 */
function calculateStorageScore(storageCondition) {
  if (storageCondition === 'room_temperature') return 100; // easiest to handle
  if (storageCondition === 'refrigerated') return 85;
  if (storageCondition === 'frozen') return 75;
  return 80;
}

/**
 * Quantity suitability score (0 - 100)
 */
function calculateQuantityScore(estimatedPortions) {
  if (estimatedPortions >= 20 && estimatedPortions <= 150) return 100;
  if (estimatedPortions > 150) return 90;
  if (estimatedPortions >= 10) return 80;
  return 60;
}

/**
 * Computes composite Smart Match Score (0 - 100).
 * Weights:
 * - Proximity: 40%
 * - Urgency / Freshness: 35%
 * - Quantity / Capacity: 15%
 * - Storage condition: 10%
 */
function calculateSmartMatchScore({ donation, recipientDistrict }) {
  const distanceKm = getDistrictDistanceKm(donation.district, recipientDistrict);
  const proximityScore = calculateProximityScore(distanceKm);
  const urgencyInfo = calculateUrgencyScore(donation.pickupDeadline);
  const portions = parseEstimatedPortions(donation.quantity);
  const quantityScore = calculateQuantityScore(portions);
  const storageScore = calculateStorageScore(donation.storageCondition);

  if (urgencyInfo.hoursRemaining <= 0) {
    return {
      matchScore: 0,
      distanceKm,
      hoursRemaining: 0,
      urgencyLevel: 'expired',
      isExpired: true,
      breakdown: { proximityScore, urgencyScore: 0, quantityScore, storageScore }
    };
  }

  const compositeScore = Math.round(
    proximityScore * 0.40 +
    urgencyInfo.score * 0.35 +
    quantityScore * 0.15 +
    storageScore * 0.10
  );

  return {
    matchScore: Math.min(100, Math.max(0, compositeScore)),
    distanceKm,
    hoursRemaining: Math.round(urgencyInfo.hoursRemaining * 10) / 10,
    urgencyLevel: urgencyInfo.urgencyLevel,
    isExpired: false,
    estimatedPortions: portions,
    breakdown: {
      proximityScore,
      urgencyScore: urgencyInfo.score,
      quantityScore,
      storageScore
    }
  };
}

module.exports = {
  DISTRICT_COORDINATES,
  haversineDistance,
  getDistrictDistanceKm,
  calculateProximityScore,
  calculateUrgencyScore,
  calculateStorageScore,
  calculateQuantityScore,
  calculateSmartMatchScore,
  parseEstimatedPortions
};
