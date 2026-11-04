import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './ui/Button';
import '../styles/navigation.css';

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && user?.role === 'admin') return null;
  const closeMenu = event => {
    if (event.key === 'Escape' && open) { setOpen(false); menuRef.current?.focus(); }
  };
  return (
    <header className="fb-header" onKeyDown={closeMenu}>
      <div className="fb-header-inner">
        <Link to="/" className="fb-brand">FoodBridge<span aria-hidden="true">.</span></Link>
        <Button ref={menuRef} className="fb-menu-toggle" variant="secondary" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>{open ? 'Close' : 'Menu'}</Button>
        <nav id="site-navigation" className={`fb-navigation ${open ? 'is-open' : ''}`} aria-label="Main navigation" onClick={() => setOpen(false)}>
          <Link to="/impact" aria-current={pathname === '/impact' ? 'page' : undefined}>Community impact</Link>
          {user ? <><Button to={`/${user.role}`} variant="secondary">My dashboard</Button><Button variant="ghost" onClick={() => { logout(); navigate('/login'); }}>Sign out</Button></> : <><Button to="/login" variant="ghost">Sign in</Button><Button to="/register">Sign up</Button></>}
        </nav>
      </div>
    </header>
  );
}
