import React from 'react';
import { Building2, Shield, Heart, Award, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="footer-container" style={{
      background: '#ffffff',
      borderTop: '1px solid #e5e7eb',
      padding: '56px 24px 36px',
      position: 'relative'
    }}>
      <div className="footer-inner" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '36px', marginBottom: '40px' }}>
          {/* Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div className="logo-badge" style={{
                width: '34px',
                height: '34px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 4px 10px -2px rgba(5, 150, 105, 0.4)',
                borderRadius: '10px'
              }}>
                <Building2 size={18} />
              </div>
              <span style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.03em' }}>
                FoodBridge
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, maxWidth: '340px' }}>
              Enterprise food rescue and circular waste routing network connecting hospitality donors with verified charities, certified recycling operators, and volunteer logistics.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
              <span className="badge verified" style={{ fontSize: '11px', padding: '4px 10px' }}>
                <span className="pulse-indicator" style={{ width: '6px', height: '6px' }}>
                  <span className="pulse-indicator-ping" style={{ width: '6px', height: '6px' }} />
                  <span className="pulse-indicator-dot" style={{ width: '6px', height: '6px' }} />
                </span>
                <span>ISO 14001 & UN SDG Compliant</span>
              </span>
            </div>
          </div>

          {/* Standards & Governance */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
              <Shield size={16} color="#059669" />
              <span>Standards & Compliance</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.9 }}>
              <div><strong style={{ color: '#334155' }}>ESG Impact:</strong> UN SDG 2 (Zero Hunger) & SDG 12 (Responsible Consumption)</div>
              <div><strong style={{ color: '#334155' }}>Food Safety:</strong> Cold-Chain Guidelines & Donor Verification Protocols</div>
              <div><strong style={{ color: '#334155' }}>Governance:</strong> Institutional KYC Verification & Immutable Audit Logging</div>
            </div>
          </div>

          {/* Platform Solutions & Portals */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
              Enterprise Ecosystem
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <Link to="/donor" style={{ color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s ease' }}>
                <span>• Commercial Food Donor Portal</span>
              </Link>
              <Link to="/recipient" style={{ color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s ease' }}>
                <span>• Charity & Shelter Allocation Engine</span>
              </Link>
              <Link to="/recycler" style={{ color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s ease' }}>
                <span>• Circular Materials & Composting Hub</span>
              </Link>
              <Link to="/volunteer" style={{ color: '#475569', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s ease' }}>
                <span>• Volunteer Logistics & Courier Fleet</span>
              </Link>
              <Link to="/admin" style={{ color: '#059669', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span>• Trust, Safety & ESG Command Center</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <div>
            © {new Date().getFullYear()} FoodBridge Platform • Sri Lanka Circular Food Rescue & ESG Network. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>Enterprise MERN Stack</span>
            <span>•</span>
            <span>GIS Logistics</span>
            <span>•</span>
            <span>Live Audit Trail</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
