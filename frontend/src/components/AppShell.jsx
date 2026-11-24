import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Bell, CheckCheck, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../api/client';

/** Bell + dropdown, styled like the original header controls. Used by Header for every signed-in role. */
export function Notifications() {
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
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={`Notifications, ${data.unreadCount} unread`}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer">
        <Bell size={18} aria-hidden="true" />
        {data.unreadCount > 0 && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold leading-[18px] text-center">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 top-full mt-2 w-[min(380px,calc(100vw-24px))] max-h-[460px] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
            {data.unreadCount > 0 && <button type="button" onClick={readAll} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 px-2 py-1.5 rounded-md hover:bg-emerald-50 cursor-pointer"><CheckCheck size={14} aria-hidden="true" />Mark all read</button>}
          </div>
          {data.notifications.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">You're all caught up.</p> : (
            <ul className="divide-y divide-slate-100">
              {data.notifications.map((n) => (
                <li key={n._id}>
                  <button type="button" onClick={() => read(n)} className={`w-full flex gap-3 text-left px-4 py-3 hover:bg-slate-50 ${n.readStatus ? 'cursor-default' : 'cursor-pointer'}`}>
                    <span aria-hidden="true" className={`mt-1.5 w-2 h-2 rounded-full flex-none ${n.readStatus ? 'bg-transparent' : 'bg-emerald-600'}`} />
                    <span>
                      <span className={`block text-sm ${n.readStatus ? 'text-slate-500' : 'text-slate-900 font-semibold'}`}>{n.message}</span>
                      <span className="block text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</span>
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

/** Dashboard wrapper: original-style pill tabs for the role's sections, then the page. Header/Footer live in App. */
export default function AppShell({ nav, children }) {
  const { user } = useAuth();
  const location = useLocation();
  const base = location.pathname.split('/')[1];
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  const items = user?.role === 'admin' ? nav : [...nav, { to: `/${base}/support`, label: 'Support', icon: LifeBuoy }];
  return (
    <main className="portal" id="main">
      <nav className="portal-tabs" aria-label="Sections">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `portal-tab ${isActive ? 'active' : ''}`}>
            <Icon size={15} aria-hidden="true" />{label}
          </NavLink>
        ))}
      </nav>
      {children}
    </main>
  );
}
