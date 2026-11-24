import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './modules/admin/AdminDashboard';
import DonorDashboard from './modules/donor/DonorDashboard';
import RecipientDashboard from './modules/recipient/RecipientDashboard';
import RecyclerDashboard from './modules/recycler/RecyclerDashboard';
import VolunteerDashboard from './modules/volunteer/VolunteerDashboard';

const role = (name, Page) => <ProtectedRoute allowedRoles={[name]}><Page /></ProtectedRoute>;

export default function App() {
  return (
    <div className="app-container">
      <Header />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/impact" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin/*" element={role('admin', AdminDashboard)} />
      <Route path="/donor/*" element={role('donor', DonorDashboard)} />
      <Route path="/recipient/*" element={role('recipient', RecipientDashboard)} />
      <Route path="/recycler/*" element={role('recycler', RecyclerDashboard)} />
      <Route path="/volunteer/*" element={role('volunteer', VolunteerDashboard)} />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </div>
  );
}
