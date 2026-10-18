import React, { useState, useEffect } from 'react';
import {
  Globe,
  Utensils,
  Recycle,
  Leaf,
  MapPin,
  Building,
  Users,
  CheckCircle,
  Camera,
  X
} from 'lucide-react';
import { fetchPublicImpact, snapshotImpact } from '../../api/client';

export default function PublicImpactModal({ isOpen, onClose }) {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshotPeriod, setSnapshotPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [snapshotting, setSnapshotting] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState('');

  const loadImpact = async () => {
    setLoading(true);
    try {
      const data = await fetchPublicImpact();
      setImpactData(data);
    } catch (err) {
      console.error('Failed to load public impact:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadImpact();
      setSnapshotMsg('');
    }
  }, [isOpen]);

  const handleTakeSnapshot = async () => {
    setSnapshotting(true);
    setSnapshotMsg('');
    try {
      const res = await snapshotImpact(snapshotPeriod);
      setSnapshotMsg(`✔ Official Impact Record saved for period ${snapshotPeriod}`);
      loadImpact();
    } catch (err) {
      setSnapshotMsg(`Failed to save record: ${err.message}`);
    } finally {
      setSnapshotting(false);
    }
  };

  if (!isOpen) return null;

  const s = impactData?.summary || {
    mealsRescued: 0,
    totalKgRecycled: 0,
    kgRecycled: { plastic: 0, glass: 0, paper: 0, metal: 0 },
    kgOrganicDiverted: 0,
    districtsCoveredCount: 0,
    districtsCovered: []
  };

  const e = impactData?.ecosystem || {
    verifiedNGOs: 0,
    verifiedRecyclers: 0,
    activeVolunteers: 0
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '850px' }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px', borderRadius: '8px' }}>
              <Globe size={20} />
            </div>
            <div>
              <h2>Public Impact Dashboard (Live Preview)</h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                This is the transparent, publicly accessible impact data shown to donors, NGOs, and citizens.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Fetching live impact calculations...
          </div>
        ) : (
          <div>
            {/* Top Impact Hero Grid */}
            <div style={{
              background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
              color: 'white',
              borderRadius: '14px',
              padding: '24px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(6, 78, 59, 0.2)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Collective Community Impact
                </span>
                <h3 style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px' }}>
                  FoodBridge Sri Lanka
                </h3>
                <p style={{ fontSize: '13px', color: '#d1fae5', maxWidth: '480px', margin: '4px auto 0' }}>
                  Connecting surplus food donors with verified charities and diverting recyclables from municipal landfills.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '10px' }}>
                  <Utensils size={24} style={{ margin: '0 auto 6px', color: '#6ee7b7' }} />
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>{s.mealsRescued.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#d1fae5', fontWeight: '600' }}>Edible Meals Rescued</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '10px' }}>
                  <Recycle size={24} style={{ margin: '0 auto 6px', color: '#93c5fd' }} />
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>{s.totalKgRecycled} <span style={{ fontSize: '16px' }}>kg</span></div>
                  <div style={{ fontSize: '12px', color: '#d1fae5', fontWeight: '600' }}>Materials Recycled</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px', borderRadius: '10px' }}>
                  <Leaf size={24} style={{ margin: '0 auto 6px', color: '#fde047' }} />
                  <div style={{ fontSize: '28px', fontWeight: '800' }}>{s.kgOrganicDiverted} <span style={{ fontSize: '16px' }}>kg</span></div>
                  <div style={{ fontSize: '12px', color: '#d1fae5', fontWeight: '600' }}>Organic Waste Diverted</div>
                </div>
              </div>
            </div>

            {/* Recycled Breakdown Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>
                  Recycled Materials by Category
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Plastic Waste</span>
                    <strong>{s.kgRecycled?.plastic || 0} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Glass Containers</span>
                    <strong>{s.kgRecycled?.glass || 0} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Paper & Cardboard</span>
                    <strong>{s.kgRecycled?.paper || 0} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Metal Scraps</span>
                    <strong>{s.kgRecycled?.metal || 0} kg</strong>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#0f172a' }}>
                  Active Ecosystem Network
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Verified Charity Recipient Orgs</span>
                    <strong style={{ color: '#059669' }}>{e.verifiedNGOs} NGOs</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Registered Recycling Facilities</span>
                    <strong style={{ color: '#0284c7' }}>{e.verifiedRecyclers} Facilities</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Active Route Volunteers</span>
                    <strong style={{ color: '#7c3aed' }}>{e.activeVolunteers} Volunteers</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Districts Active</span>
                    <strong>{s.districtsCoveredCount} Districts</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Snapshot Trigger (Module 5 Requirement) */}
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13.5px', color: '#065f46' }}>
                  Official Monthly Impact Aggregation (Admin Action)
                </div>
                <div style={{ fontSize: '12px', color: '#047857' }}>
                  Records a permanent snapshot of current metrics into the <code>ImpactRecord</code> collection.
                </div>
                {snapshotMsg && (
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#047857', marginTop: '4px' }}>
                    {snapshotMsg}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="month"
                  className="form-input"
                  style={{ width: 'auto', padding: '5px 8px', fontSize: '12px' }}
                  value={snapshotPeriod}
                  onChange={(e) => setSnapshotPeriod(e.target.value)}
                />
                <button
                  onClick={handleTakeSnapshot}
                  className="btn btn-sm btn-primary"
                  disabled={snapshotting}
                >
                  <Camera size={14} />
                  <span>{snapshotting ? 'Saving...' : 'Snapshot Period'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
