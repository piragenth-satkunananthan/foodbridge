import React from 'react';
import { motion } from 'framer-motion';
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
  Download,
  RefreshCw
} from 'lucide-react';
import AnimatedCounter from '../../components/AnimatedCounter';
import { exportImpactMetricsCSV } from '../../utils/exportUtils';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

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
    { name: 'Plastic Polymers', count: wasteByCategory.plastic || 0, color: '#0284c7', tag: 'plastic' },
    { name: 'Paper & Cardboard', count: wasteByCategory.paper || 0, color: '#f59e0b', tag: 'paper' },
    { name: 'Glass Cullet', count: wasteByCategory.glass || 0, color: '#14b8a6', tag: 'glass' },
    { name: 'Scrap Metal', count: wasteByCategory.metal || 0, color: '#64748b', tag: 'metal' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Banner Alert if pending verifications exist */}
      {kpis.pendingVerifications > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#fef3c7', padding: '8px', borderRadius: '10px' }}>
              <Clock size={20} color="#d97706" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', color: '#92400e' }}>
                {kpis.pendingVerifications} Organization{kpis.pendingVerifications > 1 ? 's' : ''} Awaiting KYC Verification
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                NGOs and recyclers require administrator approval before accepting donation requests.
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('verification')}
            className="plaid-btn-emerald"
            style={{ fontSize: '12.5px', padding: '7px 15px', background: '#d97706', borderColor: '#b45309' }}
          >
            <span>Review Applications</span> <ArrowRight size={14} />
          </button>
        </motion.div>
      )}

      {/* Quick Action & ESG Export Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>
            Platform Impact & Governance Console
          </div>
          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
            National metrics synchronized across 5 active provincial logistics corridors
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onRefresh}
            className="plaid-btn-light"
            style={{ fontSize: '12.5px', padding: '7px 14px' }}
            title="Refresh Live Metrics"
          >
            <RefreshCw size={13} />
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
            className="plaid-btn-light"
            style={{ fontSize: '12.5px', padding: '7px 15px' }}
          >
            <Download size={14} />
            <span>Export ESG Metrics (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with Animated Number Rolling and Lift Effects */}
      <div className="kpi-grid">
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="kpi-card green"
        >
          <div className="kpi-icon green">
            <Utensils size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Meals Rescued</h3>
              <span className="trend-pill up"><TrendingUp size={11} /> +18.4%</span>
            </div>
            <div className="kpi-value">
              <AnimatedCounter value={kpis.totalMealsRescued} />
            </div>
            <div className="kpi-sub">Humanitarian distribution verified</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="kpi-card blue"
        >
          <div className="kpi-icon blue">
            <Recycle size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Recycled Waste</h3>
              <span className="trend-pill up"><TrendingUp size={11} /> +12.1%</span>
            </div>
            <div className="kpi-value">
              <AnimatedCounter value={kpis.totalKgRecycled} decimals={kpis.totalKgRecycled % 1 === 0 ? 0 : 1} suffix=" kg" />
            </div>
            <div className="kpi-sub">Plastic, glass, paper, & metal</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="kpi-card amber"
        >
          <div className="kpi-icon amber">
            <Leaf size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Organic Diverted</h3>
              <span className="trend-pill up"><TrendingUp size={11} /> +24.8%</span>
            </div>
            <div className="kpi-value">
              <AnimatedCounter value={kpis.totalOrganicKg} suffix=" kg" />
            </div>
            <div className="kpi-sub">Composted & bio-converted</div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="kpi-card purple"
        >
          <div className="kpi-icon purple">
            <Users size={22} />
          </div>
          <div className="kpi-details">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3>Platform Users</h3>
              <span className="trend-pill neutral"><CheckCircle2 size={11} /> Active</span>
            </div>
            <div className="kpi-value">
              <AnimatedCounter value={kpis.totalUsers} />
            </div>
            <div className="kpi-sub">{kpis.pendingVerifications} verification requests pending</div>
          </div>
        </motion.div>
      </div>

      {/* Analytics & Distribution Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Waste Categorization Breakdown */}
        <div className="plaid-card">
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                Waste Material Stream Breakdown
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Circular Recycling Stream</span>
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      style={{ height: '100%', background: c.color, borderRadius: '9999px' }}
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
              <h2 className="card-title" style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                User Roles & Ecosystem Breakdown
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Verified platform entities</span>
            </div>
            <button onClick={() => setActiveTab('users')} className="plaid-btn-light" style={{ fontSize: '12px', padding: '5px 12px' }}>
              Manage Users
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Food Donors</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
                <AnimatedCounter value={userCounts.donor} />
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600' }}>Hotels, Bakeries, Events</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recipients (NGOs)</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
                <AnimatedCounter value={userCounts.recipient} />
              </div>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>Charities & Shelters</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Volunteers</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
                <AnimatedCounter value={userCounts.volunteer} />
              </div>
              <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '600' }}>Logistics & Transport</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2 }}
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Recyclers</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0' }}>
                <AnimatedCounter value={userCounts.recycler} />
              </div>
              <div style={{ fontSize: '11px', color: '#0891b2', fontWeight: '600' }}>Facilities & Composters</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="plaid-card">
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 className="card-title" style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              Recent Platform Submissions
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Live log of donor postings and waste streams</span>
          </div>
          <button onClick={() => setActiveTab('monitoring')} className="plaid-btn-light" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <span>View Live Feed</span> <ArrowRight size={13} />
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
    </motion.div>
  );
}
