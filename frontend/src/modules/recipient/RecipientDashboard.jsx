import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { HeartHandshake, MapPin, Clock, Search, ShieldCheck } from 'lucide-react';

export default function RecipientDashboard() {
  const { user } = useAuth();

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span className="badge recipient" style={{ marginBottom: '6px' }}>Charity & Shelter Allocation Portal</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Recipient Portal — {user?.name || 'NGO / Charity'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            District-based smart matching to discover and claim nearby surplus food before expiry.
          </p>
        </div>

        {user?.verificationStatus === 'verified' ? (
          <span className="badge verified" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <ShieldCheck size={16} /> Verified Organization
          </span>
        ) : (
          <span className="badge pending" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Clock size={16} /> Verification Pending Admin Review
          </span>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Nearby Available Surplus Food</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Ranked by proximity in {user?.district}</span>
        </div>

        <div className="empty-state">
          <HeartHandshake size={40} color="#cbd5e1" style={{ margin: '0 auto' }} />
          <h3>Smart Proximity Matching Engine</h3>
          <p>
            Discover verified food surplus in your district, submit instant allocation requests, and coordinate volunteer courier logistics.
          </p>
        </div>
      </div>
    </div>
  );
}
