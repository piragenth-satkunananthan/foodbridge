# Middleware

## Overview
Express middleware for authentication/authorization and centralized error handling. `protect` verifies Bearer JWTs and attaches the user (minus password) to `req.user`; `authorize(...roles)` gates routes by role; `notFound`/`errorHandler` normalize unmatched routes and thrown errors into JSON responses.

## Interface
- `protect(req, res, next)` — [middleware/authMiddleware.js:protect] async middleware; verifies `Authorization: Bearer <token>` with `process.env.JWT_SECRET`, loads the user via `User.findById(decoded.id).select('-password')`, rejects unknown or suspended users, then sets `req.user` and calls `next()`.
- `authorize(...roles)` — [middleware/authMiddleware.js:authorize] returns a middleware that allows the request only when `req.user.role` is in `roles`; must run after `protect`.
- `notFound(req, res, next)` — [middleware/errorMiddleware.js:notFound] sets status 404 and forwards a `Resource Not Found — [METHOD] url` error.
- `errorHandler(err, req, res, next)` — [middleware/errorMiddleware.js:errorHandler] maps errors to JSON `{ status: 'error', message }`: CastError→400, ValidationError→400, duplicate key (code 11000)→409, JsonWebTokenError/TokenExpiredError→401, otherwise `err.status` or existing `res.statusCode` (>=400) or 500; includes `stack` when `NODE_ENV !== 'production'`.

## Invariants
- [middleware/authMiddleware.js:protect] `req.user` never contains the password field (`select('-password')`).
- [middleware/authMiddleware.js:protect] suspended users get 403 even with a valid token; unknown users and invalid/expired tokens get 401; missing token gets 401 `Not authorized, no token`.
- [middleware/authMiddleware.js:authorize] denies with 403 when `req.user` is missing or its role is not in the allowed list.
- [middleware/errorMiddleware.js:errorHandler] response always has `status: 'error'`; stack trace is only exposed outside production.

## Side Effects
- [middleware/authMiddleware.js:protect] reads `process.env.JWT_SECRET` and performs a database read (`User.findById`) on every protected request.
- [middleware/errorMiddleware.js:errorHandler] writes the HTTP response status and JSON body; reads `process.env.NODE_ENV`.

## Verification
- Run: `cd backend && npm run test:all`
