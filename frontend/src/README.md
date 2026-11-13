# frontend/src

## Overview
Source root of the FoodBridge React SPA (Vite entry `main.jsx`, router shell `App.jsx`). Layers: `api` (single HTTP client + token storage), `context` (auth session), `components` (chrome, guards, toasts, `ui` primitives), `pages` (public/auth views), `modules` (five role dashboards), `utils` (CSV export). CSS files (`index.css`, `design.css`, `styles/`) are pruned from this contract scope.

## Interface
- `main.jsx` [main.jsx:12-22] — `ReactDOM.createRoot(document.getElementById('root')).render(<StrictMode><BrowserRouter><AuthProvider><ToastProvider><App/></ToastProvider></AuthProvider></BrowserRouter></StrictMode>)`; imports `index.css`, `design.css`, `styles/tokens.css`, `styles/ui.css` [main.jsx:7-10].
- `App` (default) [App.jsx:17] — renders `Header`, `Routes`, `Footer` [App.jsx:18-82]; routes: `/` and `/impact` → `LandingPage`, `/login` → `LoginPage`, `/register` → `RegisterPage` (public); `/admin/*`, `/donor/*`, `/recipient/*`, `/recycler/*`, `/volunteer/*` → module dashboards wrapped in `ProtectedRoute`; catch-all `*` → `<Navigate to="/" replace />` [App.jsx:21-79].
- Subdirectories: [api](./api/README.md), [components](./components/README.md), [context](./context/README.md), [modules](./modules/README.md), [pages](./pages/README.md), [utils](./utils/README.md).

## Invariants
- Module routes allow `admin` in addition to their own role: `/donor`, `/recipient`, `/recycler`, `/volunteer` accept `['<role>', 'admin']`, `/admin/*` accepts `['admin']` only [App.jsx:29-76].
- All module routes are wrapped in `ProtectedRoute`, which handles loading, unauthenticated redirect to `/login`, and role-mismatch redirect to the user's own portal [App.jsx:29-76, components/ProtectedRoute.jsx:5-32].
- Provider order is fixed: `BrowserRouter` → `AuthProvider` → `ToastProvider` → `App` [main.jsx:13-20]; every consumer of auth (`useAuth`) or toasts (`useToast`) sits below both providers.

## Side Effects
- Boot render mounts providers: `AuthProvider` performs the boot-time `getMe()` network call and localStorage hydration when a token exists [context/AuthContext.jsx:20-39].
- Routing side effects (navigation) occur throughout pages/components; CSS side effects are limited to class hooks (out of scope).

## Verification
- Run: `cd frontend && npm test && npm run build`
