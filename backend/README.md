# Backend

## Overview
FoodBridge backend: a CommonJS Express 5 + Mongoose API server (port 5000 by default) for surplus-food donation and waste-recovery coordination across Sri Lankan districts. `server.js` builds the Express app (helmet, CORS whitelist, rate limiters, JSON body limit 5mb, mongo-sanitize, health endpoint, `/api/*` routers, centralized 404/error handling) and, when run directly (`npm start`), requires `JWT_SECRET`, connects to MongoDB via `config/db.js`, starts the cron scheduler, and listens. `package.json` defines the npm scripts (`start`, `dev`, `test`, `test:module1-5`, `test:api`, `test:all`, `seed`, `db:check`). `seed-module5.js` is a guarded demo seeder. Test files (`test-*.js`, `test-module*.js`) are out of scope for this contract.

## Interface
- `app` — [server.js:module.exports] the configured Express app (also started standalone when `require.main === module`). Mounts: `GET /api/health`, `GET /`, and routers `/api/auth`, `/api/admin`, `/api/impact`, `/api/notifications`, `/api/donations`, `/api/waste`, `/api/match`, `/api/pickups`, `/api/surplus`, `/api/organizations`, `/api/complaints`; `notFound` + `errorHandler` last.
- `package.json` scripts — [package.json:scripts] `start` = `node server.js`; `dev` = `node --watch server.js`; `test:all` = `npm test && npm run test:api`; `test:api` = `node scripts/test-api.js` (disposable Docker MongoDB replica set + `node --test` over `test/*.test.js`); `test:module1..5`, `test:impact`, `seed` = `node seed-module5.js`, `db:check` = `node scripts/check-data.js`. Dependencies: express ^5, mongoose ^9, bcryptjs, cors, dotenv, express-mongo-sanitize, express-rate-limit, helmet, jsonwebtoken. `"type": "commonjs"`, `main: server.js`.
- `seed-module5.js` — [seed-module5.js:seedData] demo seeder: requires `ALLOW_DEMO_SEED=true` AND a database name matching `/(demo|test|local)/i`, then deletes all User/Organization/Donation/WasteRequest/Pickup/Notification/ImpactRecord collections and inserts demo accounts (admin@foodbridge.com/admin123, donor/recipient/recycler/volunteer users with user123), organizations, donations, waste requests, a completed pickup, an ImpactRecord (period 2026-09), and notifications — all with `isDemo: true`.
- Subdirectories:
  - [config](./config/README.md) — MongoDB connect + JWT signing helpers
  - [controllers](./controllers/README.md) — HTTP handlers for auth, admin, donations, waste, matching, pickups, notifications, organizations, impact, complaints
  - [middleware](./middleware/README.md) — `protect`/`authorize` auth middleware, `notFound`/`errorHandler`
  - [models](./models/README.md) — Mongoose schemas (User, Organization, Donation, WasteRequest, Pickup, Notification, Complaint, ImpactRecord)
  - [routes](./routes/README.md) — Express routers mounting the `/api/*` surface with role gates
  - [scripts](./scripts/README.md) — CLI scripts: read-only data preflight (`db:check`) and disposable-Docker API test runner (`test:api`)
  - [services](./services/README.md) — posting lifecycle, eligibility/matching, allocation/claims, pickup pipeline, cron scheduler
  - [test](./test/README.md) — shared `node --test` API harness (helpers.js); `*.test.js` files are tests, not contract scope
  - [utils](./utils/README.md) — domain validation helpers, quantity parsing, transactions, distance/match scoring, route estimation, waste classification, pickup history, notifications

## Invariants
- [server.js] when run directly, throws `JWT_SECRET is required` before connecting if the env var is missing; DB connection failure sets `process.exitCode = 1` instead of listening.
- [server.js] global rate limit 500 req/15 min/IP; auth routes additionally limited to 50 req/15 min/IP; `trust proxy` = 1; JSON body limit 5mb; non-object JSON bodies on POST/PUT/PATCH rejected with 400; mongo-sanitize applied to body and params; CORS allows only localhost defaults, `ALLOWED_ORIGINS` entries, or `*`.
- [server.js] `/api/impact` is the only router mounted without `protect` (public impact analytics).
- [seed-module5.js] refuses to run unless `ALLOW_DEMO_SEED === 'true'` and the DB name matches demo/test/local — never runs against shared data; deletes the listed collections before seeding (destructive on the target demo DB).
- [package.json] `test:all` is the combined gate: `npm test` (module checks incl. `node --test` suites) plus `npm run test:api` (HTTP workflow tests against a disposable replica set).

## Side Effects
- [server.js] when started directly: connects to MongoDB (`MONGO_URI`), starts cron timers (expiry sweep + monthly impact snapshot every 15 min), and listens on `PORT || 5000`; requiring the module only builds the app (no listen/connect) so tests can import it.
- [seed-module5.js] connects to MongoDB, deletes all demo collections, inserts demo documents, prints credentials, exits 0/1.
- [scripts/*] see [scripts](./scripts/README.md) — Docker container lifecycle and DB access for tests, read-only preflight counts.

## Verification
- Run: `cd backend && npm run test:all`
