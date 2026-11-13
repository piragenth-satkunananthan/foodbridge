# Donor Module

## Overview
Commercial donor portal (`/donor/*`, Module 1). `DonorDashboard` lists the donor's active food postings, waste requests, and history with KPI counters, and hosts the create/edit/details modals. `NewSurplusModal` is a 4-step wizard that posts either an edible-food donation or a waste batch.

## Interface
- `DonorDashboard` (default) [modules/donor/DonorDashboard.jsx:18] — tabs `postings` / `waste` / `history` [modules/donor/DonorDashboard.jsx:20]; loads `fetchDonorStats` + `fetchDonations` + `fetchWasteRequests` [modules/donor/DonorDashboard.jsx:50-74].
- `NewSurplusModal` (default) [modules/donor/NewSurplusModal.jsx:16] — 4-step wizard (`step` 1–4); `postType` `'food' | 'waste'` [modules/donor/NewSurplusModal.jsx:18]; submits `createDonation` or `createWasteRequest` [modules/donor/NewSurplusModal.jsx:87-129].
- `EditDonationModal` (default) [modules/donor/EditDonationModal.jsx:13] — pre-filled form saving via `updateDonation(donation._id, {...})` [modules/donor/EditDonationModal.jsx:34-42].
- `DonationDetailsModal` (default) [modules/donor/DonationDetailsModal.jsx:16] — loads `fetchDonationById`, renders the 5-stage pipeline, cancel/edit actions [modules/donor/DonationDetailsModal.jsx:8-53].

## Invariants
- History tab = donations with status in `['delivered','completed','cancelled','expired']`; active list (filter `all`) = `['posted','matched','pickup_scheduled','picked_up']` [modules/donor/DonorDashboard.jsx:129-132].
- Edit and cancel buttons render only when `status === 'posted'` (donations) or `status === 'posted'` (waste) [modules/donor/DonorDashboard.jsx:412,506].
- Both cancel paths require `window.confirm` [modules/donor/DonorDashboard.jsx:88,99]; failures surface via `alert` [modules/donor/DonorDashboard.jsx:93,104].
- `NewSurplusModal` step validation: step 2 requires `foodType`+quantity for food, `wasteCategory`+quantity for waste [modules/donor/NewSurplusModal.jsx:60-66]; step 3 requires district and a `pickupDeadline` strictly in the future [modules/donor/NewSurplusModal.jsx:70-82].
- Food payload fields: `foodType, quantity ("<value> <unit>"), preparedTime (ISO), storageCondition, pickupDeadline (ISO), district, specialInstructions, optional photo` [modules/donor/NewSurplusModal.jsx:96-107]; waste payload: `wasteCategory, quantity, district, pickupDeadline, optional photo` [modules/donor/NewSurplusModal.jsx:110-119].
- Units: food offers kg/plates/portions/boxes/liters; waste offers kg/bags/bins/crates [modules/donor/NewSurplusModal.jsx:354-359,437-441]; districts list all 25 [modules/donor/NewSurplusModal.jsx:8-14]; `storageCondition` defaults to `refrigerated` [modules/donor/NewSurplusModal.jsx:33].
- `DonationDetailsModal` pipeline stages are posted → matched → pickup_scheduled → picked_up → delivered/completed [modules/donor/DonationDetailsModal.jsx:8-14,60-70]; cancel and edit are only offered while `status === 'posted'` [modules/donor/DonationDetailsModal.jsx:267,285].

## Side Effects
- Network: donor stats, donations list, waste list, donation-by-id, create/update/cancel donation, create/cancel waste request (all via `../../api/client`).
- `window.confirm` before cancelling a donation or waste request; `alert` on cancel failure [modules/donor/DonorDashboard.jsx:86-106, modules/donor/DonationDetailsModal.jsx:42-52].
- `console.error` on dashboard load failure [modules/donor/DonorDashboard.jsx:70].

## Verification
- Run: `cd frontend && npm test && npm run build`
