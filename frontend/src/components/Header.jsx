import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Globe, LogOut, User, ShieldCheck } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'admin': return '/admin';
      case 'donor': return '/donor';
      case 'recipient': return '/recipient';
      case 'recycler': return '/recycler';
      case 'volunteer': return '/volunteer';
      default: return '/';
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="logo-badge">
            <Building2 size={20} />
          </div>
          <div className="logo-text">
            <h1>FoodBridge</h1>
            <p>Smart Food Rescue & Waste Management</p>
          </div>
        </Link>

        {/* Navigation items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/impact" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            <Globe size={15} />
            <span>Public Impact</span>
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to={getDashboardPath(user.role)}
                className="btn btn-primary btn-sm"
                style={{ textDecoration: 'none' }}
              >
                <span>Dashboard ({user.role})</span>
              </Link>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', textTransform: 'capitalize' }}>
                  {user.district} • {user.role}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="icon-btn"
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Join Platform
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
