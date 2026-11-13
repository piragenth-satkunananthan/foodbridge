# Pages

## Overview
Top-level routed views rendered by `App.jsx`. `LandingPage` doubles as the home page (`/`) and the public impact ledger (`/impact`); `HomePage` is the marketing landing view with database-backed impact strip, live feed, district explorer, and FAQ; `LoginPage`/`RegisterPage` are the auth forms.

## Interface
- `LandingPage` (default export) [pages/LandingPage.jsx:8] — renders `HomePage` when `pathname === '/'`, otherwise the impact report view; loads `fetchPublicImpact()` on `/impact`, with Refresh and "Download impact report" (CSV via `exportImpactMetricsCSV`) [pages/LandingPage.jsx:14-46].
- `HomePage` (default export) [pages/HomePage.jsx:127] — static content tables `ROLES` (5 portals), `DISTRICT_HUBS` (8 districts), `FAQS` (5 entries) [pages/HomePage.jsx:30-125]; on mount `Promise.allSettled([fetchPublicImpact(), fetchLiveFeed(), fetchDistrictStats()])` [pages/HomePage.jsx:137-158].
- `LoginPage` (default export) [pages/LoginPage.jsx:15] — `demoAccounts` table of 5 role credentials [pages/LoginPage.jsx:7-13]; `signIn` calls `login()` then `navigate(`/${user.role}`)` [pages/LoginPage.jsx:22-28].
- `RegisterPage` (default export) [pages/RegisterPage.jsx:9] — `districts` list of all 25 Sri Lankan districts [pages/RegisterPage.jsx:7]; role initialised from `?role=` query, whitelisted to donor/recipient/recycler/volunteer (else `donor`) [pages/RegisterPage.jsx:11-12]; submits `register(form)` then navigates to `/${user.role}` [pages/RegisterPage.jsx:19-24].

## Invariants
- Registration can never create an `admin` account — the role query param is validated against `['donor','recipient','recycler','volunteer']` [pages/RegisterPage.jsx:12].
- Register form requires name/email/password/contactNumber; password hint states "At least 6 characters." [pages/RegisterPage.jsx:54-61,95-98].
- Recipient/recycler registrations show the notice that organisation accounts require admin verification before claims unlock [pages/RegisterPage.jsx:99-101].
- `LoginPage` navigates to `/${user.role}` after a successful login [pages/LoginPage.jsx:25]; `RegisterPage` likewise [pages/RegisterPage.jsx:21].
- `LandingPage` only fetches impact data when `pathname === '/impact'` [pages/LandingPage.jsx:27] and renders `HomePage` for `/` [pages/LandingPage.jsx:28].
- `HomePage` live feed renders at most the first 6 items (`liveFeed.slice(0, 6)`) [pages/HomePage.jsx:679].
- Home FAQ states impact metrics derive only from completed two-party verified deliveries, with no unverified CO₂/tree figures [pages/HomePage.jsx:122-124].

## Side Effects
- Network: `fetchPublicImpact`, `fetchLiveFeed`, `fetchDistrictStats` on HomePage mount [pages/HomePage.jsx:138-141]; `fetchPublicImpact` on LandingPage `/impact` [pages/LandingPage.jsx:18].
- Browser download via `exportImpactMetricsCSV` [pages/LandingPage.jsx:39].
- Session effects through `useAuth().login/register`: `localStorage` token/user writes and `useNavigate` redirects [pages/LoginPage.jsx:25, pages/RegisterPage.jsx:21].

## Verification
- Run: `cd frontend && npm test && npm run build`
