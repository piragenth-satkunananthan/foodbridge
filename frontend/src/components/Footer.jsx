import React from 'react';
import { Building2, Shield, Heart, GraduationCap } from 'lucide-react';
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
              Smart food rescue and waste routing platform connecting surplus donors with verified charity recipients, licensed recycling facilities, and volunteer logistics.
            </p>
          </div>

          {/* Academic Project Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              <GraduationCap size={16} color="#059669" />
              <span>University Course Information</span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.8 }}>
              <div><strong>Course:</strong> SWT22022 Practical for Internet Application Development</div>
              <div><strong>Institution:</strong> South Eastern University of Sri Lanka (SEU)</div>
              <div><strong>Group:</strong> Group I • Group Assignment CA1</div>
            </div>
          </div>

          {/* Functional Modules Map */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Platform Functional Modules
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', color: '#64748b' }}>
              <Link to="/donor" style={{ color: '#475569', textDecoration: 'none' }}>• Module 1: Donor & Surplus Posting</Link>
              <Link to="/recipient" style={{ color: '#475569', textDecoration: 'none' }}>• Module 2: Proximity & Smart Matching</Link>
              <Link to="/recycler" style={{ color: '#475569', textDecoration: 'none' }}>• Module 3: Waste Stream Classification</Link>
              <Link to="/volunteer" style={{ color: '#475569', textDecoration: 'none' }}>• Module 4: Volunteer Route Tracking</Link>
              <Link to="/admin" style={{ color: '#059669', fontWeight: '600', textDecoration: 'none' }}>• Module 5: Admin, Verification & Impact</Link>
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
            © {new Date().getFullYear()} FoodBridge Platform • South Eastern University of Sri Lanka. All rights reserved.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Built with MERN Stack (MongoDB, Express, React, Node.js)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
