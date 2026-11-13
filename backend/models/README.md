# Models

## Overview
Mongoose schemas defining the FoodBridge persistence layer: users and organizations, food donations and waste requests (the two "posting" kinds), pickups that link a source post to a volunteer and a receiving organization, plus notifications, complaints, and monthly impact snapshots. All schemas use `timestamps: true` and carry an `isDemo` flag (except Complaint/Notification) so demo data can be excluded from reports.

## Interface
- `User` — [models/User.js] fields: name, email (unique, lowercase, trimmed), password, role enum `['donor','recipient','volunteer','recycler','admin']`, district, contactNumber, organization (ref Organization), verificationStatus enum `['pending','verified','rejected']` (defaults to `pending` for recipient/recycler, else `verified`), status enum `['active','suspended']` default `active`, isDemo.
- `Organization` — [models/Organization.js] fields: name, type enum `['ngo','charity','shelter','recycler','composting_facility','waste_management']`, registrationInfo, district, linkedUser (ref User, required), capacityKg (min 0), reservedKg (min 0, default 0), accepting (default true), serviceDistricts, foodTypes, storageConditions enum `['refrigerated','room_temperature','frozen']`, materialTypesHandled enum `['plastic','glass','paper','metal','organic','non_recyclable']`, city/area/address, location {lat,lng}, verificationStatus/Remarks/At/By, isDemo. Unique partial index on `linkedUser`.
- `Donation` — [models/Donation.js] fields: donor (ref User, required), foodType, quantity (free-text string, e.g. "20 kg"), preparedTime, pickupDeadline, storageCondition enum `['refrigerated','room_temperature','frozen']`, district, specialInstructions, photo, city/area/address, location, quantityValue/quantityUnit, availableTime, status enum `['posted','matched','pickup_scheduled','picked_up','delivered','completed','cancelled','expired']` default `posted`, matchedRecipient (ref Organization), activePickup (ref Pickup), completedAt, statusHistory[], isDemo.
- `WasteRequest` — [models/WasteRequest.js] same posting shape as Donation but with wasteCategory enum `['plastic','glass','paper','metal','organic','non_recyclable']`, matchedCollector (ref Organization), processingOutcome enum `['recycled','composted','disposed']`, processingNotes, and status enum additionally including `['recycled','composted','disposed']`.
- `Pickup` — [models/Pickup.js] fields: exactly one of `donation`/`wasteRequest` (enforced by pre-validate hook), volunteer (ref User), receivingOrganization (ref Organization, required), statusPipeline enum `['posted','matched','pickup_scheduled','picked_up','delivered_or_recycled','completed','cancelled','expired','rejected']` default `posted`, active (default true), reservedKg, sourceSnapshot (Mixed), statusHistory[], routeLocation {lat,lng}, locationUpdatedAt, proofNotes, deliveryNotes, processingOutcome, receivedBy (ref User), completionConfirmedAt, isDemo. Unique partial indexes ensure at most one active pickup per donation and per wasteRequest.
- `Notification` — [models/Notification.js] recipientUser (ref User, required), message, relatedType enum `['donation','wasteRequest','pickup','organization','system']` default `system`, relatedId, readStatus (default false).
- `Complaint` — [models/Complaint.js] reporter (ref User, required), subject, description, relatedType enum `['donation','wasteRequest','pickup','user','system']` default `system`, relatedId, status enum `['open','investigating','resolved','dismissed']` default `open`, history[] of {status, note, actor, timestamp}.
- `ImpactRecord` — [models/ImpactRecord.js] period (required, e.g. "2026-09"), mealsRescued, kgRecycled {plastic,glass,paper,metal}, kgOrganicDiverted, districtsCovered[], isDemo; unique index on `{ period, isDemo }`.

## Invariants
- [models/Pickup.js:pre('validate')] a Pickup is invalid unless exactly one of `donation` / `wasteRequest` is set (`Exactly one source is required`).
- [models/Pickup.js] at most one active Pickup per donation and per wasteRequest (unique partial indexes on `donation`/`wasteRequest` with `active: true`).
- [models/Organization.js] at most one Organization per linkedUser (unique partial index).
- [models/ImpactRecord.js] at most one ImpactRecord per `{ period, isDemo }`.
- [models/User.js] email is unique; verificationStatus defaults to `pending` only for `recipient`/`recycler` roles, otherwise `verified`.
- [models/Donation.js] / [models/WasteRequest.js] status starts at `posted`; `completedAt` defaults to null.
- Enum-constrained fields (role, status, wasteCategory, storageCondition, materialTypesHandled, processingOutcome, relatedType, statusPipeline) reject values outside their lists via mongoose validation.

## Side Effects
- Schema/index definitions only take effect on database access: mongoose connects and creates indexes on model use; no network or disk I/O happens at require time beyond module loading.

## Verification
- Run: `cd backend && npm run test:all`
