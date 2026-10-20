import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  CheckCircle,
  Activity,
  Users,
  BarChart3,
  Globe,
  Bell,
  LogOut,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  pendingCount = 0,
  unreadCount = 0,
  toggleNotifications,
  openPublicImpact,
  adminUser,
  onLogout
}) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'verification', label: 'Verification', icon: CheckCircle, badge: pendingCount },
    { id: 'monitoring', label: 'Monitoring', icon: Activity },
    { id: 'users', label: 'Users & Accounts', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <header className="navbar" style={{
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div className="navbar-inner">
        {/* Logo and Module info */}
        <div className="logo-group">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="logo-badge"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 10px -2px rgba(5, 150, 105, 0.4)',
              borderRadius: '10px'
            }}
          >
            <Building2 size={20} />
          </motion.div>
          <div className="logo-text">
            <h1 style={{ letterSpacing: '-0.03em', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>FoodBridge</h1>
            <p style={{ letterSpacing: '0.04em', fontSize: '11px', color: '#64748b' }}>Governance, Trust & Impact</p>
          </div>
        </div>

        {/* Central Tab Navigation with Animated Pills */}
        <nav className="nav-links" style={{ background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{
                  position: 'relative',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </motion.button>
            );
          })}
        </nav>

        {/* Right Action Tools */}
        <div className="nav-actions">
          {/* Public Impact Preview Button */}
          <button
            onClick={openPublicImpact}
            className="plaid-btn-light"
            style={{ fontSize: '12.5px', padding: '6px 14px' }}
            title="Preview Public Impact View (Citizen perspective)"
          >
            <Globe size={15} color="#059669" />
            <span>Public Impact</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={toggleNotifications}
            className="icon-btn"
            title="System Notifications"
            style={{ borderRadius: '10px' }}
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="icon-indicator">{unreadCount}</span>}
          </button>

          {/* User profile info & logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #e2e8f0', paddingLeft: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                {adminUser?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                <ShieldCheck size={12} />
                <span>Verified Admin</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="icon-btn"
              title="Sign Out"
              style={{ borderRadius: '10px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
