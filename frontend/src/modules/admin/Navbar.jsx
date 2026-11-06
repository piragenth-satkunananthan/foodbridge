import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, pendingCount = 0, unreadCount = 0, toggleNotifications, openPublicImpact, adminUser, onLogout }) {
  const navItems = [['overview', 'Overview'], ['verification', 'Organisations'], ['monitoring', 'Activity'], ['users', 'Users'], ['reports', 'Reports']];
  return (
    <header className="navbar admin-navbar">
      <div className="admin-topbar"><Link to="/" className="site-brand">FoodBridge<span className="brand-dot">.</span></Link><div className="admin-tools"><span className="admin-name">{adminUser?.name || 'Administrator'}</span><button className="text-action" onClick={openPublicImpact}>Public impact</button><button className="icon-btn" aria-label={`Notifications, ${unreadCount} unread`} onClick={toggleNotifications}><Bell size={18} />{unreadCount > 0 && <span className="icon-indicator">{unreadCount}</span>}</button><button className="icon-btn" aria-label="Sign out" onClick={onLogout}><LogOut size={18} /></button></div></div>
      <nav className="admin-sections" aria-label="Administration">{navItems.map(([id, label]) => <button key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)}>{label}{id === 'verification' && pendingCount > 0 && <span className="review-count">{pendingCount}</span>}</button>)}</nav>
    </header>
  );
}
