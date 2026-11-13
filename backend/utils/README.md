# Utils

## Overview
Pure-ish helper modules shared across controllers and services: domain validation/error helpers, quantity parsing, transaction wrapper, distance/matching math, route estimation, waste classification, pickup history shaping, and notification creation.

## Interface
- [utils/domain.js] `DomainError` (Error with `.status`), `fail(status, message)` (throws DomainError), `sameId(a, b)`, `endpoint(handler)` (async wrapper forwarding errors to `next`), `district(value)` (case-insensitive match against DISTRICT_COORDINATES keys, canonical casing returned), `text(value, name, max=2000)` (trimmed non-empty string), `coordinates(value)` ({lat,lng} with |lat|≤90, |lng|≤180, null allowed), `pagination(query)` ({page, limit, skip}; limit 1–100), `literalRegex(value)` (regex-escaped search text ≤100 chars).
- [utils/quantity.js] `parseQuantity(value)` parses "<amount> <unit>" strings; units: kg/g/tonne (mass) and portion aliases (plate/meals/…) with portion = 0.4 kg estimated; returns `{amount, unit, kg, meals, estimatedWeight}` or null; `meals` = portions count for portion units else round(kg×2.5); `parseMealsCount(value)`, `parseWeightKg(value)` (0 for estimated/portion weights).
- [utils/transaction.js] `transaction(work)` — runs `work(session)` inside `mongoose.startSession()` + `session.withTransaction`; maps MongoDB error code 20/IllegalOperation to DomainError 503 "requires MongoDB configured as a replica set"; always ends the session.
- [utils/distanceUtils.js] `DISTRICT_COORDINATES` (25 Sri Lankan district centroids), `haversineDistance(lat1,lon1,lat2,lon2)` (km, R=6371, rounded to 0.1), `getDistrictDistanceKm(a,b)` (3.0 same district, 25 fallback if either missing, 35 if unknown names), `calculateProximityScore(distanceKm)`, `calculateUrgencyScore(pickupDeadline)` → {score, hoursRemaining, urgencyLevel}, `calculateStorageScore`, `calculateQuantityScore`, `calculateSmartMatchScore({donation, recipientDistrict, organization})` → {matchScore (0–100, weighted 40% proximity / 35% urgency / 15% quantity / 10% storage), distanceKm, hoursRemaining, urgencyLevel, isExpired, estimatedPortions, breakdown}, `parseEstimatedPortions(value)`.
- [utils/routeUtils.js] duplicate `DISTRICT_COORDINATES` table, `haversineDistance`, `getDistrictDistanceKm(a,b)` (3.5 same district, 10.0 missing, 25.0 unknown, ×1.25 road-winding factor otherwise), `estimateTransitMinutes(distanceKm)` (30 km/h + 10 min buffer), `parseQuantityMetrics(value)` → {meals, kg}.
- [utils/wasteClassifier.js] `WASTE_STREAMS` (6 categories with label, facilityType, keywords, pathwayTitle, landfillDivertRate 1 except non_recyclable=0, co2FactorKg null), `classifyWasteItem(input)` (keyword rules; hazardous keywords battery/medical/chemical/hazardous → requiresConfirmation; exactly one category required, else requiresConfirmation with candidates), `calculateWasteEnvironmentalImpact(category, quantity)` (weightKg from parseWeightKg, divertedKg, co2eSavedKg/treeEquivalents null — "No validated emissions model configured"), `rankEligibleCollectors(post, organizations)` (eligibility filter, matchScore = max(0, 100 − distanceKm), sorted by distance), `parseWasteWeightKg` = parseWeightKg.
- [utils/notificationService.js] `createNotification({recipientUser, message, relatedType='system', relatedId=null})` (returns null on error), `sendBulkNotifications(userIds, message, relatedType, relatedId)` (insertMany, returns [] on error), `queueNotifications(userIds, message, relatedType, relatedId, session)` (deduped insertMany with session; no-op when no recipients).
- [utils/pickupHistory.js] `snapshotSource(post)` (copies a fixed allowlist of post fields into a plain object), `historicalPickup(doc)` (for terminal pickups — cancelled/expired/rejected/completed — replaces the source ref with the sourceSnapshot plus terminal status, or just the source _id when no snapshot exists).
- [utils/impactMetrics.js] re-exports `require('./quantity')` (alias module).

## Invariants
- [utils/quantity.js:parseQuantity] amount must be finite, > 0, ≤ 1e9; unknown unit → null; portion units are flagged `estimatedWeight: true` and never count as measured kg in parseWeightKg.
- [utils/domain.js:district] unknown district → fail(400, 'Unknown district'); [utils/domain.js:pagination] limit must be an integer 1–100.
- [utils/distanceUtils.js:calculateSmartMatchScore] expired deadline (hoursRemaining ≤ 0) → matchScore 0, isExpired true.
- [utils/wasteClassifier.js] classification is deterministic keyword-based; co2FactorKg/co2eSavedKg/treeEquivalents are always null (no validated emissions model); non_recyclable has landfillDivertRate 0.
- [utils/transaction.js] non-replica-set MongoDB (code 20 / IllegalOperation) → DomainError 503.
- [utils/notificationService.js] createNotification/sendBulkNotifications swallow errors (console.error + null/[]) so notification failures never break the main operation; queueNotifications runs in the caller's transaction session and commits with it.

## Side Effects
- [utils/notificationService.js] writes Notification documents to MongoDB (createNotification, sendBulkNotifications, queueNotifications) and logs errors to console.
- [utils/transaction.js] starts/ends mongoose sessions and opens transactions (requires a replica set).
- Other modules are pure computation; no I/O at require time.

## Verification
- Run: `cd backend && npm run test:all`
