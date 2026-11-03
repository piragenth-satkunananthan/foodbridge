# Backend workflow contract

## Runtime and rollout

Node 20.19+ and MongoDB replica-set transactions are required. The Compose files configure a single-member replica set, suitable for this application's existing single-node deployment; this is not high availability. Run `npm ci` in `backend/`. `MONGO_URI` and `JWT_SECRET` must be configured. Database connection failures stop startup rather than falling back to another database.

Before deploying against existing data, back it up and run `npm run db:check` from `backend/` with the intended database configuration. This is a read-only count report and exits nonzero when reconciliation is required. Do not bypass reported duplicate allocations or infer receipt timestamps, organization capacity or demo provenance. Existing active pickups without `active` must be reconciled against their source before marking active and building the unique indexes. Reserve the actual outstanding quantity on the organization. Existing records lacking completion confirmation do not contribute to public confirmed impact. Organizations must submit capacity and supported storage/material settings and be reverified. No migration has been applied to existing project or deployed data.

## Organization and governance

- `POST /api/auth/register`: donor, recipient, recycler or volunteer; admin cannot self-register. Registration returns a JWT. Passwords require at least eight characters and at most 72 UTF-8 bytes.
- `GET /api/organizations/me`: own profile.
- `PUT /api/organizations/me` (also `POST /api/organizations`): submit a complete profile. Required: name, type, registrationInfo, district, capacityKg. Recipients declare storageConditions; collectors declare materialTypesHandled. Optional: serviceDistricts, foodTypes, city, area, address, location `{lat,lng}`, accepting. Edits reset verification; edits while capacity is reserved are blocked.
- `PUT /api/admin/organizations/:id/verify`: admin verifies or rejects. Organization and user status change together.
- `POST /api/complaints`: subject, description, optional relatedType/relatedId.
- `GET /api/complaints`: own complaints; administrators see all.
- `PUT /api/complaints/:id`: admin status and resolution note; history is retained.
- Existing admin delete-user endpoint disables the account while preserving referenced history.

## Posting and classification

Existing `/api/donations` and `/api/waste` donor CRUD endpoints remain. Both accept quantity, district, availableTime, pickupDeadline, specialInstructions, photo URL and optional location, city, area and address. Food also requires foodType, preparedTime and storageCondition; waste requires wasteCategory. Food preparation must precede availability and the deadline. Editing revalidates the entire resulting record. Only unclaimed posts may be edited/cancelled.

Quantity is still accepted as a string for existing clients. Explicit mass units are kg, g and tonnes (with documented aliases in quantity.js); food also accepts plates/meals/portions/packets/boxes as declared portions. Numeric amount and normalized unit are stored alongside the string. Container counts such as bags/crates do not establish weight. Meal estimates use 2.5 meals/kg; portion-to-weight estimates use 0.4 kg/portion. Neither is a measurement.

`POST /api/surplus` provides one branching workflow. Add `itemType: food` and `condition: edible|inedible` to posting fields. Edible food becomes a donation; inedible food becomes organic waste. Material posts use `itemType: material` with description or explicit wasteCategory. Unknown/mixed materials return 422 for clarification. `POST /api/waste/classify` previews deterministic category rules. Classification does not establish food safety or issue compliance certification.

No cloud image provider is configured. Existing HTTP(S) photo URLs work. Upload credentials/storage integration and a road-routing provider remain external configuration dependencies; no fabricated upload or navigation service is returned.

## Claims and capacity

Food: `POST /api/match/:donationId/claim`, `PUT /api/match/:donationId/cancel-claim`, `GET /api/match/my-claims`.

Waste: `POST /api/waste/:id/claim`, `PUT /api/waste/:id/cancel-claim`, `GET /api/waste/recycler/claims`.

Claims reserve the entire batch. Partial allocations are not supported. The organization must be verified, active and accepting, with sufficient unreserved capacity and compatible service area, storage/food preferences or waste material/pathway. Distance and transport time are estimates: coordinates produce straight-line distances, otherwise district estimates are used. A time buffer is checked before allocation. Claim and pickup writes share a transaction; a source has at most one active pickup. Cancellation is allowed before collection, releases capacity and preserves the closed pickup in history.

## Pickup and receipt

- `POST /api/pickups/:id/accept`: volunteer accepts an unassigned matched job.
- `PUT /api/pickups/:id/status`: assigned volunteer/admin records picked_up, then delivered_or_recycled. Collection must be within the availability window. Arrival is not processing or confirmed receipt.
- `PUT /api/pickups/:id/location`: assigned volunteer/admin only; numeric valid coordinates. No GPS location is fabricated from district coordinates.
- `PUT /api/pickups/:id/cancel`: release a scheduled assignment before collection.
- `PUT /api/pickups/:id/confirm-receipt`: receiving organization confirms accepted true/false. Rejection needs a note and closes the attempt without impact. Admin confirmation needs an audit note. Waste acceptance also requires processingOutcome and processingNotes after processing: recycled for plastic/glass/paper/metal, composted for organic, disposed for non-recyclable.
- `PUT /api/waste/:id/confirm-recycled`: compatibility endpoint for the same receipt operation, returning a persisted processing record reference, not an ESG/ISO certificate.

The pipeline is matched -> pickup_scheduled -> picked_up -> delivered_or_recycled -> completed. Cancelled/expired/rejected attempts are terminal and retained. Overdue uncollected sources and pickups expire together. In-transit jobs are retained for actual recipient acceptance/rejection. Participant-only detail endpoints contain contact information; the volunteer open board omits contact details.

Existing frontend callers that complete pickups as a courier or request the old synthetic recycling certificate need UI updates in a later frontend task. Frontend implementation was explicitly excluded from this work.

## Reporting and tests

Public impact counts confirmed completed non-demo activity. Non-recyclable disposal contributes no recycled/diverted kilograms. CO2/tree equivalents are null because no validated emissions model is configured. Admin period outcomes use completedAt; post counts use createdAt. Inclusive date-only report bounds are interpreted in UTC. Monthly snapshots are cumulative and may only be recorded for the current month.

`npm test` runs unit/schema checks. `npm run test:api` creates and removes its own disposable Docker MongoDB replica set and runs real HTTP tests. `npm run test:all` runs both and is the backend CI gate. Tests require a running Docker daemon and the mongo image; project databases are never used. Module scripts run the corresponding HTTP suites.

Demo seeding is destructive and guarded: it requires ALLOW_DEMO_SEED=true and a database name containing demo, test or local. Demo users, organizations, posts, pickups and snapshots are marked and excluded from public real-activity reporting. Previously seeded data has no trustworthy provenance marker and requires operator review.
