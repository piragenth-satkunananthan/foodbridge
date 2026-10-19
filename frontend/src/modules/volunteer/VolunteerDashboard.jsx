import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Truck, MapPin, Navigation, CheckCircle, Package } from 'lucide-react';

export default function VolunteerDashboard() {
  const { user } = useAuth();

  return (
    <div className="main-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span className="badge volunteer" style={{ marginBottom: '6px' }}>Community Fleet & Logistics Hub</span>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Volunteer Hub — {user?.name || 'Volunteer'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            Pick up surplus food and recyclables, follow navigation routes, and track delivery progress.
          </p>
        </div>

        <button className="btn btn-secondary">
          <Navigation size={15} />
          <span>Active Route Map</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Available Transport & Delivery Jobs</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Location: {user?.district}</span>
        </div>

        <div className="empty-state">
          <Truck size={40} color="#cbd5e1" style={{ margin: '0 auto' }} />
          <h3>Active Transport & Route Dispatch</h3>
          <p>
            Discover nearby rescue jobs, navigate optimized routes between donor and charity hubs, and log verified handovers.
          </p>
        </div>
      </div>
    </div>
  );
}
