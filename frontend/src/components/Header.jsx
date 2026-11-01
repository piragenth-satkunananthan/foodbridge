import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && user?.role === 'admin') return null;
  return (
    <header className="navbar site-header"><div className="navbar-inner">
      <Link to="/" className="site-brand">FoodBridge</Link>
      <nav className="report-actions" aria-label="Main navigation">
        <Link to="/impact" className="btn btn-secondary">Community impact</Link>
        {user ? <>
          <Link className="btn btn-primary" to={`/${user.role}`}>My dashboard</Link>
          <button className="btn btn-secondary" onClick={() => { logout(); navigate('/login'); }}>Sign out</button>
        </> : <><Link className="btn btn-secondary" to="/login">Sign in</Link><Link className="btn btn-primary" to="/register">Create an account</Link></>}
      </nav>
    </div></header>
  );
}
