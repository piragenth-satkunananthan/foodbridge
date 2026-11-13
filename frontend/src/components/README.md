# Shared Components

## Overview
Cross-cutting components used by `App.jsx` and by pages/modules: the route guard, the site chrome (Header/Footer), the toast notification system, and small display helpers. The presentational primitives live in the `ui` child package.

## Interface
- `ProtectedRoute({ children, allowedRoles })` (default) [components/ProtectedRoute.jsx:5] — gates module routes.
- `Header` (default) [components/Header.jsx:6] — brand, nav links, auth CTA / role badge + portal link + sign-out, mobile drawer.
- `Footer` (default) [components/Footer.jsx:5] — portal links, standards, anti-greenwashing pledge.
- `ToastProvider({ children })` + `useToast()` [components/Toast.jsx:6,52] — context exposing `addToast(message, type, duration)` / `removeToast(id)`.
- `ImpactSummary({ data })` (default) [components/ImpactSummary.jsx:3] — renders `{summary, ecosystem}` impact figures with methodology note.
- `AnimatedCounter({ value, decimals, prefix, suffix, className })` (default) [components/AnimatedCounter.jsx:3] — locale-formatted number.
- Subdirectories: [ui](./ui/README.md) — presentational primitives (Button, Card, Modal, Field, EmptyState, Skeleton, StatusBadge).

## Invariants
- `ProtectedRoute` renders a "Verifying user credentials..." placeholder while `loading`; redirects to `/login` when there is no user; on role mismatch redirects via the fixed map admin→`/admin`, donor→`/donor`, recipient→`/recipient`, recycler→`/recycler`, volunteer→`/volunteer` (fallback `/`) [components/ProtectedRoute.jsx:8-30].
- `Header` renders nothing on `/admin*` when the signed-in user is an admin [components/Header.jsx:17-19]; the mobile drawer closes on every `pathname` change [components/Header.jsx:12-14]; sign-out calls `logout()` then `navigate('/login')` [components/Header.jsx:76-80,143-148].
- `Footer` renders nothing on `/admin*` [components/Footer.jsx:8-10]; its pledge states metrics derive only from two-party signed completed handovers, never invented CO₂/tree counts [components/Footer.jsx:111-113].
- `ToastProvider.addToast` defaults to `type='success'`, `duration=3500`; a `duration > 0` schedules removal via `setTimeout`, `duration <= 0` makes the toast persistent until `removeToast` [components/Toast.jsx:9-22]; `useToast` throws `'useToast must be used within a ToastProvider'` outside the provider [components/Toast.jsx:54-56]; error toasts use `role="alert"`, others `role="status"` [components/Toast.jsx:34].
- `ImpactSummary` reads exactly `summary.{mealsRescued,totalKgRecycled,kgOrganicDiverted,districtsCoveredCount,kgRecycled,districtsCovered}` and `ecosystem.completedDonationsCount/completedWasteCount`; it shows the "figures will appear after..." note only when both completed counts are 0 [components/ImpactSummary.jsx:5-21]; methodology text fixes 2.5 meals per kilogram and excludes unrecognised quantities [components/ImpactSummary.jsx:41].
- `AnimatedCounter` renders `—` for non-finite values and formats with `minimumFractionDigits = maximumFractionDigits = decimals` [components/AnimatedCounter.jsx:4-5].

## Side Effects
- `Header` sign-out triggers AuthContext `logout()` (localStorage token/user removal) and router navigation [components/Header.jsx:76-80].
- `ToastProvider` uses `setTimeout` for auto-dismiss and `Date.now()+random` for toast ids [components/Toast.jsx:10-17].

## Verification
- Run: `cd frontend && npm test && npm run build`
