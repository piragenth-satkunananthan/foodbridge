# FoodBridge™ — Smart Food Rescue & Circular Waste Network

[![CI/CD Pipeline](https://github.com/piragenth-satkunananthan/foodbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/piragenth-satkunananthan/foodbridge/actions/workflows/ci.yml)
[![Platform Status](https://img.shields.io/badge/status-backend--validated--UI--pending-eab308.svg)](#)
[![Stack](https://img.shields.io/badge/stack-MERN-10b981.svg)](#)
[![UN SDG 2](https://img.shields.io/badge/UN%20SDG-Zero%20Hunger-eab308.svg)](https://sdgs.un.org/goals/goal2)
[![UN SDG 12](https://img.shields.io/badge/UN%20SDG-Responsible%20Consumption-f97316.svg)](https://sdgs.un.org/goals/goal12)
[![License](https://img.shields.io/badge/license-MIT-64748b.svg)](LICENSE)

**FoodBridge** is a food rescue and waste collection project. See [backend workflow contracts and rollout requirements](docs/BACKEND-API.md) and the [implementation checklist](docs/BACKEND-REMEDIATION.md) for validated behavior and remaining integration dependencies. It connects donors with verified recipient organizations, waste collectors and volunteer couriers through proximity matching and recorded collection outcomes.

---

## 🌟 Key Platform Capabilities

```
                       ┌───────────────────────────────┐
                       │       COMMERCIAL DONOR        │
                       │   (Hotels, Banquets, Retail)  │
                       └──────────────┬────────────────┘
                                      │
                         Surplus Food │ Organic / Recyclables
                                      ▼
               ┌──────────────────────────────────────────────┐
               │         FOODBRIDGE LOGISTICS ENGINE          │
               │  • District & Proximity Geo-Matching         │
               │  • Real-time Spoilage Prevention Timers      │
               │  • KYC Verification & Safety Audit Trails    │
               └──────────────┬────────────────┬──────────────┘
                              │                │
            Edible Surplus    │                │ Non-Edible Recyclables
                              ▼                ▼
     ┌─────────────────────────────┐      ┌─────────────────────────────┐
     │      VERIFIED CHARITIES     │      │   INDUSTRIAL RECYCLERS &    │
     │ (Shelters, Care Homes, NGOs)│      │     BIO-ENERGY PLANTS       │
     └──────────────▲──────────────┘      └──────────────▲──────────────┘
                    │                                    │
                    └─────────────────┬──────────────────┘
                                      │ Dispatch Logistics
                                      ▼
                       ┌───────────────────────────────┐
                       │     VOLUNTEER COURIER FLEET   │
                       │ (Last-Mile Cold Chain Routes) │
                       └───────────────────────────────┘
```

### 1. 🛡️ Trust, Governance & ESG Impact Command Center (`/admin`)
- **KYC/KYB Credential Verification:** Admin review and authorization for non-profit charities and recycling operators.
- **Account Moderation & Security:** Real-time user activation, suspension, and role-based access enforcement.
- **Real-Time Notification Hub:** High-priority in-app alerts on verification status, critical claims, and logistical handovers.
- **Public Impact Aggregator:** Cumulative monthly snapshots of estimated meals rescued and confirmed recycling/composting quantities. Emissions and water savings are not calculated.

### 2. 🍲 Commercial Food Donor Portal (`/donor`)
- Rapid posting of cooked meals, bakery products, and fresh groceries.
- Expiration timers, temperature controls, packaging specs, and pickup windows.
- Dual-channel surplus routing (edible food to charities, organic waste to composters).

### 3. 🤝 Charity & Shelter Allocation Engine (`/recipient`)
- District-based algorithmic feed matching nearby available surplus.
- Capacity-aware claims and automated volunteer dispatch triggers.
- Transparent organization profiles displaying verified credentials.

### 4. ♻️ Circular Waste Stream & Composting Hub (`/recycler`)
- Categorized intake routing: Plastic, Glass, Paper, Metal, and Organic Waste.
- Whole-batch claims and recorded processing outcomes; no environmental certification is issued.

### 5. 🚚 Community Logistics & Courier Dispatch (`/volunteer`)
- On-demand rescue mission acceptance.
- Location tracking and estimated travel distance; a road-routing provider remains unconfigured.
- Timestamped chain-of-custody logging.

---

## 🏗️ Technical Architecture

### **Backend (`backend/`)**
- **Runtime:** Node.js v20.19+ with Express 5
- **Database:** MongoDB with Mongoose ODM
- **Database consistency:** Replica-set transactions for allocation and delivery; database connection failures stop startup rather than switching datasets.
- **Security:** JSON Web Token (JWT) stateless auth with Bcrypt password hashing and custom RBAC middleware (`protect`, `authorize`)
- **Data Models:** `User`, `Organization`, `Donation`, `WasteRequest`, `Pickup`, `Notification`, `ImpactRecord`

### **Frontend (`frontend/`)**
- **Framework:** React 18 with Vite fast-refresh bundling
- **Routing:** React Router v7 with role-aware route guards (`ProtectedRoute`)
- **Icons:** Lucide React
- **Design System:** Clean enterprise theme with accessible color contrasts, responsive grids, interactive badges, and live KPI animations

---

## ⚡ Quickstart Guide

### Option A: 1-Command Full Stack Launch (Docker Compose)
To run the entire ecosystem (MongoDB, Node.js Backend API, and Nginx-served Frontend):
```bash
docker compose up --build
```
This stack uses Caddy and the configured domain; review `Caddyfile` and environment settings before starting it. For a standalone local HTTP stack, run `docker compose -f docker-compose.local.yml up --build` and visit **`http://localhost:8080`**. See the backend rollout requirements before using existing data.

---

### Option B: Local Development Setup

### Prerequisites
- Node.js v20.19+
- MongoDB replica set (local, Docker or Atlas); standalone MongoDB cannot execute the workflow transactions.

### 1. Database & Environment Configuration

Navigate to `backend/`:
```bash
cd backend
cp .env.example .env # or verify existing .env
```

Ensure `.env` contains:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/foodbridge?replicaSet=rs0
JWT_SECRET=your_jwt_production_secret
```

### 2. Seed Initial Platform Data

Optional and destructive: the command below now requires `ALLOW_DEMO_SEED=true` and an explicitly selected demo/test/local database. Never seed shared data. All newly seeded activity is marked as demonstration data.
```bash
cd backend
npm install
npm run seed
```

### 3. Run Backend Integration Tests & Start Server
```bash
npm test
npm run test:api
npm run dev
```
The API server will listen on `http://localhost:5000`.

### 4. Start Frontend Client
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🔑 Instant Interactive Demo Credentials

FoodBridge includes 1-click quick-fill buttons on the login page for rapid role evaluation:

| Portal | Role | Demo Email | Demo Password |
|---|---|---|---|
| **Trust & Governance** | Platform Admin | `admin@foodbridge.com` | `admin123` |
| **Commercial Donor** | Food Donor | `cinnamon@hotel.com` | `user123` |
| **Charity Allocation** | Verified NGO | `carehome@ngo.org` | `user123` |
| **Circular Recycling** | Recycler | `info@ecocycle.lk` | `user123` |
| **Courier Fleet** | Volunteer | `saman@volunteer.org` | `user123` |

---

## 🌍 Impact Calculation Methodology

Public impact uses confirmed, non-demo activity. Meal conversions are estimates from declared quantities; no validated emissions or water model is configured:

- **Meals Rescued:** Calculated from batch plate counts or standard 0.40 kg/meal conversion factors.
- **CO2e Avoided:** Not currently calculated; backend emissions estimates are unavailable.
- **Water Saved:** Not currently calculated.
- **Landfill Diversion:** Sum of organization-confirmed recycled and composted mass. Non-recyclable disposal is excluded.

---

## 📄 License & Intellectual Property

FoodBridge is released under the **MIT License**. Engineered for transparent, non-profit community food rescue networks and enterprise ESG compliance.

---

## Subdirectories & System Boundaries

- [backend](./backend/README.md) — Express 5 + Mongoose API (CommonJS, port 5000): `config`, `controllers`, `middleware`, `models`, `routes`, `scripts`, `services`, `test`, `utils`. Owns auth/RBAC, posting lifecycle, eligibility + smart matching, allocation/claims, pickup pipeline, cron, and impact aggregation. Each subdirectory has its own contract README.
- [frontend](./frontend/README.md) — React 18 + Vite SPA (port 5173 dev, `/api` proxied to the backend): `src/api`, `src/context`, `src/components`, `src/pages`, `src/modules/{admin,donor,recipient,recycler,volunteer}`, `src/utils`. Each subdirectory has its own contract README.

## Global Invariants

- Backend standalone start requires `JWT_SECRET` and `MONGO_URI`; there is no automatic fallback database, and DB connect failure stops startup [backend/server.js, backend/config/db.js].
- Multi-document mutations (claims, verification, complaints, org saves) require a MongoDB **replica set**; otherwise the transaction helper returns 503 [backend/utils/transaction.js].
- Public registration can never create an `admin` account; admin self-suspension/self-deletion is rejected; user deletion is a soft delete [backend/controllers/authController.js, backend/controllers/adminController.js].
- Only `/api/impact` is public; every other router applies `protect`, with role gates via `authorize` [backend/routes/*].
- Rate limits: 500 req/15 min/IP globally, 50 req/15 min/IP on `/api/auth`; CORS is an explicit allowlist (localhost defaults + `ALLOWED_ORIGINS`) [backend/server.js].
- All impact/reporting math excludes demo records (`isDemo: {$ne: true}`) and requires a real `completedAt` date; meals are estimated at 2.5 per kg; CO₂e/water figures are never invented [backend/controllers/impactController.js, backend/utils/quantity.js].
- `npm run seed` is guarded: it requires `ALLOW_DEMO_SEED=true` and a demo/test/local database name, and it deletes collections — never run it against shared data [backend/seed-module5.js].
- Frontend: all module routes are wrapped in `ProtectedRoute` (admin may enter every module route); `/api` dev proxy targets `http://localhost:5000` [frontend/src/App.jsx, frontend/src/components/ProtectedRoute.jsx, frontend/vite.config.js].
- CSV exports guard against formula injection and never invent metric values (fallback `0`, methodology note hard-coded) [frontend/src/utils/exportUtils.js].

## Global Side Effects

- MongoDB (replica set) is the single datastore; all persistence flows through the Mongoose models listed in [backend/models](./backend/models/README.md).
- Notification documents are written on verification/claim/pickup/complaint events [backend/utils/notificationService.js]; cron timers (15 min) expire overdue posts and take monthly impact snapshots [backend/services/cronService.js].
- Client-side: JWT + cached user persist in `localStorage` under `foodbridge_token` / `foodbridge_user` [frontend/src/api/client.js].
- Deployment: `docker compose up --build` (Caddy HTTPS stack) or `docker-compose.local.yml` (local HTTP on :8080); CI deploys to EC2 on `production`/`main` pushes [.github/workflows/ci.yml, docker-compose.yml].

## System Verification

- Run: `cd backend && npm run test:all` (module checks + disposable-Docker API suite)
- Run: `cd frontend && npm test && npm run build`
