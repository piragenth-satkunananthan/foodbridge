import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Building2, Globe, LogOut, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';

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
    <header className="navbar" style={{
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
    }}>
      <div className="navbar-inner">
        {/* Brand Logo & System Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="logo-badge"
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.4)',
                borderRadius: '10px'
              }}
            >
              <Building2 size={20} />
            </motion.div>
            <div className="logo-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ letterSpacing: '-0.035em', fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
                  FoodBridge
                </h1>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#059669',
                  background: '#ecfdf5',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  border: '1px solid #a7f3d0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  v2.0 ESG
                </span>
              </div>
              <p style={{ letterSpacing: '0.04em', fontSize: '11px', color: '#64748b' }}>
                Circular Food Rescue & Impact Network
              </p>
            </div>
          </Link>

          {/* Operational Pulse Pill */}
          <div style={{
            display: 'none',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '11.5px',
            color: '#334155',
            fontWeight: '600',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }} className="d-md-flex">
            <span className="pulse-indicator">
              <span className="pulse-indicator-ping" />
              <span className="pulse-indicator-dot" />
            </span>
            <span>Sri Lanka Grid Active</span>
          </div>
        </div>

        {/* Navigation items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/impact"
            className="plaid-btn-light"
            style={{ textDecoration: 'none', fontSize: '12.5px', padding: '7px 14px' }}
          >
            <Globe size={15} color="#059669" />
            <span>Public Impact GIS</span>
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link
                to={getDashboardPath(user.role)}
                className="plaid-btn-emerald"
                style={{ textDecoration: 'none', fontSize: '12.5px', padding: '7px 15px' }}
              >
                <span>Console ({user.role})</span>
                <ArrowRight size={14} />
              </Link>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '4px 10px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
              }}>
                <div className="avatar-badge" style={{
                  width: '26px',
                  height: '26px',
                  fontSize: '11px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700'
                }}>
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
                style={{ width: '34px', height: '34px' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link
                to="/login"
                className="plaid-btn-light"
                style={{ textDecoration: 'none', fontSize: '13px', padding: '7px 15px' }}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="plaid-btn-emerald"
                style={{ textDecoration: 'none', fontSize: '13px', padding: '7px 16px' }}
              >
                <span>Join Platform</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
