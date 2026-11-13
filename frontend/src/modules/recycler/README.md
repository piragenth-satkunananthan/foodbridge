# Recycler Module

## Overview
Circular waste network portal (`/recycler/*`, Module 3). `RecyclerDashboard` exposes an available-waste feed, active collections, certified history, and a rule-based AI waste classifier tab; certification issues an ESG diversion certificate rendered by `RecyclingCertificateModal`. `ClaimWasteModal` performs the batch claim.

## Interface
- `RecyclerDashboard` (default) [modules/recycler/RecyclerDashboard.jsx:42] — tabs `available` / `active_claims` / `history` / `classifier` [modules/recycler/RecyclerDashboard.jsx:46]; `WASTE_CATEGORIES` = all/plastic/glass/paper/metal/organic [modules/recycler/RecyclerDashboard.jsx:33-40]; loads `fetchRecyclerStats`, `fetchRecyclerFeed`, `fetchRecyclerClaims` [modules/recycler/RecyclerDashboard.jsx:91-129]; actions `cancelWasteClaim`, `confirmWasteRecycled`, `classifyWasteItem`, `fetchWasteCertificate` [modules/recycler/RecyclerDashboard.jsx:142-204].
- `ClaimWasteModal` (default) [modules/recycler/ClaimWasteModal.jsx:9] — claims via `claimWasteRequest(wasteRequest._id, notes)` [modules/recycler/ClaimWasteModal.jsx:22]; `categoryLabels` covers plastic/glass/paper/metal/organic/non_recyclable [modules/recycler/ClaimWasteModal.jsx:32-39].
- `RecyclingCertificateModal` (default) [modules/recycler/RecyclingCertificateModal.jsx:8] — renders the certificate, optionally fetches it via `fetchWasteCertificate(batch._id)`, prints via `window.print()` [modules/recycler/RecyclingCertificateModal.jsx:14-45].

## Invariants
- `isVerified = user?.verificationStatus === 'verified' || stats.verificationStatus === 'verified'` [modules/recycler/RecyclerDashboard.jsx:85]; the Claim Batch button is disabled when unverified [modules/recycler/RecyclerDashboard.jsx:559].
- Active-claims list is filtered to `matched | pickup_scheduled | picked_up | delivered_or_recycled`; history to `recycled | completed` [modules/recycler/RecyclerDashboard.jsx:118-120].
- "Release Batch" shows only when `status === 'matched'` and requires `window.confirm` [modules/recycler/RecyclerDashboard.jsx:633-640,142-155].
- Certification calls `confirmWasteRecycled(id, { processingNotes })` and opens the certificate modal only when the response contains `res.certificate` [modules/recycler/RecyclerDashboard.jsx:157-177].
- Classifier tab sends `classifyWasteItem({ description })` and renders `category` + `handling` [modules/recycler/RecyclerDashboard.jsx:191-204,767-788].
- Certificate outcome labels: `composted` → "Agricultural Soil Composting", `recycled` → "Industrial Material Reprocessing", otherwise "Managed Disposal" [modules/recycler/RecyclingCertificateModal.jsx:47-52]; the footnote forbids speculative CO₂/tree equivalence figures [modules/recycler/RecyclingCertificateModal.jsx:179-180].
- When no certificate is passed, the modal synthesises one from batch fields with id `FB-DIV-<last6>` and defaults (organic → composted, else recycled) [modules/recycler/RecyclingCertificateModal.jsx:28-41].

## Side Effects
- Network: recycler feed/claims/stats, claim, cancel-claim, confirm-recycled, classify, certificate fetch (via `../../api/client`).
- `window.confirm` on claim release [modules/recycler/RecyclerDashboard.jsx:143]; `window.print()` from the certificate modal [modules/recycler/RecyclingCertificateModal.jsx:43-45].
- Timers: 5s auto-dismiss of success banner [modules/recycler/RecyclerDashboard.jsx:138,150,165].

## Verification
- Run: `cd frontend && npm test && npm run build`
