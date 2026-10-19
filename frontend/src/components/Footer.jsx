import React from 'react';
import { Building2, Shield, Heart, Award, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-inner">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '32px' }}>
          {/* Brand & Mission */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div className="logo-badge" style={{ width: '32px', height: '32px' }}>
                <Building2 size={16} />
              </div>
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>FoodBridge</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, maxWidth: '320px' }}>
              Enterprise food rescue and circular waste routing network connecting hospitality donors with verified charities, certified recycling operators, and volunteer logistics.
            </p>
          </div>

          {/* Standards & Governance */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              <Shield size={16} color="#059669" />
              <span>Standards & Compliance</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
              <div><strong>ESG Impact:</strong> UN SDG 2 (Zero Hunger) & SDG 12 (Responsible Consumption)</div>
              <div><strong>Safety:</strong> Cold-Chain Guidelines & Donor Verification Protocols</div>
              <div><strong>Governance:</strong> Organization Credential Verification & Audit Logging</div>
            </div>
          </div>

          {/* Platform Solutions & Portals */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Platform Solutions & Portals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#64748b' }}>
              <Link to="/donor" style={{ color: '#475569', textDecoration: 'none' }}>• Commercial Food Donor Portal</Link>
              <Link to="/recipient" style={{ color: '#475569', textDecoration: 'none' }}>• Charity & Shelter Allocation Engine</Link>
              <Link to="/recycler" style={{ color: '#475569', textDecoration: 'none' }}>• Circular Materials & Composting Hub</Link>
              <Link to="/volunteer" style={{ color: '#475569', textDecoration: 'none' }}>• Volunteer Logistics & Courier Fleet</Link>
              <Link to="/admin" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}>• Trust, Safety & ESG Command Center</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: '#94a3b8'
        }}>
          <div>
            © {new Date().getFullYear()} FoodBridge Platform • Nationwide Food Rescue & Circular Waste Network. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Powered by Enterprise MERN Architecture (Express, MongoDB, React, Node.js)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
