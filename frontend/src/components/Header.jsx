import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Utensils, Menu, X, ArrowRight, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Don't render general header on full admin command center
  if ((pathname === '/admin' || pathname.startsWith('/admin/')) && user?.role === 'admin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs group-hover:bg-emerald-800 transition-colors">
            <Utensils size={18} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-slate-900">
              FoodBridge
            </span>
            <span className="text-[10px] font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md">
              LK
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <a href="/#how-it-works" className="hover:text-emerald-800 transition-colors">
            How It Works
          </a>
          <a href="/#portals" className="hover:text-emerald-800 transition-colors">
            5 Portals
          </a>
          <a href="/#districts" className="hover:text-emerald-800 transition-colors">
            25 Districts
          </a>
          <Link
            to="/impact"
            className={`transition-colors ${
              pathname === '/impact' ? 'text-emerald-800 font-semibold' : 'hover:text-emerald-800'
            }`}
          >
            Public Impact
          </Link>
        </nav>

        {/* Right CTA / Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle className="theme-toggle-desktop" />
          {user ? (
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold capitalize bg-slate-100 text-slate-700 border border-slate-200/60">
                <ShieldCheck size={13} className="text-emerald-700" />
                {user.role}
              </span>
              <Link
                to={`/${user.role}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <LayoutDashboard size={14} />
                <span>My Portal</span>
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all hover:shadow-sm"
              >
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        <ThemeToggle className="theme-toggle-mobile" />

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
            <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              How It Works
            </a>
            <a href="/#portals" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              5 Portals
            </a>
            <a href="/#districts" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              25 Districts
            </a>
            <Link to="/impact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg hover:bg-slate-50">
              Public Impact
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  to={`/${user.role}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs text-center shadow-xs"
                >
                  Open {user.role.toUpperCase()} Portal
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs text-center"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 rounded-lg bg-emerald-700 text-white font-semibold text-xs text-center shadow-xs"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
