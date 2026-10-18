import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        Verifying user credentials...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's appropriate role dashboard
    const roleRoutes = {
      admin: '/admin',
      donor: '/donor',
      recipient: '/recipient',
      recycler: '/recycler',
      volunteer: '/volunteer'
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return children;
}
