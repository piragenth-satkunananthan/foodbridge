import React from 'react';
import {
  Utensils,
  Recycle,
  Leaf,
  Clock,
  Users,
  ArrowRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { exportImpactMetricsCSV } from '../../utils/exportUtils';
import { fetchPublicImpact } from '../../api/client';
import { useToast } from '../../components/Toast';

export default function OverviewTab({ stats, setActiveTab, onRefresh }) {
  const { addToast } = useToast();
  const [exporting, setExporting] = React.useState(false);
  const downloadReport = async () => {
    setExporting(true);
    try {
      const data = await fetchPublicImpact();
      exportImpactMetricsCSV(data.summary, data.ecosystem);
    } catch { addToast('The impact report could not be loaded. Please try again.', 'error'); }
    finally { setExporting(false); }
  };
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
    (wasteByCategory.organic || 0) +
    (wasteByCategory.non_recyclable || 0) || 1;

  const categories = [
    { name: 'Organic Waste', count: wasteByCategory.organic || 0, color: '#10b981', tag: 'organic' },
    { name: 'Plastic', count: wasteByCategory.plastic || 0, color: '#0284c7', tag: 'plastic' },
    { name: 'Paper & Cardboard', count: wasteByCategory.paper || 0, color: '#f59e0b', tag: 'paper' },
    { name: 'Glass', count: wasteByCategory.glass || 0, color: '#14b8a6', tag: 'glass' },
    { name: 'Scrap Metal', count: wasteByCategory.metal || 0, color: '#64748b', tag: 'metal' },
    { name: 'Non-recyclable', count: wasteByCategory.non_recyclable || 0, color: '#94a3b8', tag: 'non_recyclable' }
  ];

  return (
    <div>
      {/* Top Banner Alert if pending verifications exist */}
      {kpis.pendingVerifications > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '16px 20px',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 230px' }}>
            <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px' }}>
              <Clock size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#92400e' }}>
                {kpis.pendingVerifications} Organization{kpis.pendingVerifications > 1 ? 's' : ''} awaiting review
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                Check registration details before approving or rejecting an organisation.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('verification')}
            className="btn btn-primary"
            style={{ fontSize: '12.5px', padding: '7px 15px', background: '#d97706', borderColor: '#b45309' }}
          >
            <span>Review organisations</span> <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Overview actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '650', color: '#0f172a', letterSpacing: '-0.025em' }}>
            Admin dashboard
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            Review organisations, manage accounts, and monitor donations and collections.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onRefresh}
            className="plaid-btn-light"
            style={{ fontSize: '12.5px', padding: '7px 14px' }}
            title="Refresh data"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={downloadReport}
            disabled={exporting}
            className="plaid-btn-light"
            style={{ fontSize: '12.5px', padding: '7px 15px' }}
          >
            <Download size={14} />
            <span>Download impact report</span>
          </button>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="plaid-card">
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '16px', fontWeight: '650', color: '#0f172a' }}>
              Recent submissions
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Recent food donations and waste requests</span>
          </div>
          <button onClick={() => setActiveTab('monitoring')} className="plaid-btn-light" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <span>View activity</span> <ArrowRight size={13} />
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: '#94a3b8' }}>
                    No recent submissions recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Impact totals */}
      <div className="kpi-grid">
        <div
          className="kpi-card green"
        >
          <div className="kpi-icon green">
            <Utensils size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Estimated meals rescued</h3>
            </div>
            <div className="kpi-value">
              {Number(kpis.totalMealsRescued).toLocaleString()}
            </div>
            <div className="kpi-sub">Estimated from delivered food donations</div>
          </div>
        </div>

        <div
          className="kpi-card blue"
        >
          <div className="kpi-icon blue">
            <Recycle size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Materials recycled (kg)</h3>
            </div>
            <div className="kpi-value">
              {Number(kpis.totalKgRecycled).toLocaleString()}
            </div>
            <div className="kpi-sub">Plastic, glass, paper, & metal</div>
          </div>
        </div>

        <div
          className="kpi-card amber"
        >
          <div className="kpi-icon amber">
            <Leaf size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Organic waste diverted (kg)</h3>
            </div>
            <div className="kpi-value">
              {Number(kpis.totalOrganicKg).toLocaleString()}
            </div>
            <div className="kpi-sub">Recorded organic waste collections</div>
          </div>
        </div>

        <div
          className="kpi-card purple"
        >
          <div className="kpi-icon purple">
            <Users size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Pending reviews</h3>
            </div>
            <div className="kpi-value">
              {Number(kpis.pendingVerifications).toLocaleString()}
            </div>
            <div className="kpi-sub">Organisations awaiting a decision</div>
          </div>
        </div>
      </div>

      {/* Analytics & Distribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Waste Categorization Breakdown */}
        <div className="plaid-card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: '16px', fontWeight: '650', color: '#0f172a' }}>
                Waste requests by material
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Counts of requests across all statuses</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            {categories.map((c) => {
              const pct = Math.round((c.count / totalWasteCategorized) * 100);
              return (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{c.name}</span>
                    <span style={{ color: '#64748b', fontWeight: '500' }}>
                      {c.count} items ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{ width: `${pct}%`, height: '100%', background: c.color, borderRadius: '9999px' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stakeholder Ecosystem Distribution */}
        <div className="plaid-card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: '16px', fontWeight: '650', color: '#0f172a' }}>
                Registered users by role
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>All registered accounts</span>
            </div>
            <button onClick={() => setActiveTab('users')} className="plaid-btn-light" style={{ fontSize: '12px', padding: '5px 12px' }}>
              Manage Users
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Food Donors</div>
              <div style={{ fontSize: '24px', fontWeight: '650', color: '#0f172a', margin: '4px 0' }}>
                {Number(userCounts.donor).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>Hotels, Bakeries, Events</div>
            </div>

            <div
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recipients (NGOs)</div>
              <div style={{ fontSize: '24px', fontWeight: '650', color: '#0f172a', margin: '4px 0' }}>
                {Number(userCounts.recipient).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>Charities & Shelters</div>
            </div>

            <div
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Volunteers</div>
              <div style={{ fontSize: '24px', fontWeight: '650', color: '#0f172a', margin: '4px 0' }}>
                {Number(userCounts.volunteer).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#285943', fontWeight: '600' }}>Logistics & Transport</div>
            </div>

            <div
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recyclers</div>
              <div style={{ fontSize: '24px', fontWeight: '650', color: '#0f172a', margin: '4px 0' }}>
                {Number(userCounts.recycler).toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: '600' }}>Facilities & Composters</div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
