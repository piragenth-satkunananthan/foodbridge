# Recipient Module

## Overview
Verified charity/shelter portal (`/recipient/*`, Module 2 proximity matching). `RecipientDashboard` shows a smart-matching feed of nearby surplus donations, the recipient's active claims with the courier pipeline, and a completed-rescue archive; two-party receipt confirmation closes the loop. `ClaimDonationModal` handles the claim action and locks it for unverified organisations.

## Interface
- `RecipientDashboard` (default) [modules/recipient/RecipientDashboard.jsx:29] — tabs `available` / `active_claims` / `history` [modules/recipient/RecipientDashboard.jsx:33]; loads `fetchRecipientStats`, `fetchNearbyDonations` (district/storage/sort/search filters) or `fetchRecipientClaims` [modules/recipient/RecipientDashboard.jsx:71-102]; actions `claimDonation`, `cancelDonationClaim`, `confirmPickupReceipt` [modules/recipient/RecipientDashboard.jsx:114-153].
- `ClaimDonationModal` (default) [modules/recipient/ClaimDonationModal.jsx:8] — props `isOpen, onClose, donation, onClaim, isVerified`; computes `hoursRemaining` from `pickupDeadline` [modules/recipient/ClaimDonationModal.jsx:37-39]; displays `matchScore` as a "% Smart Match" badge [modules/recipient/ClaimDonationModal.jsx:103].

## Invariants
- `isVerified = user?.verificationStatus === 'verified' || stats.isVerified` [modules/recipient/RecipientDashboard.jsx:65]; claim buttons are disabled when unverified [modules/recipient/RecipientDashboard.jsx:534] and the modal hard-blocks submit (`if (!isVerified) return`) [modules/recipient/ClaimDonationModal.jsx:23,176].
- Default sort is `smart_match`; sort options smart_match/urgency/distance/newest [modules/recipient/RecipientDashboard.jsx:54,419-422].
- Claim pipeline stages rendered: matched → pickup_scheduled → picked_up → delivered_or_recycled → completed [modules/recipient/RecipientDashboard.jsx:632-639].
- "Release Claim" is only shown when `pipelineStage === 'matched'` and requires `window.confirm`, returning the item to the open pool [modules/recipient/RecipientDashboard.jsx:619-626,122-134].
- Receipt confirmation sends `confirmPickupReceipt(pickupId, { accepted, note })` with a default accept/reject note [modules/recipient/RecipientDashboard.jsx:136-153]; the reject path collects a reason via `prompt()` [modules/recipient/RecipientDashboard.jsx:683-688]; the two-party card appears only at `delivered_or_recycled` [modules/recipient/RecipientDashboard.jsx:584,662].
- Urgency badge thresholds: ≤2h critical (rose, pulsing), ≤6h amber, else neutral [modules/recipient/RecipientDashboard.jsx:155-176].
- Success messages auto-clear after 5000ms via `setTimeout` [modules/recipient/RecipientDashboard.jsx:117,129,146].

## Side Effects
- Network: recipient stats, nearby donations, claims, claim/cancel-claim, confirm-pickup-receipt (via `../../api/client`).
- `window.confirm` on claim release; `prompt()` for rejection reason [modules/recipient/RecipientDashboard.jsx:123,683].
- Timers: 5s auto-dismiss of the success banner [modules/recipient/RecipientDashboard.jsx:75-78 equivalent at 117/129/146].

## Verification
- Run: `cd frontend && npm test && npm run build`
