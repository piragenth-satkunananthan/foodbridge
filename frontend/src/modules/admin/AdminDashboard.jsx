import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import OverviewTab from './OverviewTab';
import VerificationTab from './VerificationTab';
import MonitoringTab from './MonitoringTab';
import UsersTab from './UsersTab';
import ReportsTab from './ReportsTab';
import PublicImpactModal from './PublicImpactModal';
import { useAuth } from '../../context/AuthContext';
import {
  fetchAdminStats,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../api/client';
import { Bell, X } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [notificationError, setNotificationError] = useState('');

  // Modals & Panels
  const [isImpactOpen, setIsImpactOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadStats = async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      setStats(null);
      setStatsError('Dashboard data could not be loaded.');
    } finally {
      setLoadingStats(false);
    }
  };

  const loadNotificationsData = async () => {
    setNotificationError('');
    try {
      const res = await fetchNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch {
      setNotificationError('Notifications could not be loaded.');
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadStats();
    loadNotificationsData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch { setNotificationError('The notification could not be updated. Please try again.'); return; }
    setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.readStatus) {
      try {
        await markNotificationRead(notif._id);
      } catch { setNotificationError('The notification could not be updated. Please try again.'); return; }
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, readStatus: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setIsNotificationsOpen(false);
    setActiveTab(notif.relatedType === 'organization' ? 'verification' : 'monitoring');
  };

  return (
    <div className="admin-page">
      {/* Top Admin Sub-Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={stats?.kpis?.pendingVerifications || 0}
        unreadCount={unreadCount}
        toggleNotifications={() => setIsNotificationsOpen((v) => !v)}
        openPublicImpact={() => setIsImpactOpen(true)}
        adminUser={user}
        onLogout={logout}
      />

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="notification-drawer">
          <div className="drawer-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={16} />
              <span>Platform Alerts ({unreadCount})</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleMarkAllRead}
                style={{ background: 'none', border: 'none', color: '#059669', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                Mark all read
              </button>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="drawer-content">
            {notificationError && <div role="alert" className="report-error">{notificationError} <button onClick={loadNotificationsData}>Try again</button></div>}
            {notificationError ? null : notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`notification-item ${!n.readStatus ? 'unread' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '9999px',
                    background: n.readStatus ? '#cbd5e1' : '#10b981',
                    marginTop: '5px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#1e293b', fontWeight: n.readStatus ? '400' : '600' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Active Tab View */}
      <main className="main-content">
        {activeTab === 'overview' && loadingStats && <p role="status">Loading dashboard…</p>}
        {activeTab === 'overview' && statsError && <div className="report-error" role="alert">{statsError} <button className="btn btn-secondary" onClick={loadStats}>Try again</button></div>}
        {activeTab === 'overview' && !loadingStats && stats && (
          <OverviewTab
            stats={stats}
            setActiveTab={setActiveTab}
            onRefresh={loadStats}
          />
        )}

        {activeTab === 'verification' && (
          <VerificationTab
            onVerificationUpdated={() => {
              loadStats();
              loadNotificationsData();
            }}
          />
        )}

        {activeTab === 'monitoring' && <MonitoringTab />}

        {activeTab === 'users' && <UsersTab currentAdminId={user?._id} />}

        {activeTab === 'reports' && <ReportsTab />}
      </main>

      {/* Public Impact Preview Modal */}
      <PublicImpactModal
        isOpen={isImpactOpen}
        onClose={() => setIsImpactOpen(false)}
      />
    </div>
  );
}
