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

        {/* Module 5: Admin & Impact Dashboard */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Module 1: Donor & Surplus Posting */}
        <Route
          path="/donor/*"
          element={
            <ProtectedRoute allowedRoles={['donor', 'admin']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Module 2: Recipient Smart Matching */}
        <Route
          path="/recipient/*"
          element={
            <ProtectedRoute allowedRoles={['recipient', 'admin']}>
              <RecipientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Module 3: Waste Classification & Recycler */}
        <Route
          path="/recycler/*"
          element={
            <ProtectedRoute allowedRoles={['recycler', 'admin']}>
              <RecyclerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Module 4: Volunteer Pickup & Tracking */}
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
