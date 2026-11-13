# Auth Context

## Overview
React context that owns the authenticated session for the whole SPA. `AuthProvider` hydrates `user`/`token` from `localStorage` on boot, validates a stored token against `GET /auth/me`, and exposes `login` / `register` / `logout` actions that keep storage and state in sync. Consumed exclusively through the `useAuth()` hook.

## Interface
- `AuthProvider({ children })` [context/AuthContext.jsx:15] — provides `{ user, token, loading, login, register, logout, setUser }` [context/AuthContext.jsx:66].
- `useAuth()` [context/AuthContext.jsx:72] — returns the context value; throws when used outside the provider.
- `login(email, password)` → calls `loginUser`, persists token+user, returns the response [context/AuthContext.jsx:41-48].
- `register(userData)` → calls `registerUser`, persists token+user, returns the response [context/AuthContext.jsx:50-57].
- `logout()` → clears storage and state [context/AuthContext.jsx:59-63].

## Invariants
- `useAuth` throws `Error('useAuth must be used within an AuthProvider')` when the context is null [context/AuthContext.jsx:74-76].
- Initial state is read from storage: `user = getSavedUser()`, `token = getAuthToken()`, `loading = true` [context/AuthContext.jsx:16-18].
- On mount, if a stored token exists, `getMe()` is called once; on success the fresh user replaces state and is re-saved, on failure the token is removed and user/token are nulled, and `loading` is set false either way [context/AuthContext.jsx:20-39].
- `login`/`register` both call `setAuthToken(res.token)` + `saveUser(res)` + `setToken` + `setUser` and return `res` [context/AuthContext.jsx:41-57].
- `logout` calls `removeAuthToken()` (clears both keys) then nulls state [context/AuthContext.jsx:59-63].

## Side Effects
- `localStorage` access via the api/client helpers (`getSavedUser`, `getAuthToken`, `saveUser`, `setAuthToken`, `removeAuthToken`) [context/AuthContext.jsx:2-11].
- Network: `getMe()` on boot when a token exists; `loginUser`/`registerUser` on demand [context/AuthContext.jsx:25,42,51].
- `console.warn('Session expired or invalid, logging out:', ...)` when the boot-time `getMe()` fails [context/AuthContext.jsx:29].

## Verification
- Run: `cd frontend && npm test && npm run build`
