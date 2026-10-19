import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Module Dashboards
import AdminDashboard from './modules/admin/AdminDashboard';
import DonorDashboard from './modules/donor/DonorDashboard';
import RecipientDashboard from './modules/recipient/RecipientDashboard';
import RecyclerDashboard from './modules/recycler/RecyclerDashboard';
import VolunteerDashboard from './modules/volunteer/VolunteerDashboard';

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/impact" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Governance, Verification & ESG Impact Command Center */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Commercial Surplus Food & Waste Dispatch (Donor Portal) */}
        <Route
          path="/donor/*"
          element={
            <ProtectedRoute allowedRoles={['donor', 'admin']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Charity Allocation & Proximity Matching (Recipient Portal) */}
        <Route
          path="/recipient/*"
          element={
            <ProtectedRoute allowedRoles={['recipient', 'admin']}>
              <RecipientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Circular Waste Stream & Industrial Recycling (Recycler Hub) */}
        <Route
          path="/recycler/*"
          element={
            <ProtectedRoute allowedRoles={['recycler', 'admin']}>
              <RecyclerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Community Courier Fleet & Route Logistics (Volunteer Hub) */}
        <Route
          path="/volunteer/*"
          element={
            <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}
