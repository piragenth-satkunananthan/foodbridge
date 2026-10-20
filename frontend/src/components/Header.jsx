import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Globe, LogOut, ShieldCheck, MapPin } from 'lucide-react';

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
        {/* Brand Logo & System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-badge" style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 10px -2px rgba(5, 150, 105, 0.4)'
            }}>
              <Building2 size={20} />
            </div>
            <div className="logo-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ letterSpacing: '-0.03em' }}>FoodBridge</h1>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  border: '1px solid #a7f3d0',
                  textTransform: 'uppercase'
                }}>v2.0 ESG</span>
              </div>
              <p style={{ letterSpacing: '0.04em' }}>Circular Food Rescue & Impact Network</p>
            </div>
          </Link>

          {/* Operational Pulse Pill */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '7px',
            background: '#f8fafc',
            border: '1px solid var(--border)',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '11.5px',
            color: '#475569',
            fontWeight: '600'
          }} className="d-md-flex">
            <span className="pulse-dot green" />
            <span>Sri Lanka Grid Active</span>
          </div>
        </div>

        {/* Navigation items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/impact"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', fontWeight: '600' }}
          >
            <Globe size={15} color="#059669" />
            <span>Public Impact GIS</span>
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to={getDashboardPath(user.role)}
                className="btn btn-primary btn-sm btn-executive"
                style={{ textDecoration: 'none' }}
              >
                <span>Console ({user.role})</span>
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '4px 10px'
              }}>
                <div className="avatar-badge" style={{ width: '26px', height: '26px', fontSize: '11px' }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0f172a' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={10} color="#059669" />
                    <span>{user.district || 'National'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="icon-btn"
                title="Sign Out of Portal"
                style={{ width: '32px', height: '32px' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm btn-executive" style={{ textDecoration: 'none' }}>
                Join Platform
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
