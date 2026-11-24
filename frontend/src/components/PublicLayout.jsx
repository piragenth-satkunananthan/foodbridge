import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../lib/format';
import { Wordmark } from './AppShell';

const today = new Intl.DateTimeFormat('en-LK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export default function PublicLayout({ children }) {
  const { user } = useAuth();
  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      <header className="site-header masthead">
        <div className="wrap">
          <nav className="site-nav" aria-label="Site">
            <Wordmark />
            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/#impact" className="btn btn-ghost hidden sm:inline-flex">Impact</Link>
              <Link to="/#how" className="btn btn-ghost hidden sm:inline-flex">How it works</Link>
              {user ? (
                <Link to={ROLE_HOME[user.role] || '/'} className="btn btn-primary">Open your desk</Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">Sign in</Link>
                  <Link to="/register" className="btn btn-primary">Join</Link>
                </>
              )}
            </div>
          </nav>
          <div className="dateline"><span>{today.format(new Date())}</span><span>Food rescue &amp; waste routing · Sri Lanka</span></div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="wrap"><div className="flex flex-wrap justify-between gap-4 border-t border-[var(--ink)] pt-5">
          <span>© {new Date().getFullYear()} FoodBridge — a community platform for surplus food and waste.</span>
          <span>Receiving organisations make the final food-safety decision on arrival.</span>
        </div></div>
      </footer>
    </>
  );
}
