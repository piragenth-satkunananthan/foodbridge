import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && user?.role === 'admin') return null;
  return (
    <header className="navbar site-header"><div className="navbar-inner">
      <Link to="/" className="site-brand" onClick={() => setOpen(false)}>FoodBridge<span className="brand-dot">.</span></Link>
      <button className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</button>
      <nav id="site-navigation" className={`site-navigation ${open ? 'is-open' : ''}`} aria-label="Main navigation" onClick={() => setOpen(false)}>
        <Link to="/impact" aria-current={pathname === '/impact' ? 'page' : undefined}>Community impact</Link>
        {user ? <><Link to={`/${user.role}`}>My dashboard</Link><button onClick={() => { logout(); navigate('/login'); }}>Sign out</button></> : <><Link to="/login">Sign in</Link><Link className="btn btn-primary" to="/register">Create an account</Link></>}
      </nav>
    </div></header>
  );
}
