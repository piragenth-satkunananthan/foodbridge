# Scripts

## Overview
Standalone Node scripts run from the CLI (not part of the HTTP server): a read-only data preflight check and a disposable-Docker API test runner.

## Interface
- `check-data.js` — [scripts/check-data.js] IIFE script: loads `.env` via dotenv, connects with `connectDB({ autoIndex: false, autoCreate: false })`, prints a JSON counts object (replicaSet flag, organizations missing capacity/user link, pickups missing active flag, unconfirmed historical donations/waste, duplicate org user links, duplicate active pickup sources) and sets `process.exitCode = 1` if the DB is not a replica set or any anomaly count is > 0.
- `test-api.js` — [scripts/test-api.js] IIFE script: spawns a disposable `mongo:latest` Docker replica set on a random localhost port, waits for `rs.initiate` and a writable primary, then runs `node --test --test-concurrency=1` over `test/*.test.js` (or files passed as argv) with `MONGO_URI`, a random `JWT_SECRET`, and `NODE_ENV=test`; optionally runs inside a Docker image when `TEST_NODE_IMAGE` is set; propagates the test exit code and always stops the container in `finally`.

## Invariants
- [scripts/check-data.js] read-only: comment states it "Never rewrites historical activity or guesses capacity"; it only runs `countDocuments`/`aggregate`/`admin().command({hello:1})` and exits non-zero on anomalies; connects with `autoIndex: false, autoCreate: false`.
- [scripts/test-api.js] uses a unique container/database name per run (`foodbridge-test-<uuid>`), always disconnects mongoose and stops the Docker container in `finally`, and runs tests with `--test-concurrency=1`.

## Side Effects
- [scripts/check-data.js] opens a MongoDB connection (network), reads `process.env.MONGO_URI` via dotenv-loaded `.env`, writes JSON to stdout, sets `process.exitCode`, and disconnects.
- [scripts/test-api.js] spawns/stops a Docker container (`docker run --rm -d`, `docker port`, `docker exec mongosh`, `docker stop`), opens network connections to MongoDB, spawns a child `node --test` process (or docker run) with inherited stdio, and writes to stdout/stderr.

## Verification
- Run: `cd backend && npm run test:all`
