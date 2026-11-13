# Modules

## Overview
Role-based dashboard packages mounted under `/admin`, `/donor`, `/recipient`, `/recycler`, and `/volunteer` by `App.jsx` (all gated by `ProtectedRoute`, with `admin` allowed into every module route). This directory has no direct source files — it only groups the five module packages below. Each module owns its dashboard, modals, and (for admin) a local `api.js` re-export of the shared client.

## Subdirectories & Boundaries
- [admin](./admin/README.md) — governance command center: organisation verification, platform activity monitoring, user suspend/delete, reports, notifications, public-impact snapshot.
- [donor](./donor/README.md) — Module 1 commercial donor portal: surplus food + waste postings, 4-step creation wizard, edit/details modals, history.
- [recipient](./recipient/README.md) — Module 2 charity allocation portal: proximity smart-matching feed, claims pipeline, two-party receipt confirmation.
- [recycler](./recycler/README.md) — Module 3 circular waste network: waste stream feed, batch claims, recycling certification + ESG certificate, AI classifier.
- [volunteer](./volunteer/README.md) — Module 4 courier logistics: open pickup jobs, active mission pipeline, route estimates, delivery history.

## Verification
- Run: `cd frontend && npm test && npm run build`
