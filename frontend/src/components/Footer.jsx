import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Heart, ArrowUpRight, MapPin, Utensils, FileText } from 'lucide-react';

export default function Footer() {
  const { pathname } = useLocation();

  if ((pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return null;
  }

  return (
    <footer id="civic-footer" className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Mission Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                <Utensils size={16} />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                FoodBridge<span className="text-emerald-700">.LK</span>
              </span>
            </Link>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Sri Lanka’s real-time food rescue and circular waste recovery network. Coordinating commercial kitchens, registered charities, certified recyclers, and volunteer couriers across all 25 districts.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
              <MapPin size={12} className="text-emerald-700 shrink-0" />
              <span>Active across 25 Sri Lankan Districts</span>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              &copy; {new Date().getFullYear()} FoodBridge. Open Civic Infrastructure.
            </p>
          </div>

          {/* Portals & Roles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Community Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link to="/donor" className="hover:text-emerald-700 transition-colors">
                  Commercial Food Donors
                </Link>
              </li>
              <li>
                <Link to="/recipient" className="hover:text-emerald-700 transition-colors">
                  Verified Charities &amp; Shelters
                </Link>
              </li>
              <li>
                <Link to="/recycler" className="hover:text-emerald-700 transition-colors">
                  Circular Recyclers &amp; Composters
                </Link>
              </li>
              <li>
                <Link to="/volunteer" className="hover:text-emerald-700 transition-colors">
                  Volunteer Courier Logistics
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-700 transition-colors">
                  Administrative Governance
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Protocols */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Food Safety Standards
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <a href="/#how-it-works" className="hover:text-emerald-700 transition-colors">
                  4-Stage Custody Protocol
                </a>
              </li>
              <li>
                <a href="/#streams" className="hover:text-emerald-700 transition-colors">
                  Dual-Stream Separation
                </a>
              </li>
              <li>
                <a href="/#districts" className="hover:text-emerald-700 transition-colors">
                  District Proximity Radius
                </a>
              </li>
              <li>
                <Link to="/impact" className="hover:text-emerald-700 transition-colors">
                  Audited Ledger &amp; Public Feed
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Truth & Audit Guarantee */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Anti-Greenwashing Pledge
            </h4>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
                <ShieldCheck size={15} className="text-emerald-700 shrink-0" />
                <span>Two-Party Verified Records</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                All platform metrics derive exclusively from completed handovers signed by both courier and recipient. We never substitute invented CO₂ or tree counts.
              </p>
            </div>
            <Link
              to="/impact"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-4"
            >
              <FileText size={13} />
              <span>View Public Ledger</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
