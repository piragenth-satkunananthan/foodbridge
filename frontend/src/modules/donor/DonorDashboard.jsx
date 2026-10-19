import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, PlusCircle, History, Clock, MapPin, Package } from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('postings');

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span className="badge donor" style={{ marginBottom: '6px' }}>Donor Operations Hub • Commercial & Retail</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Welcome, {user?.name || 'Food Donor'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            Register surplus edible food or recyclable waste for immediate routing and matching.
          </p>
        </div>

        <button className="btn btn-primary">
          <PlusCircle size={16} />
          <span>New Surplus Post</span>
        </button>
      </div>

      {/* KPI summary */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-icon green"><Utensils size={22} /></div>
          <div className="kpi-details">
            <h3>Active Food Donations</h3>
            <div className="kpi-value">2</div>
            <div className="kpi-sub">Ready for NGO pickup</div>
          </div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Package size={22} /></div>
          <div className="kpi-details">
            <h3>Waste Collection Requests</h3>
            <div className="kpi-value">1</div>
            <div className="kpi-sub">Plastic & organic recyclables</div>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-icon amber"><History size={22} /></div>
          <div className="kpi-details">
            <h3>Total Meals Diverted</h3>
            <div className="kpi-value">180</div>
            <div className="kpi-sub">Delivered to local shelters</div>
          </div>
        </div>
      </div>

      {/* Postings List Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Surplus Postings</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>District: {user?.district}</span>
        </div>

        <div className="empty-state">
          <Utensils size={40} color="#cbd5e1" style={{ margin: '0 auto' }} />
          <h3>Surplus Food & Material Dispatch Stream</h3>
          <p>
            Manage active surplus listings, multi-step nutritional and packaging logs, pickup scheduling, and track meal handovers to verified charities.
          </p>
        </div>
      </div>
    </div>
  );
}
