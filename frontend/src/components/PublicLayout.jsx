import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../lib/format';

export default function PublicLayout({ children }) {
  const { user } = useAuth();
  return (
    <>
      <header className="site-header">
        <nav className="wrap site-nav" aria-label="Site">
          <Link to="/" className="brand" style={{ padding: 0 }}><span className="brand-mark"><Sprout size={18} aria-hidden="true" /></span>FoodBridge</Link>
          <div className="flex items-center gap-2">
            <Link to="/#impact" className="btn btn-ghost hidden sm:inline-flex">Impact</Link>
            {user ? (
              <Link to={ROLE_HOME[user.role] || '/'} className="btn btn-primary">Open dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Sign in</Link>
                <Link to="/register" className="btn btn-primary">Join</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="wrap flex flex-wrap justify-between gap-4">
          <span>© {new Date().getFullYear()} FoodBridge · Food rescue and waste routing for Sri Lanka</span>
          <span>Receiving organisations remain responsible for final food acceptance.</span>
        </div>
      </footer>
    </>
  );
}
