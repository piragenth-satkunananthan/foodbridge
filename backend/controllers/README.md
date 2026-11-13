# Controllers

## Overview
HTTP request handlers for the FoodBridge API, one file per domain. Most handlers are wrapped in the `endpoint()` helper from utils/domain (async errors forwarded to the centralized error middleware). Business rules and authorization live here (per repo guidelines); they delegate heavy lifecycle logic to services (posting, allocation, pickup) and persistence to models.

## Interface
- [controllers/authController.js] `registerUser` (POST /api/auth/register; public roles only: donor/recipient/volunteer/recycler; email format check, normalized lowercase; password 8–72 bytes; bcrypt salt 10; returns 201 + JWT), `loginUser` (POST /api/auth/login; 401 on bad credentials, 403 when suspended; returns user + JWT), `getMe` (GET /api/auth/me; returns req.user).
- [controllers/adminController.js] `getAdminStats`, `getOrganizations`, `getOrganizationById`, `verifyOrganization` (verified/rejected only, transactional org+user update, notifies linked user), `getAllDonations`, `getAllWasteRequests`, `getAllPickups`, `getAllUsers` (password excluded), `updateUserStatus` (active/suspended; admin cannot suspend self; notifies user), `deleteUser` (soft-delete: sets suspended, retains history; admin cannot delete self), `getReports` (date-range + district report; demo docs excluded; per-day toDate inclusive to 23:59:59.999 UTC).
- [controllers/donationController.js] `createDonation`, `updateDonation`, `cancelDonation`, `getDonations` (role-scoped: donor sees own, other non-admin roles see matched org, admin sees all; paginated), `getDonationById` (participant-only via canReadPost; includes pickup + history), `getDonorStats`.
- [controllers/wasteController.js] `classifyWaste`, `createWasteRequest`, `updateWasteRequest`, `cancelWasteRequest`, `getWasteRequests`, `getWasteRequestById`, `getRecyclerFeed`, `claimWasteRequest`, `cancelWasteClaim`, `getRecyclerClaims`, `confirmWasteRecycled`, `getRecyclerStats`, `getEligibleCollectorsForWaste`, `getWasteCertificate` (certificateId `FB-DIV-<last6 of id>`).
- [controllers/matchController.js] `getNearbyDonations` (posted, deadline in future, non-demo, active donor, eligibility+smart-match score, filters/sort), `claimDonation`, `cancelDonationClaim`, `getMyClaims`, `getRecipientStats`, `rankRecipientsForDonation`.
- [controllers/pickupController.js] `getOpenPickupJobs` (matched + unassigned + active, source matched & deadline future & donor active & org verified; contact details and registrationInfo stripped until assignment; sorted by volunteer-to-origin distance), `getMyActiveJobs`, `getPickupHistory`, `getPickupById` (participant-only), `acceptPickupJob`, `updatePickupStatus`, `cancelPickupJob`, `confirmPickupReceipt`, `updatePickupLocation`, `getVolunteerStats` (km are estimated, not recorded travel), `parseQuantityMetrics`.
- [controllers/organizationController.js] `getOrganization`, `saveOrganization` (upsert linked org profile; rejects unknown fields; type must match role — recipient→ngo/charity/shelter, recycler→recycler/composting_facility/waste_management; capacityKg positive ≤1e9; composting only organic, waste_management only non_recyclable, recycler excludes organic/non_recyclable; sets verificationStatus pending and notifies admins; 409 if reservedKg > 0).
- [controllers/notificationController.js] `getNotifications` (latest 50 + unreadCount), `markNotificationAsRead`, `markAllNotificationsAsRead`, `deleteNotification` (all scoped to recipientUser = req.user).
- [controllers/complaintController.js] `createComplaint` (transactional; notifies active admins), `getComplaints` (admin sees all, others only own; limit 100), `resolveComplaint` (status ∈ investigating/resolved/dismissed; notifies reporter).
- [controllers/impactController.js] `calculateImpactMetrics(extra?)` (completed, non-demo, completedAt is date; meals = parseMealsCount, kg recycled per category only when processingOutcome==='recycled', organic diverted only when composted), `confirmedFilter` = {status:'completed', isDemo:{$ne:true}, completedAt:{$type:'date'}}, `getPublicImpact` (public; excludes demo; meals estimated at 2.5 per kg), `recordMonthlySnapshot` (current month only, upsert), `getLiveFeed` (latest 6 donations + 6 waste, non-demo), `getDistrictStats`; re-exports parseMealsCount/parseWeightKg.

## Invariants
- [controllers/authController.js:registerUser] role must be in publicRoles (admin cannot be self-registered); duplicate email → 400; password length 8 chars min / 72 bytes max (bcrypt limit); success responses never include the password hash.
- [controllers/authController.js:loginUser] identical 401 message for unknown email and wrong password; suspended accounts get 403.
- [controllers/adminController.js:updateUserStatus/deleteUser] an admin cannot suspend or delete their own account (400).
- [controllers/adminController.js:deleteUser] is a soft delete — the user is set to 'suspended' and history is retained; no document is removed.
- [controllers/donationController.js:getDonations / wasteController.js:getWasteRequests] non-admin, non-donor users must have an Organization profile (403 'Organization profile required') and only see posts matched to it.
- [controllers/donationController.js:getDonationById / wasteController.js:getWasteRequestById] read access requires canReadPost (403 'Not a participant').
- [controllers/pickupController.js:getOpenPickupJobs] donor email/contactNumber and org registrationInfo/linkedUser contact are deleted from the response until a volunteer is assigned.
- [controllers/pickupController.js:getPickupById] 403 unless admin or the pickup's volunteer, source donor, or receiving org owner.
- [controllers/organizationController.js:saveOrganization] profile edits are blocked with 409 while the org has reservedKg > 0; saving always resets verificationStatus to 'pending' and clears remarks/verifiedAt/verifiedBy.
- [controllers/complaintController.js:resolveComplaint] status must be one of investigating/resolved/dismissed (else 400).
- [controllers/impactController.js] all impact math excludes demo records (`isDemo: {$ne: true}`) and requires `completedAt` to be a date; donationSuccessRate/wasteSuccessRate are returned as null (not computed).

## Side Effects
- Database reads/writes via Mongoose models on every handler; claim/verify/complaint/org-save run inside MongoDB transactions (utils/transaction).
- Notification writes via queueNotifications/createNotification (admin verification, claims, pickups, complaints, user status changes).
- Password hashing with bcrypt (register), JWT issuance via config/generateToken.

## Verification
- Run: `cd backend && npm run test:all`
