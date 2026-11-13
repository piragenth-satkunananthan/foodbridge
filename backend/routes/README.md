# Routes

## Overview
Express routers that mount the API surface under `/api/*` (mounting happens in server.js). Each router wires HTTP methods to controllers, applying `protect` (JWT) and, where needed, `authorize(...)` role gates. Impact routes are the only fully public router.

## Interface
- `authRoutes` — [routes/authRoutes.js] `POST /register` → registerUser, `POST /login` → loginUser (public); `GET /me` → protect + getMe.
- `adminRoutes` — [routes/adminRoutes.js] router.use(protect, authorize('admin')); `GET /stats`, `GET /organizations`, `GET /organizations/:id`, `PUT /organizations/:id/verify`, `GET /donations`, `GET /waste-requests`, `GET /pickups`, `GET /users`, `PUT /users/:id/status`, `DELETE /users/:id`, `GET /reports`, `POST /impact/snapshot`.
- `donationRoutes` — [routes/donationRoutes.js] router.use(protect); `GET /stats` (any authenticated role), `POST /`, `PUT /:id`, `DELETE /:id`, `PUT /:id/cancel` restricted to `donor`; `GET /`, `GET /:id` for any authenticated user.
- `wasteRoutes` — [routes/wasteRoutes.js] router.use(protect); `POST /classify` (authenticated); recycler hub `GET /recycler/feed`, `GET /recycler/claims`, `GET /recycler/stats`, `POST /:id/claim`, `PUT /:id/cancel-claim`, `PUT /:id/confirm-recycled` restricted to `recycler`/`admin`; `GET /:id/certificate`, `GET /:id/collectors` (authenticated); donor CRUD `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `PUT /:id/cancel` with `donor` gate on writes.
- `matchRoutes` — [routes/matchRoutes.js] `GET /nearby-donations`, `GET /stats`, `GET /my-claims`, `POST /:donationId/claim`, `PUT /:donationId/cancel-claim` restricted to `recipient`/`admin`; `GET /recipients-for-donation/:donationId` for any authenticated user.
- `pickupRoutes` — [routes/pickupRoutes.js] router.use(protect); volunteer/admin gates on `GET /open`, `GET /my-active`, `GET /history`, `GET /stats`, `POST /:id/accept`, `PUT /:id/status`, `PUT /:id/cancel`, `PUT /:id/location`; `PUT /:id/confirm-receipt` for `recipient`/`recycler`/`admin`; `GET /:id` for any participant.
- `organizationRoutes` — [routes/organizationRoutes.js] router.use(protect, authorize('recipient','recycler')); `GET /me`, `PUT /me`, `POST /`.
- `complaintRoutes` — [routes/complaintRoutes.js] router.use(protect); `POST /`, `GET /` for any authenticated user; `PUT /:id` restricted to `admin`.
- `notificationRoutes` — [routes/notificationRoutes.js] router.use(protect); `GET /`, `PUT /read-all`, `PUT /:id/read`, `DELETE /:id`.
- `impactRoutes` — [routes/impactRoutes.js] public (no protect): `GET /`, `GET /live-feed`, `GET /district-stats`.
- `surplusRoutes` — [routes/surplusRoutes.js] `POST /` with protect + authorize('donor'); classifies `itemType` food/material (edible→donation, inedible food→organic wasteRequest, material→classifyWasteItem) and delegates to createPosting; returns 422 when classification requires confirmation.

## Invariants
- Every router except `impactRoutes` applies `protect` to all its routes [routes/*:router.use(protect)].
- [routes/adminRoutes.js] every route additionally requires the `admin` role.
- [routes/organizationRoutes.js] all routes require `recipient` or `recycler` role.
- [routes/surplusRoutes.js] `itemType` must be `food` or `material`; food must declare `condition` `edible`/`inedible`; inedible food is forced to `wasteCategory: 'organic'` and food-only fields are stripped; material classification requiring confirmation returns HTTP 422.

## Side Effects
- Route handlers trigger controller side effects (database reads/writes, notifications) — see controllers; routers themselves only register handlers (no I/O at require time).

## Verification
- Run: `cd backend && npm run test:all`
