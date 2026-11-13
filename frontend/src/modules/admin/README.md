# Admin Module

## Overview
The governance command center (`/admin/*`). `AdminDashboard` composes a dedicated `Navbar`, five tabs (Overview, Verification, Monitoring, Users, Reports), a notifications drawer, and a public-impact preview modal. `api.js` simply re-exports the shared API client so admin components import from `./api`.

## Interface
- `AdminDashboard` (default) [modules/admin/AdminDashboard.jsx:18] — owns tab state, stats, notifications, and the impact modal; loads `fetchAdminStats` + `fetchNotifications` on mount [modules/admin/AdminDashboard.jsx:59-62].
- `Navbar` (default) [modules/admin/Navbar.jsx:5] — props `activeTab, setActiveTab, pendingCount, unreadCount, toggleNotifications, openPublicImpact, adminUser, onLogout`; nav items overview/verification/monitoring/users/reports [modules/admin/Navbar.jsx:6].
- `OverviewTab` (default) [modules/admin/OverviewTab.jsx:3] — KPIs, review queue, merged recent activity (donations + waste sorted by `createdAt` desc), outcome totals, role/waste breakdowns [modules/admin/OverviewTab.jsx:6-27].
- `VerificationTab` (default) [modules/admin/VerificationTab.jsx:21] — organisation list with status/type/search filters; verify/reject decision modal; CSV export of the roster.
- `MonitoringTab` (default) [modules/admin/MonitoringTab.jsx:16] — sub-tabs donations / waste / pickups with status, district, category filters.
- `UsersTab` (default) [modules/admin/UsersTab.jsx:22] — user directory with role/status/district/search filters; suspend/reactivate modal; delete with confirm.
- `ReportsTab` (default) [modules/admin/ReportsTab.jsx:14] — date/district filtered report with KPI cards and per-district table; JSON report download.
- `PublicImpactModal` (default) [modules/admin/PublicImpactModal.jsx:7] — public impact preview, CSV download, monthly snapshot save.
- `api.js` [modules/admin/api.js:1] — `export * from '../../api/client'`.

## Invariants
- Notification click routes to the `verification` tab when `relatedType === 'organization'`, otherwise `monitoring` [modules/admin/AdminDashboard.jsx:83].
- `UsersTab` never offers suspend/delete for the currently signed-in admin (`isCurrentAdmin` → "Current Session") [modules/admin/UsersTab.jsx:213,282-307]; the status toggle flips `active` ↔ `suspended` [modules/admin/UsersTab.jsx:66]; delete is guarded by `window.confirm` and described as irreversible [modules/admin/UsersTab.jsx:91]; the confirm button is disabled until the reason is non-empty [modules/admin/UsersTab.jsx:371].
- `VerificationTab` maps verify → `'verified'` and reject → `'rejected'` [modules/admin/VerificationTab.jsx:74-75]; the Verify button is hidden when already verified and Reject hidden when rejected [modules/admin/VerificationTab.jsx:261-281].
- `MonitoringTab` resets all filters when the sub-tab changes [modules/admin/MonitoringTab.jsx:61-66]; the status filter offers `recycled` only for waste and `delivered` otherwise [modules/admin/MonitoringTab.jsx:162-166].
- `ReportsTab` exports the raw report object as `foodbridge-report_<date>.json` via a Blob download [modules/admin/ReportsTab.jsx:50-60].
- `PublicImpactModal` saves snapshots with period `YYYY-MM` of the current date and states the snapshot replaces the month's previous snapshot rather than measuring within-month activity [modules/admin/PublicImpactModal.jsx:26,44].

## Side Effects
- Network (via `../../api/client`): admin stats, organizations list/verify, donations/waste/pickups listings, users list/status/delete, reports, notifications fetch + mark read/read-all, public impact, impact snapshot.
- Browser downloads: organizations CSV (`exportOrganizationsCSV`) [modules/admin/VerificationTab.jsx:148], impact CSV [modules/admin/PublicImpactModal.jsx:41], report JSON Blob [modules/admin/ReportsTab.jsx:52-58].
- `window.confirm` on user delete [modules/admin/UsersTab.jsx:91]; toast notifications via `useToast` on verify/status/delete outcomes; framer-motion animations in `UsersTab`.

## Verification
- Run: `cd frontend && npm test && npm run build`
