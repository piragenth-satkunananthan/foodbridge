# Services

## Overview
Business-logic services shared by controllers: posting lifecycle (create/edit/cancel donations and waste requests), eligibility and distance rules for matching, allocation (claim/release) with capacity reservation, the pickup pipeline state machine (accept → picked_up → delivered_or_recycled → completed/rejected), and a cron scheduler for expiry and monthly impact snapshots. All multi-document mutations run inside MongoDB transactions via utils/transaction.

## Interface
- [services/postingService.js] `validatePosting(body, kind, existing?)`, `createPosting(body, user, kind)`, `changePosting(id, user, kind, body, cancel?)`, `canReadPost(post, user, kind)`, `notifyPosted(post, kind, session)`, `pickupHistoryFilter(post, user, kind)`; internal `modelFor(kind)` maps 'donation'→Donation, otherwise WasteRequest; `kind` is always 'donation' or 'wasteRequest'.
- [services/eligibilityService.js] `organizationFor(user, session?)` (fails 403 unless the linked org exists, is verified, accepting, and its owner is active), `eligibility(post, org, kind)` returning `{eligible, reason, distanceKm, distanceBasis, estimatedTransitMinutes, weightKg, estimatedWeight}`, `distanceFor(post, org)` (haversine on coordinates when both sides have lat/lng, else district estimate).
- [services/allocationService.js] `claim(id, user, kind)`, `cancelClaim(id, user, kind, reason?)`, `releaseCapacity(pickup, session)`, `modelFor(kind)`, `matchField(kind)` ('matchedRecipient' for donation, 'matchedCollector' otherwise).
- [services/pickupService.js] `accept(id, user)`, `advance(id, user, body)`, `confirmReceipt(id, user, body?)`, `cancelAssignment(id, user, body?)`, `updateLocation(id, user, body)`, `expireOverdue()`.
- [services/cronService.js] `initCronJobs()`, `runPeriodicFreshnessCheck()`, `runMonthlyImpactSnapshot()`.

## Invariants
- [services/postingService.js:validatePosting] rejects unknown fields; quantity must parse via parseQuantity with a positive amount and supported unit (waste requests reject estimated weights); pickupDeadline must be in the future; availableTime defaults to now (or preparedTime for donations); preparedTime must precede availableTime and pickupDeadline; donation storageCondition must be one of refrigerated/room_temperature/frozen; wasteCategory must be one of the six material categories; photo must be an http(s) URL; specialInstructions ≤ 2000 chars.
- [services/postingService.js:changePosting] only the donor's own posts can be edited, and only while status is 'posted' (409 otherwise); cancel sets status 'cancelled'.
- [services/postingService.js:canReadPost] read access = admin, donor, matched organization, or a volunteer with a non-cancelled pickup on the post.
- [services/eligibilityService.js:eligibility] eligibility checks, in order: org verified+accepting; measured quantity (no estimated weight for waste); capacity (q.kg ≤ capacityKg − reservedKg); serviceDistricts containment; for donations org type ∈ {ngo,charity,shelter}, storageConditions includes post.storageCondition, foodTypes match (case-insensitive); for waste the org type must match the category pathway (organic→composting_facility, non_recyclable→waste_management, else recycler) and materialTypesHandled includes the category; and there must be enough time before pickupDeadline for the estimated transit (distance×1.25 km at 30 km/h + 10 min).
- [services/allocationService.js:claim] post must be 'posted' (409 if claimed/closed), donor active, eligibility must pass; creates an active Pickup with statusPipeline 'matched', sourceSnapshot, reservedKg = weightKg; sets post.status 'matched', matched field, activePickup; increments org.reservedKg; notifies donor, claimer, and district volunteers.
- [services/allocationService.js:cancelClaim] only the claiming org (or admin) may release; only while post status ∈ {matched, pickup_scheduled}; deactivates the pickup, releases reservedKg, and reverts post to 'posted' or 'expired' if the deadline passed.
- [services/pickupService.js:accept] only when pickup is active, statusPipeline 'matched', unassigned, source 'matched', deadline not passed, receiving org verified/active, donor active; sets volunteer and source.status 'pickup_scheduled'.
- [services/pickupService.js:advance] only the assigned volunteer (or admin); only forward transitions picked_up (from pickup_scheduled) and delivered_or_recycled (from picked_up); collection must be within [availableTime, pickupDeadline]; sets source.status picked_up/delivered.
- [services/pickupService.js:confirmReceipt] only the receiving organization (or admin, which requires a note); requires pickup at delivered_or_recycled and source 'delivered'; accepted must be boolean, rejection requires a note; for waste the processingOutcome is forced by category (organic→composted, non_recyclable→disposed, else recycled); on accept sets completedAt, status 'completed', deactivates pickup, releases capacity; on reject status 'cancelled'.
- [services/pickupService.js:cancelAssignment] only assigned volunteer, only from pickup_scheduled, and only before the deadline; creates a replacement 'matched' pickup and points source.activePickup at it.
- [services/pickupService.js:expireOverdue] expires posted/matched/pickup_scheduled sources past pickupDeadline, deactivating their active pickups (only matched/pickup_scheduled ones) and releasing capacity.
- [services/cronService.js:initCronJobs] runs both jobs once 5 s after startup, then every 15 minutes; interval is unref'd so tests can exit cleanly.

## Side Effects
- All services perform MongoDB reads/writes inside transactions ([utils/transaction.js]) and send notifications via queueNotifications ([utils/notificationService.js]).
- [services/cronService.js] sets real timers (setTimeout/setInterval) and writes ImpactRecord snapshots + expires overdue posts; logs errors to console.

## Verification
- Run: `cd backend && npm run test:all`
