# FoodBridge Frontend — MERN Stack Application

Unified React.js + Vite web application for **FoodBridge: A Smart Food Rescue and Waste Management Platform**.

---

## 🏗️ Architecture & Module Organization

The frontend follows a **modular feature-based architecture** under a single shared application with role-based routing:

```
frontend/
├── package.json               # Shared dependencies (React, React Router, Lucide icons, Vite)
├── vite.config.js             # Proxies /api to http://localhost:5000
├── index.html
└── src/
    ├── api/                   # Shared API client
    ├── context/               # Shared AuthContext (JWT session & user state)
    ├── components/            # Shared Header, ProtectedRoute
    ├── pages/                 # Public Landing Page, Login & Register
    │
    └── modules/               # Enterprise Domain Portals
        ├── admin/             # 🛡️ Governance, Verification & ESG Impact Portal
        ├── donor/             # 📦 Commercial Surplus Food & Waste Dispatch
        ├── recipient/         # 🤝 Charity & NGO Proximity Allocation
        ├── recycler/          # ♻️ Circular Waste Stream & Composting Logistics
        └── volunteer/         # 🚚 Volunteer Courier Fleet & Route Tracking
```

---

## 🚀 How to Run Locally

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Logins (Instant 1-Click Buttons on Login Page)

| Role | Email | Password | Assigned Dashboard |
|---|---|---|---|
| **Platform Administrator** | `admin@foodbridge.com` | `admin123` | `/admin` |
| **Food Donor** | `cinnamon@hotel.com` | `user123` | `/donor` |
| **Recipient (NGO)** | `carehome@ngo.org` | `user123` | `/recipient` |
| **Recycler** | `info@ecocycle.lk` | `user123` | `/recycler` |
| **Volunteer** | `saman@volunteer.org` | `user123` | `/volunteer` |

---

## Interface

- [vite.config.js](vite.config.js) — Vite config: plugins `tailwindcss()` + `react()`; dev server on port **5173** with proxy `/api` → `http://localhost:5000` (`changeOrigin: true`).
- [package.json](package.json) — scripts: `dev` = `vite`, `build` = `vite build`, `preview` = `vite preview`, `test` = `node --test test-export.mjs`. Dependencies: `react`, `react-dom`, `react-router-dom`, `framer-motion`, `lucide-react`; devDependencies: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`.
- [index.html](index.html) — Vite entry document loading `src/main.jsx`.
- [nginx.conf](nginx.conf) / [Dockerfile](Dockerfile) — container serving of the built `dist/` bundle with `/api` proxied to the backend.

## Subdirectories & Boundaries

- [src](./src/README.md) — React SPA source root: `api` (HTTP client), `context` (auth session), `components` (chrome + `ui` primitives), `pages` (public/auth), `modules` (five role dashboards), `utils` (CSV export). Each subdirectory has its own contract README.

## Invariants

- The `/api` dev proxy target is fixed to `http://localhost:5000` [vite.config.js:server.proxy].
- The only test runner is Node's built-in runner over `test-export.mjs` (`node --test`); there is no vitest/jest setup [package.json:scripts.test].
- `dist/` is generated build output and gitignored; the Docker image builds it at image-build time.

## Side Effects

- `npm run dev` binds a dev server on port 5173; `npm run build` writes `frontend/dist/`; `npm test` executes the export test suite in-process.

## Verification

- Run: `cd frontend && npm test && npm run build`
