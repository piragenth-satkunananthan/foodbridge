# Test

## Overview
Test-support directory. The `*.test.js` files here are ignored by this contract (test files are out of scope); the only non-test source is `helpers.js`, a shared harness for the `node --test` API suite that `scripts/test-api.js` runs against a disposable Docker MongoDB replica set.

## Interface
- `setup()` — [test/helpers.js:setup] registers `before`/`after` hooks: `before` requires `MONGO_URI` to match `mongodb://127.0.0.1:<port>/foodbridge_test_*?directConnection=true` (else throws "Use npm run test:api with its disposable database"), connects mongoose, drops the database, loads the Express app from `../server`, initializes all model indexes, and listens on `127.0.0.1` port 0; returns an `api(method, route, user?, body?)` helper that performs `fetch(base + '/api' + route)` with JSON body and optional `Authorization: Bearer` token (from `user.token` or `generateToken(user._id, user.role)`), returning `{ status, body }`. `after` closes the server, drops the database again, and disconnects.
- `user(role, orgType?)` — [test/helpers.js:user] creates a test User (district Colombo) and, when `orgType` is given, a verified Organization linked to it (capacityKg 1000; composting_facility handles only organic, others handle plastic/glass/paper/metal/non_recyclable).
- `foodBody(overrides?)` — [test/helpers.js:foodBody] returns a valid donation payload (Rice, "20 kg", refrigerated, Colombo, deadline +24h).
- Re-exports: `mongoose`, `User`, `Organization`, `Donation`, `WasteRequest`, `Pickup`.

## Invariants
- [test/helpers.js:setup] refuses to run unless `MONGO_URI` points at the disposable `foodbridge_test_*` direct-connection database — tests never touch a shared database.
- [test/helpers.js:setup] the database is dropped before and after the suite.

## Side Effects
- [test/helpers.js:setup] opens a MongoDB connection, drops the test database twice, starts an HTTP server on an ephemeral port, and closes it in `after`.
- [test/helpers.js:user] writes User/Organization documents to the test database.

## Verification
- Run: `cd backend && npm run test:all`
