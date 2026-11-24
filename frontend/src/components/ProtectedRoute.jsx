import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../lib/format';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="auth-wrap muted" aria-busy="true">Checking your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />;
  return children;
}
