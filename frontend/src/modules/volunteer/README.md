# Volunteer Module

## Overview
Volunteer courier portal (`/volunteer/*`, Module 4). `VolunteerDashboard` is the only component in this package: it lists the volunteer's active mission with a 4-step pipeline, browsable open pickups (district-filtered), a route/GPS estimate view, and delivery history, with accept / advance-status / release actions.

## Interface
- `VolunteerDashboard` (default) [modules/volunteer/VolunteerDashboard.jsx:46] — tabs `active` / `available` / `route` / `history` [modules/volunteer/VolunteerDashboard.jsx:50]; loads `fetchOpenPickups({district})`, `fetchMyActivePickups`, `fetchPickupHistory`, `fetchVolunteerStats` via `Promise.all` [modules/volunteer/VolunteerDashboard.jsx:87-97]; actions `acceptPickupJob`, `updatePickupStatus`, `cancelPickupJob` [modules/volunteer/VolunteerDashboard.jsx:112-169].
- `SRI_LANKA_DISTRICTS` includes the extra `'all'` entry for the district filter [modules/volunteer/VolunteerDashboard.jsx:37-44].

## Invariants
- Pipeline steps: `pickup_scheduled` → `picked_up` → `delivered_or_recycled` → `completed` [modules/volunteer/VolunteerDashboard.jsx:386-418].
- Status advancement sends `updatePickupStatus(jobId, { status, proofNotes: notes, note: notes })` [modules/volunteer/VolunteerDashboard.jsx:131-150]; the "Confirm Surplus Picked Up" button is only available at `pickup_scheduled` (target `picked_up`), and arrival/handover opens a modal targeting `delivered_or_recycled` only from `picked_up` [modules/volunteer/VolunteerDashboard.jsx:465-497].
- "Release Job" is only offered at `pickup_scheduled` and requires `window.confirm`; cancellation sends reason `'Released by volunteer'` [modules/volunteer/VolunteerDashboard.jsx:465-473,153-169].
- `currentActiveJob` is the first element of the active jobs array [modules/volunteer/VolunteerDashboard.jsx:171].
- Toast notifications auto-dismiss after 4500ms [modules/volunteer/VolunteerDashboard.jsx:75-78].
- Route view states distances/times come from district logistics centroids (`routeDetails.routeDistanceKm`, `routeDetails.transitTimeMinutes`) [modules/volunteer/VolunteerDashboard.jsx:752-754,785-798].
- Donor and recipient contact buttons use `tel:` links [modules/volunteer/VolunteerDashboard.jsx:547-554,589-597].

## Side Effects
- Network: open pickups, my-active pickups, history, stats, accept job, status update, cancel job (via `../../api/client`).
- `window.confirm` before releasing a job [modules/volunteer/VolunteerDashboard.jsx:154].
- Timers: 4.5s toast auto-dismiss [modules/volunteer/VolunteerDashboard.jsx:77]; `console.error` on load failure [modules/volunteer/VolunteerDashboard.jsx:99].

## Verification
- Run: `cd frontend && npm test && npm run build`
