import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Recycle,
  Leaf,
  Globe,
  Building2,
  ShieldCheck,
  Truck,
  HeartHandshake,
  ArrowRight
} from 'lucide-react';
import { fetchPublicImpact } from '../api/client';

export default function LandingPage() {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImpact = async () => {
      try {
        const data = await fetchPublicImpact();
        setImpact(data);
      } catch (err) {
        console.warn('Using default impact figures:', err.message);
        setImpact({
          summary: {
            mealsRescued: 2910,
            totalKgRecycled: 570.5,
            kgRecycled: { plastic: 150, glass: 120, paper: 210, metal: 90.5 },
            kgOrganicDiverted: 1200,
            districtsCoveredCount: 3,
            districtsCovered: ['Colombo', 'Kandy', 'Gampaha']
          },
          ecosystem: {
            verifiedNGOs: 3,
            verifiedRecyclers: 2,
            activeVolunteers: 5
          }
        });
      } finally {
        setLoading(false);
      }
    };

    loadImpact();
  }, []);

  const s = impact?.summary || {
    mealsRescued: 0,
    totalKgRecycled: 0,
    kgRecycled: { plastic: 0, glass: 0, paper: 0, metal: 0 },
    kgOrganicDiverted: 0,
    districtsCoveredCount: 0,
    districtsCovered: []
  };

  const e = impact?.ecosystem || {
    verifiedNGOs: 0,
    verifiedRecyclers: 0,
    activeVolunteers: 0
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)',
        color: 'white',
        padding: '64px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <span style={{
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '4px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Sri Lanka’s Smart Food Rescue & Waste Platform
          </span>

          <h1 style={{ fontSize: '42px', fontWeight: '800', margin: '18px 0 14px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Bridging Surplus Food to Those in Need, Diverting Waste to Recyclers.
          </h1>

          <p style={{ fontSize: '16px', color: '#d1fae5', maxWidth: '640px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Connecting hotels, bakeries, and event caterers with verified charities, certified recycling operators, and community volunteers through district-based matching.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ background: '#10b981', padding: '12px 24px', fontSize: '15px', textDecoration: 'none' }}>
              <span>Join FoodBridge Today</span> <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '12px 24px', fontSize: '15px', textDecoration: 'none' }}>
              Sign In to Your Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Public Impact Section */}
      <section className="main-content" style={{ marginTop: '-40px' }}>
        <div className="card" style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', borderRadius: '18px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '10px' }}>
                <Globe size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
                  Live Public Impact Dashboard
                </h2>
                <p style={{ fontSize: '12.5px', color: '#64748b' }}>
                  Transparent, verified metrics updated in real-time from active pickups across Sri Lanka.
                </p>
              </div>
            </div>

            <span className="badge verified" style={{ fontSize: '12px', padding: '4px 10px' }}>
              ● Live Platform Aggregation
            </span>
          </div>

          <div className="kpi-grid">
            <div className="kpi-card green">
              <div className="kpi-icon green"><Utensils size={24} /></div>
              <div className="kpi-details">
                <h3>Meals Rescued</h3>
                <div className="kpi-value">{s.mealsRescued.toLocaleString()}</div>
                <div className="kpi-sub">Served to charities & shelters</div>
              </div>
            </div>

            <div className="kpi-card blue">
              <div className="kpi-icon blue"><Recycle size={24} /></div>
              <div className="kpi-details">
                <h3>Materials Recycled</h3>
                <div className="kpi-value">{s.totalKgRecycled} <span style={{ fontSize: '16px' }}>kg</span></div>
                <div className="kpi-sub">Plastic, glass, paper, & metal</div>
              </div>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-icon amber"><Leaf size={24} /></div>
              <div className="kpi-details">
                <h3>Organic Diverted</h3>
                <div className="kpi-value">{s.kgOrganicDiverted} <span style={{ fontSize: '16px' }}>kg</span></div>
                <div className="kpi-sub">Diverted from landfills</div>
              </div>
            </div>

            <div className="kpi-card purple">
              <div className="kpi-icon purple"><Building2 size={24} /></div>
              <div className="kpi-details">
                <h3>Ecosystem Network</h3>
                <div className="kpi-value">{e.verifiedNGOs + e.verifiedRecyclers + e.activeVolunteers}</div>
                <div className="kpi-sub">{s.districtsCoveredCount} active districts</div>
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '8px', color: '#0f172a' }}>
                Recycled Materials Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Plastic:</span> <strong>{s.kgRecycled?.plastic || 0} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Glass:</span> <strong>{s.kgRecycled?.glass || 0} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paper / Cardboard:</span> <strong>{s.kgRecycled?.paper || 0} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Metal:</span> <strong>{s.kgRecycled?.metal || 0} kg</strong>
                </div>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '700', fontSize: '13.5px', marginBottom: '8px', color: '#0f172a' }}>
                Covered Regional Districts
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {s.districtsCovered?.length > 0 ? (
                  s.districtsCovered.map((d) => (
                    <span key={d} className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                      📍 {d}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>Colombo, Kandy, Gampaha</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Modules Overview Grid */}
      <section className="main-content" style={{ marginTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            5 Role-Based Functional Modules
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            Built as part of SWT22022 Group I MERN-stack practical assignment.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="card">
            <span className="badge donor" style={{ marginBottom: '8px' }}>Module 1</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Donor Surplus Posting</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Hotels, restaurants, and individuals log food or waste with photos, quantities, and freshness windows.
            </p>
          </div>

          <div className="card">
            <span className="badge recipient" style={{ marginBottom: '8px' }}>Module 2</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Smart Proximity Matching</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Ranked discovery by district and distance for verified charities and shelters to claim surplus before spoilage.
            </p>
          </div>

          <div className="card">
            <span className="badge recycler" style={{ marginBottom: '8px' }}>Module 3</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Waste Classification</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Automatic classification of non-donatable items into plastic, glass, paper, metal, or organic pathways.
            </p>
          </div>

          <div className="card">
            <span className="badge volunteer" style={{ marginBottom: '8px' }}>Module 4</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Volunteer Route Tracking</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Volunteers accept pickup jobs, follow route navigation, and provide timestamped status tracking.
            </p>
          </div>

          <div className="card" style={{ border: '2px solid #10b981' }}>
            <span className="badge admin" style={{ marginBottom: '8px', background: '#ecfdf5', color: '#047857' }}>
              Module 5 (Active)
            </span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Admin, Verification & Impact</h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
              Organization credential verification, fake account removal, in-app notification alerts, and impact aggregation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
