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
