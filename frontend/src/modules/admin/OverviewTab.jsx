import React from 'react';
import {
  Utensils,
  Recycle,
  Leaf,
  Clock,
  Users,
  CheckCircle2,
  TrendingUp,
  Package,
  Truck,
  ArrowRight,
  Download
} from 'lucide-react';
import { exportImpactMetricsCSV } from '../../utils/exportUtils';

export default function OverviewTab({ stats, setActiveTab, onRefresh }) {
  const kpis = stats?.kpis || {
    totalUsers: 0,
    pendingVerifications: 0,
    totalDonations: 0,
    totalWasteRequests: 0,
    totalMealsRescued: 0,
    totalKgRecycled: 0,
    totalOrganicKg: 0
  };

  const userCounts = stats?.userCounts || { donor: 0, recipient: 0, volunteer: 0, recycler: 0, admin: 0 };
  const wasteByCategory = stats?.wasteByCategory || {};

  // Total waste categories for breakdown
  const totalWasteCategorized =
    (wasteByCategory.plastic || 0) +
    (wasteByCategory.glass || 0) +
    (wasteByCategory.paper || 0) +
    (wasteByCategory.metal || 0) +
    (wasteByCategory.organic || 0) || 1;

  const categories = [
    { name: 'Organic Waste', count: wasteByCategory.organic || 0, color: '#10b981', tag: 'organic' },
    { name: 'Plastic', count: wasteByCategory.plastic || 0, color: '#0284c7', tag: 'plastic' },
    { name: 'Paper & Cardboard', count: wasteByCategory.paper || 0, color: '#f59e0b', tag: 'paper' },
    { name: 'Glass', count: wasteByCategory.glass || 0, color: '#14b8a6', tag: 'glass' },
    { name: 'Metal', count: wasteByCategory.metal || 0, color: '#64748b', tag: 'metal' }
  ];

  return (
    <div>
      {/* Top Banner Alert if pending verifications exist */}
      {kpis.pendingVerifications > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Clock size={20} color="#d97706" />
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#92400e' }}>
                {kpis.pendingVerifications} Organization{kpis.pendingVerifications > 1 ? 's' : ''} Awaiting Verification
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309' }}>
                NGOs and recyclers require administrator approval before accepting donation requests.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('verification')}
            className="btn btn-sm btn-primary"
            style={{ background: '#d97706', borderColor: '#b45309' }}
          >
            Review Applications <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Quick Action & ESG Export Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Platform Impact & Governance Console
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            National metrics synchronized across 5 active districts
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onRefresh}
            className="btn btn-secondary btn-sm"
            title="Refresh Live Metrics"
          >
            <span>Refresh Grid</span>
          </button>

          <button
            type="button"
            onClick={() => {
              exportImpactMetricsCSV(
                {
                  mealsRescued: kpis.totalMealsRescued,
                  totalKgRecycled: kpis.totalKgRecycled,
                  kgRecycled: wasteByCategory,
                  kgOrganicDiverted: kpis.totalOrganicKg,
                  districtsCoveredCount: 5
                },
                {
                  verifiedNGOs: userCounts.recipient,
                  verifiedRecyclers: userCounts.recycler,
                  activeVolunteers: userCounts.volunteer
                }
              );
            }}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '12.5px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} /> Export ESG Metrics (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-icon green">
            <Utensils size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Meals Rescued</h3>
              <span className="trend-pill up"><TrendingUp size={11} /> +18.4%</span>
            </div>
            <div className="kpi-value">{kpis.totalMealsRescued.toLocaleString()}</div>
            <div className="kpi-sub">Humanitarian distribution verified</div>
          </div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue">
            <Recycle size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Recycled Waste</h3>
              <span className="trend-pill up"><TrendingUp size={11} /> +12.1%</span>
            </div>
            <div className="kpi-value">{kpis.totalKgRecycled} <span style={{ fontSize: '15px' }}>kg</span></div>
            <div className="kpi-sub">Plastic, glass, paper, & metal</div>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-icon amber">
            <Leaf size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Organic Diverted</h3>
              <span className="trend-pill up"><TrendingUp size={11} /> +24.8%</span>
            </div>
            <div className="kpi-value">{kpis.totalOrganicKg} <span style={{ fontSize: '15px' }}>kg</span></div>
            <div className="kpi-sub">Composted & bio-converted</div>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple">
            <Users size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Platform Users</h3>
              <span className="trend-pill neutral"><CheckCircle2 size={11} /> Active</span>
            </div>
            <div className="kpi-value">{kpis.totalUsers}</div>
            <div className="kpi-sub">{kpis.pendingVerifications} verification requests pending</div>
          </div>
        </div>
      </div>

      {/* Analytics & Distribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Waste Categorization Breakdown */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Waste Material Stream Breakdown</h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Circular Recycling Stream</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {categories.map((c) => {
              const pct = Math.round((c.count / totalWasteCategorized) * 100);
              return (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{c.name}</span>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>
                      {c.count} items ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: '9999px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stakeholder Ecosystem Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">User Roles & Ecosystem Breakdown</h2>
            <button onClick={() => setActiveTab('users')} className="btn btn-secondary btn-sm">
              Manage Users
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Food Donors</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{userCounts.donor}</div>
              <div style={{ fontSize: '11px', color: '#16a34a' }}>Hotels, Bakeries, Events</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recipients (NGOs)</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{userCounts.recipient}</div>
              <div style={{ fontSize: '11px', color: '#2563eb' }}>Charities & Shelters</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Volunteers</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{userCounts.volunteer}</div>
              <div style={{ fontSize: '11px', color: '#7c3aed' }}>Logistics & Transport</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recyclers</div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{userCounts.recycler}</div>
              <div style={{ fontSize: '11px', color: '#0891b2' }}>Facilities & Composters</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Platform Submissions</h2>
          <button onClick={() => setActiveTab('monitoring')} className="btn btn-secondary btn-sm">
            View Live Feed <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Item / Description</th>
                <th>Quantity</th>
                <th>District</th>
                <th>Donor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentActivity?.donations?.map((d) => (
                <tr key={d._id}>
                  <td>
                    <span className="badge donor" style={{ fontSize: '11px' }}>Food Donation</span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{d.foodType}</td>
                  <td>{d.quantity}</td>
                  <td>{d.district}</td>
                  <td>{d.donor?.name || 'Anonymous'}</td>
                  <td>
                    <span className={`badge ${d.status}`}>{d.status}</span>
                  </td>
                </tr>
              ))}
              {stats?.recentActivity?.wasteRequests?.map((w) => (
                <tr key={w._id}>
                  <td>
                    <span className="badge recycler" style={{ fontSize: '11px' }}>Waste Post</span>
                  </td>
                  <td style={{ fontWeight: '600', textTransform: 'capitalize' }}>{w.wasteCategory} Waste</td>
                  <td>{w.quantity}</td>
                  <td>{w.district}</td>
                  <td>{w.donor?.name || 'Anonymous'}</td>
                  <td>
                    <span className={`badge ${w.status}`}>{w.status}</span>
                  </td>
                </tr>
              ))}
              {(!stats?.recentActivity?.donations?.length && !stats?.recentActivity?.wasteRequests?.length) && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No recent submissions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
