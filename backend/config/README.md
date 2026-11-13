# Config

## Overview
Backend configuration helpers: MongoDB connection bootstrap and JWT signing. Both read required secrets from environment variables and throw immediately when they are missing, so the server never starts against an implicit fallback database or an unsigned token.

## Interface
- `connectDB(options?)` — [config/db.js:connectDB] async function; connects mongoose to `process.env.MONGO_URI` with `serverSelectionTimeoutMS: 5000` (overridable via `options`); returns the mongoose connection promise. Exported as the module default (`module.exports = connectDB`).
- `generateToken(userId, role)` — [config/generateToken.js:generateToken] signs a JWT payload `{ id: userId, role }` with `process.env.JWT_SECRET`, expiring in `process.env.JWT_EXPIRES_IN || '7d'`.

## Invariants
- [config/db.js:connectDB] throws `MONGO_URI is required; no automatic fallback database is used` when `MONGO_URI` is unset — no default database is ever used.
- [config/generateToken.js:generateToken] throws `JWT_SECRET is required` when `JWT_SECRET` is unset.
- [config/generateToken.js:generateToken] token payload always carries both `id` and `role`; default expiry is 7 days unless `JWT_EXPIRES_IN` overrides it.

## Side Effects
- [config/db.js:connectDB] opens a network connection to MongoDB (mongoose connect) with a 5s server-selection timeout.
- [config/generateToken.js:generateToken] reads `process.env.JWT_SECRET` and `process.env.JWT_EXPIRES_IN` (environment access; no disk or network I/O).

## Verification
- Run: `cd backend && npm run test:all`
