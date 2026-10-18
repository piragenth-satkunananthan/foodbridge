import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Recycle, Package, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function RecyclerDashboard() {
  const { user } = useAuth();

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span className="badge recycler" style={{ marginBottom: '6px' }}>Module 3 • Recycler & Composter</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Recycling Facility — {user?.name || 'Recycler'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            Accept and collect sorted recyclable materials (plastic, glass, paper, metal, organic).
          </p>
        </div>

        {user?.verificationStatus === 'verified' ? (
          <span className="badge verified" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <ShieldCheck size={16} /> Licensed Facility
          </span>
        ) : (
          <span className="badge pending" style={{ padding: '6px 12px', fontSize: '13px' }}>
            <Clock size={16} /> Verification Pending
          </span>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Available Waste Collection Batches</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Filtered by handled material streams</span>
        </div>

        <div className="empty-state">
          <Recycle size={40} color="#cbd5e1" style={{ margin: '0 auto' }} />
          <h3>Module 3: Waste Classification & Recycler Routing</h3>
          <p>
            This module is designated for waste classification, stream routing (plastic/glass/paper/metal/organic), and collector job claims.
          </p>
        </div>
      </div>
    </div>
  );
}
