# API Client

## Overview
The single HTTP gateway for the whole SPA. Every backend call in the app funnels through `apiFetch`, which targets the `/api` base path, attaches a Bearer token read from `localStorage`, and normalises error responses. The same module also owns auth-token and cached-user persistence helpers, so session state has exactly one storage location.

## Interface
- Token/user storage: `getAuthToken`, `setAuthToken`, `removeAuthToken`, `getSavedUser`, `saveUser` [api/client.js:3-21].
- Core transport: `apiFetch(endpoint, options)` [api/client.js:23-42].
- Auth: `loginUser`, `registerUser`, `getMe` [api/client.js:48-62].
- Admin/governance: `fetchAdminStats`, `fetchOrganizations`, `fetchOrganizationDetails`, `verifyOrganization`, `fetchAllDonations`, `fetchAllWasteRequests`, `fetchAllPickups`, `fetchAllUsers`, `updateUserStatus`, `deleteUser`, `fetchReports` [api/client.js:68-120].
- Public impact & notifications: `fetchPublicImpact`, `fetchLiveFeed`, `fetchDistrictStats`, `snapshotImpact`, `fetchNotifications`, `markNotificationRead`, `markAllNotificationsRead` [api/client.js:126-139].
- Donor donations & waste: `fetchDonorStats`, `fetchDonations`, `fetchDonationById`, `createDonation`, `updateDonation`, `cancelDonation`, `fetchWasteRequests`, `createWasteRequest`, `cancelWasteRequest` [api/client.js:145-190].
- Recycler (Module 3): `fetchRecyclerFeed`, `fetchRecyclerClaims`, `fetchRecyclerStats`, `claimWasteRequest`, `cancelWasteClaim`, `confirmWasteRecycled`, `classifyWasteItem`, `fetchEligibleCollectorsForWaste` [api/client.js:196-238].
- Volunteer pickups (Module 4): `fetchOpenPickups`, `fetchMyActivePickups`, `fetchPickupHistory`, `fetchVolunteerStats`, `fetchPickupById`, `acceptPickupJob`, `updatePickupStatus`, `cancelPickupJob`, `updatePickupLocation` [api/client.js:245-283].
- Recipient matching (Module 2): `fetchNearbyDonations`, `fetchRecipientStats`, `fetchRecipientClaims`, `claimDonation`, `cancelDonationClaim`, `fetchRecipientsForDonation` plus `fetchWasteCertificate`, `confirmPickupReceipt` [api/client.js:289-326].

## Invariants
- `API_BASE` is the constant `'/api'`; every request URL is `` `${API_BASE}${endpoint}` `` [api/client.js:1,31].
- `Content-Type: application/json` is always sent; `Authorization: Bearer <token>` is added only when a token exists; caller `options.headers` merge last and can override [api/client.js:25-29].
- Non-OK responses throw `Error(errData.message || `Request failed with status ${response.status}`)`; a non-JSON error body falls back to `{}` [api/client.js:36-39]. Successful responses are returned as parsed JSON [api/client.js:41].
- `removeAuthToken` clears both `foodbridge_token` and `foodbridge_user`; `getSavedUser` returns `null` on missing or unparseable JSON [api/client.js:5-17].
- List endpoints that accept `params` append `?${query}` only when the serialised query is non-empty [api/client.js:70-73, 84-87, and siblings].
- Mutating calls use the explicit HTTP verbs shown in code: POST for login/register/create/claim/accept/classify/snapshot, PUT for verify/update/status/cancel-claim/confirm/location/read, DELETE for cancelDonation/cancelWasteRequest/deleteUser [api/client.js:48-326].

## Side Effects
- `localStorage` reads/writes/removes of `foodbridge_token` and `foodbridge_user` in the five storage helpers [api/client.js:3-21].
- Network: every exported function issues a `fetch()` to `/api/*` (auth, admin, impact, notifications, donations, waste, recycler, pickups, match) via `apiFetch` [api/client.js:23-326].

## Verification
- Run: `cd frontend && npm test && npm run build`
