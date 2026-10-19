import React from 'react';
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
    <header className="navbar">
      <div className="navbar-inner">
        {/* Logo and Module info */}
        <div className="logo-group">
          <div className="logo-badge">
            <Building2 size={20} />
          </div>
          <div className="logo-text">
            <h1>FoodBridge</h1>
            <p>Governance, Trust & Impact</p>
          </div>
        </div>

        {/* Central Tab Navigation */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools */}
        <div className="nav-actions">
          {/* Public Impact Preview Button */}
          <button
            onClick={openPublicImpact}
            className="btn btn-secondary btn-sm"
            title="Preview Public Impact View (Citizen perspective)"
          >
            <Globe size={15} />
            <span>Public Impact</span>
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={toggleNotifications}
            className="icon-btn"
            title="System Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="icon-indicator">{unreadCount}</span>}
          </button>

          {/* User profile info & logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
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
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
