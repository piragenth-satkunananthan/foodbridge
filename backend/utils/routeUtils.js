/**
 * Route & Geolocation Utilities for Module 4 (Volunteer Logistics & Route Tracking)
 * FoodBridge Platform - Sri Lanka Multi-District Logistics
 */

// Coordinates for the 25 administrative districts of Sri Lanka
const DISTRICT_COORDINATES = {
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Gampaha: { lat: 7.0840, lng: 79.9943 },
  Kalutara: { lat: 6.5854, lng: 79.9607 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Matale: { lat: 7.4675, lng: 80.6234 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
  Galle: { lat: 6.0535, lng: 80.2210 },
  Matara: { lat: 5.9549, lng: 80.5550 },
  Hambantota: { lat: 6.1429, lng: 81.1212 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kilinochchi: { lat: 9.3803, lng: 80.3770 },
  Mannar: { lat: 8.9810, lng: 79.9044 },
  Vavuniya: { lat: 8.7542, lng: 80.4982 },
  Mullaitivu: { lat: 9.2671, lng: 80.8142 },
  Batticaloa: { lat: 7.7310, lng: 81.6747 },
  Ampara: { lat: 7.2912, lng: 81.6724 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
  Kurunegala: { lat: 7.4863, lng: 80.3623 },
  Puttalam: { lat: 8.0408, lng: 79.8394 },
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0188 },
  Badulla: { lat: 6.9934, lng: 81.0550 },
  Monaragala: { lat: 6.8728, lng: 81.3507 },
  Ratnapura: { lat: 6.6828, lng: 80.4037 },
  Kegalle: { lat: 7.2513, lng: 80.3464 }
};

/**
 * Great-circle distance using Haversine formula (km)
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
 * Returns estimated transit distance (km) between two district names
 */
function getDistrictDistanceKm(districtA, districtB) {
  if (!districtA || !districtB) return 10.0;
  if (districtA.toLowerCase() === districtB.toLowerCase()) return 3.5; // Average local intra-city transit

  const coordA = DISTRICT_COORDINATES[districtA];
  const coordB = DISTRICT_COORDINATES[districtB];

  if (!coordA || !coordB) return 25.0;

  const straightLine = haversineDistance(coordA.lat, coordA.lng, coordB.lat, coordB.lng);
  // Apply a 1.25 road winding curvature factor
  return Math.round(straightLine * 1.25 * 10) / 10;
}

/**
 * Returns estimated delivery transit time in minutes
 */
function estimateTransitMinutes(distanceKm) {
  // Average commercial dispatch speed: 30 km/h + 10 mins loading/handover buffer
  const drivingTimeMins = (distanceKm / 30) * 60;
  return Math.round(drivingTimeMins + 10);
}

/**
 * Helper to calculate estimated meals or weight from quantity string
 */
function parseQuantityMetrics(quantityStr) {
  if (!quantityStr) return { meals: 0, kg: 0 };
  const str = String(quantityStr).toLowerCase().trim();

  // Match plates or meals
  const mealMatch = str.match(/(\d+(?:\.\d+)?)\s*(plates|meals|portions|packets|boxes)/);
  if (mealMatch) {
    const meals = parseFloat(mealMatch[1]);
    return { meals, kg: Math.round(meals * 0.4 * 10) / 10 }; // 0.4kg per meal
  }

  // Match kg or grams or tons
  const kgMatch = str.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    return { meals: Math.round(kg * 2.5), kg }; // 2.5 meals per kg
  }

  const tonMatch = str.match(/(\d+(?:\.\d+)?)\s*(ton|tons)/);
  if (tonMatch) {
    const kg = parseFloat(tonMatch[1]) * 1000;
    return { meals: Math.round(kg * 2.5), kg };
  }

  // Raw number fallback
  const rawNum = parseFloat(str);
  if (!isNaN(rawNum)) {
    return { meals: Math.round(rawNum), kg: Math.round(rawNum * 0.4 * 10) / 10 };
  }

  return { meals: 25, kg: 10 }; // Safe baseline fallback
}

module.exports = {
  DISTRICT_COORDINATES,
  haversineDistance,
  getDistrictDistanceKm,
  estimateTransitMinutes,
  parseQuantityMetrics
};
