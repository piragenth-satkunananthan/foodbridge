import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Sprout, LifeBuoy, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/client';
import { ROLE_LABEL, initials } from '../lib/format';
import { Button, Empty } from './ui';

function Notifications() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const ref = useRef(null);
  const load = () => fetchNotifications().then(setData).catch(() => {});
  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // shortcut: polling; upgrade to SSE/WebSocket if near-real-time is required
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const read = async (n) => { if (!n.readStatus) { await markNotificationRead(n._id).catch(() => {}); load(); } };
  const readAll = async () => { await markAllNotificationsRead().catch(() => {}); load(); };
  return (
    <div className="bell" ref={ref}>
      <Button variant="ghost" className="btn-icon" icon={Bell} aria-expanded={open} aria-label={`Notifications, ${data.unreadCount} unread`} onClick={() => setOpen((o) => !o)} />
      {data.unreadCount > 0 && <span className="bell-dot num" aria-hidden="true">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
      {open && (
        <div className="card popover" role="dialog" aria-label="Notifications">
          <div className="card-head">
            <h3>Notifications</h3>
            {data.unreadCount > 0 && <Button variant="ghost" size="sm" icon={CheckCheck} onClick={readAll}>Mark all read</Button>}
          </div>
          {data.notifications.length === 0 ? <Empty icon={Bell} title="You're all caught up" /> : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.notifications.map((n) => (
                <li key={n._id}>
                  <button type="button" onClick={() => read(n)} className="row-item w-full text-left" style={{ border: 0, background: 'none', cursor: 'pointer', padding: '12px 16px' }}>
                    <span aria-hidden="true" style={{ marginTop: 7, width: 7, height: 7, borderRadius: 9, flex: 'none', background: n.readStatus ? 'transparent' : 'var(--primary)' }} />
                    <span>
                      <span className={`block text-sm ${n.readStatus ? 'muted' : 'font-semibold'}`}>{n.message}</span>
                      <span className="block text-xs muted mt-1">{new Date(n.createdAt).toLocaleString()}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ nav, children }) {
  const { user, logout } = useAuth();
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => setNavOpen(false), [location.pathname]);
  const base = location.pathname.split('/')[1];
  const signOut = () => { logout(); navigate('/login'); };
  return (
    <div className={`shell ${navOpen ? 'nav-open' : ''}`}>
      <button className="scrim" aria-label="Close menu" onClick={() => setNavOpen(false)} />
      <aside className="sidebar" aria-label="Main navigation">
        <Link to="/" className="brand"><span className="brand-mark"><Sprout size={18} aria-hidden="true" /></span>FoodBridge</Link>
        <div className="nav-label">{ROLE_LABEL[user?.role]}</div>
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} aria-hidden="true" />{label}
          </NavLink>
        ))}
        {user?.role !== 'admin' && (
          <>
            <div className="nav-label">Account</div>
            <NavLink to={`/${base}/support`} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><LifeBuoy size={18} aria-hidden="true" />Support & reports</NavLink>
          </>
        )}
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold truncate">{user?.name}</div>
              <div className="text-xs muted truncate">{user?.district}</div>
            </div>
            <Button variant="ghost" className="btn-icon" icon={LogOut} onClick={signOut} aria-label="Sign out" />
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <Button variant="ghost" className="btn-icon menu-btn" icon={Menu} onClick={() => setNavOpen(true)} aria-label="Open menu" />
          <div className="flex-1" />
          <Notifications />
        </header>
        <main className="content" id="main">{children}</main>
      </div>
    </div>
  );
}
