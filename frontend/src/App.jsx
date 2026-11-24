import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
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

const TITLES = { '/': 'FoodBridge | Food sharing and waste collection', '/login': 'Sign in · FoodBridge', '/register': 'Create an account · FoodBridge', '/impact': 'Community impact · FoodBridge' };

// Scrolls to #section links (also when arriving from another page) and to the top on page changes; sets public page titles.
function NavigationEffects() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (TITLES[pathname]) document.title = TITLES[pathname]; }, [pathname]);
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return undefined; }
    let tries = 0;
    const timer = setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el || ++tries > 40) { clearInterval(timer); el?.scrollIntoView(); }
    }, 50);
    return () => clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <div className="app-container">
      <NavigationEffects />
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
