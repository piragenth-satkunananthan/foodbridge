# FoodBridge — Module 5: Admin, Verification & Impact Dashboard

This is the administrator portal for FoodBridge, built as part of **Module 5 (Admin, Verification, Notifications & Impact Dashboard)**.

---

## ✨ Features Implemented

1. **Organization Verification Queue:**
   - Filter NGOs, shelters, and recycling operators by status (`pending`, `verified`, `rejected`) and type.
   - Inspect government registration / license credentials.
   - Issue **Verified** credentials or **Reject** with feedback remarks.
   - Automated in-app notifications sent directly to the organization's user account upon decision.

2. **Operations & Live Monitoring Center:**
   - Real-time visibility into all **Food Donations** (Module 1 / 2).
   - Real-time visibility into all **Waste Requests** categorized by stream: plastic, glass, paper, metal, organic (Module 3).
   - Live status pipeline for **Pickups & Deliveries** (Module 4).

3. **User & Fake Account Management:**
   - Searchable directory of all registered users across the 5 roles (Donor, Recipient, Volunteer, Recycler, Admin).
   - Action to **Suspend / Reactivate** accounts violating platform guidelines.
   - Action to permanently **Delete / Ban** fake accounts.

4. **Performance & Audit Reports:**
   - Regional analysis by district (Colombo, Kandy, Gampaha, Batticaloa, Galle, Jaffna).
   - Real-time calculation of donation fulfillment rate and waste diversion success rate.
   - One-click export of platform audit records to JSON.

5. **Public Impact Dashboard (`/api/impact`):**
   - Public view accessible to citizens and donors without requiring login credentials.
   - Real-time counters:
     - 🍲 **Meals Rescued** (converted using standard FAO food rescue metrics).
     - ♻️ **Recycled Materials** (kg breakdown for plastic, glass, paper, metal).
     - 🌱 **Organic Waste Diverted** (kg routed to composting and bio-conversion).
     - 🗺️ **Active Districts Covered**.
   - Admin snapshot button to archive periodic records into the `ImpactRecord` collection.

6. **In-App Notification Center:**
   - Notification bell with unread badge counter in the top navigation.
   - Slide-out alert drawer with one-click "Mark all read" and direct links to pending items.

---

## 🚀 How to Run Locally

### 1. Start the Backend API
```bash
cd backend
npm install
npm test            # Runs the Module 5 test suite
npm run seed        # Seeds demo organizations, donations & users
npm run dev         # Starts server on http://localhost:5000
```

### 2. Start the Admin Frontend
```bash
cd frontend/Admin
npm install
npm run dev         # Starts Vite on http://localhost:3000
```

Open `http://localhost:3000` in your browser. You can use the **1-Click Quick Demo Login** button or enter `admin@foodbridge.com` / `admin123`.
