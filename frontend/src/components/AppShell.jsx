import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Sprout, LifeBuoy, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/client';
import { ROLE_LABEL, initials } from '../lib/format';
import { Button, Empty } from './ui';

export function Wordmark({ to = '/' }) {
  return <Link to={to} className="wordmark"><Sprout size={24} aria-hidden="true" />FoodBridge</Link>;
}

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
      {data.unreadCount > 0 && <span className="bell-dot" aria-hidden="true">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
      {open && (
        <div className="card popover" role="dialog" aria-label="Notifications">
          <div className="card-head">
            <h3>Notices</h3>
            {data.unreadCount > 0 && <Button variant="ghost" size="sm" icon={CheckCheck} onClick={readAll}>Mark all read</Button>}
          </div>
          {data.notifications.length === 0 ? <Empty icon={Bell} title="Nothing new" /> : (
            <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.notifications.map((n) => (
                <li key={n._id}>
                  <button type="button" onClick={() => read(n)} className="row-item w-full text-left" style={{ border: 0, background: 'none', cursor: n.readStatus ? 'default' : 'pointer', padding: '12px 16px' }}>
                    <span aria-hidden="true" style={{ marginTop: 7, width: 7, height: 7, borderRadius: 9, flex: 'none', background: n.readStatus ? 'transparent' : 'var(--terra)' }} />
                    <span>
                      <span className={`block text-sm ${n.readStatus ? 'muted' : 'font-semibold'}`}>{n.message}</span>
                      <span className="block text-xs muted mt-1 mono">{new Date(n.createdAt).toLocaleString()}</span>
                    </span>
                    {!n.readStatus && <span className="sr-only">Unread — activate to mark as read</span>}
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

const today = new Intl.DateTimeFormat('en-LK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function AppShell({ nav, children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const base = location.pathname.split('/')[1];
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  const signOut = () => { logout(); navigate('/login'); };
  const items = user?.role === 'admin' ? nav : [...nav, { to: `/${base}/support`, label: 'Support', icon: LifeBuoy }];
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <header className="masthead">
        <div className="wrap">
          <div className="masthead-top">
            <Wordmark to={`/${base}`} />
            <span className="desk">{ROLE_LABEL[user?.role]} desk</span>
            <div className="flex-1" />
            <span className="mono text-xs muted hidden lg:inline">{today.format(new Date())} · {user?.district}</span>
            <Notifications />
            <div className="user-chip">
              <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
              <span className="hidden md:block text-sm font-semibold max-w-[180px] truncate">{user?.name}</span>
              <Button variant="ghost" className="btn-icon" icon={LogOut} onClick={signOut} aria-label="Sign out" title="Sign out" />
            </div>
          </div>
          <nav className="masthead-nav" aria-label="Sections">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={16} aria-hidden="true" />{label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="content" id="main">{children}</main>
    </>
  );
}
