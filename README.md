# FoodBridge™ — Smart Food Rescue & Circular Waste Network

[![CI/CD Pipeline](https://github.com/piragenth-satkunananthan/foodbridge/actions/workflows/ci.yml/badge.svg)](https://github.com/piragenth-satkunananthan/foodbridge/actions/workflows/ci.yml)
[![Platform Status](https://img.shields.io/badge/status-production--ready-059669.svg)](#)
[![Stack](https://img.shields.io/badge/stack-MERN-10b981.svg)](#)
[![UN SDG 2](https://img.shields.io/badge/UN%20SDG-Zero%20Hunger-eab308.svg)](https://sdgs.un.org/goals/goal2)
[![UN SDG 12](https://img.shields.io/badge/UN%20SDG-Responsible%20Consumption-f97316.svg)](https://sdgs.un.org/goals/goal12)
[![License](https://img.shields.io/badge/license-MIT-64748b.svg)](LICENSE)

**FoodBridge** is an enterprise-grade digital logistics and governance platform engineered to eliminate food waste and hunger. It connects commercial donors (hotels, restaurants, event venues) with verified charities, certified industrial recycling operators, and community volunteer couriers through intelligent proximity matching and auditable ESG tracking.

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
- **Public Impact Aggregator:** Monthly snapshots calculating meals rescued, landfill diversion in kg, and CO₂e / water savings.

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
- Bulk batch claim management and environmental diversion certificates.

### 5. 🚚 Community Logistics & Courier Dispatch (`/volunteer`)
- On-demand rescue mission acceptance.
- Turn-by-turn route navigation between donor premises and charity destinations.
- Timestamped chain-of-custody logging.

---

## 🏗️ Technical Architecture

### **Backend (`backend/`)**
- **Runtime:** Node.js v20+ with Express 5
- **Database:** MongoDB with Mongoose ODM
- **Resilience:** Dual-tier database connection (Auto-failover between remote AWS EC2 cluster and local Docker MongoDB instance)
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
Then visit **`http://localhost:5173`** in your browser.

---

### Option B: Local Development Setup

### Prerequisites
- Node.js (v18 or v20+)
- MongoDB (Local service, Docker container, or MongoDB Atlas / remote EC2 URI)

### 1. Database & Environment Configuration

Navigate to `backend/`:
```bash
cd backend
cp .env.example .env # or verify existing .env
```

Ensure `.env` contains:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/foodbridge
JWT_SECRET=your_jwt_production_secret
```

### 2. Seed Initial Platform Data
```bash
cd backend
npm install
npm run seed
```

### 3. Run Backend Integration Tests & Start Server
```bash
npm test
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

Environmental and social impact metrics follow recognized United Nations Food and Agriculture Organization (FAO) and EPA WARM methodologies:

- **Meals Rescued:** Calculated from batch plate counts or standard 0.40 kg/meal conversion factors.
- **CO₂e Avoided:** $2.5 \text{ kg CO}_2\text{e}$ mitigated per 1.0 kg of food diverted from anaerobic landfill decomposition.
- **Water Saved:** 850 Liters of embodied water footprint conserved per 1.0 kg of rescued agricultural produce.
- **Landfill Diversion:** Direct sum of certified recycled plastic, glass, paper, metal, and organic compost batches.

---

## 📄 License & Intellectual Property

FoodBridge is released under the **MIT License**. Engineered for transparent, non-profit community food rescue networks and enterprise ESG compliance.
