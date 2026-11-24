import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Activity, FileBarChart, LayoutDashboard, MessageSquareWarning, Recycle, ShieldCheck, Truck, Users as UsersIcon, Utensils } from 'lucide-react';
import { fetchAdminStats } from '../../api/client';
import useAsync from '../../lib/useAsync';
import { ORG_TYPE_LABEL, PIPELINE, fmtDate, fmtNum, statusInfo } from '../../lib/format';
import AppShell from '../../components/AppShell';
import { Card, ErrorState, Loading, PageHead, Stat, StatusBadge } from '../../components/ui';
import { Complaints, Monitoring, Reports, Users, Verification } from './AdminPages';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/admin/monitoring', label: 'Monitoring', icon: Activity },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart }
];

function Bar({ label, value, total, tone = 'var(--primary)' }) {
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-sm"><span>{label}</span><span className="num font-semibold">{fmtNum(value)}</span></div>
      <div style={{ height: 6, borderRadius: 6, background: 'var(--surface-2)' }}><div style={{ height: 6, borderRadius: 6, background: tone, width: `${total ? Math.max(value ? 2 : 0, (value / total) * 100) : 0}%` }} /></div>
    </div>
  );
}

function Overview() {
  const { data, error, loading, reload } = useAsync(fetchAdminStats);
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <Card><Loading rows={6} /></Card>;
  const k = data.kpis;
  const pickupTotal = Object.values(data.pickupsByStatus).reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHead title="Platform overview" subtitle="Live counts from platform records." />
      {k.pendingVerifications > 0 && (
        <Link to="/admin/verification" className="alert alert-warning no-underline"><ShieldCheck size={18} aria-hidden="true" /><span><strong>{k.pendingVerifications} organisation{k.pendingVerifications === 1 ? '' : 's'}</strong> waiting for verification →</span></Link>
      )}
      <div className="stat-grid">
        <Stat icon={UsersIcon} label="Users" value={fmtNum(k.totalUsers)} note={`${data.userCounts.donor} donors · ${data.userCounts.volunteer} volunteers`} />
        <Stat icon={Utensils} label="Donations" value={fmtNum(k.totalDonations)} />
        <Stat icon={Recycle} label="Waste requests" value={fmtNum(k.totalWasteRequests)} />
        <Stat icon={Utensils} label="Meals rescued" value={fmtNum(k.totalMealsRescued)} note="Confirmed, estimated" />
        <Stat icon={Recycle} label="Recycled / composted" value={`${fmtNum(k.totalKgRecycled + k.totalOrganicKg, 1)} kg`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Pickup pipeline">
          <div className="grid gap-3">
            {PIPELINE.map(([key, label]) => <Bar key={key} label={label} value={data.pickupsByStatus[key] || 0} total={pickupTotal} tone="var(--info)" />)}
            {['cancelled', 'expired', 'rejected'].map((s) => <Bar key={s} label={statusInfo(s)[0]} value={data.pickupsByStatus[s] || 0} total={pickupTotal} tone="var(--control)" />)}
          </div>
        </Card>
        <Card title="Donations by status">
          <div className="grid gap-3">{Object.entries(data.donationsByStatus).map(([s, n]) => <Bar key={s} label={statusInfo(s)[0]} value={n} total={k.totalDonations} />)}</div>
        </Card>
        <Card title="Waste by material">
          <div className="grid gap-3">{Object.entries(data.wasteByCategory).map(([s, n]) => <Bar key={s} label={s.replace('_', '-')} value={n} total={k.totalWasteRequests} tone="var(--accent)" />)}</div>
        </Card>
      </div>
      <Card title="Recent organisation registrations" pad={false} action={<Link to="/admin/verification" className="text-sm font-semibold text-[var(--primary)]">Review all</Link>}>
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Organisation</th><th>Type</th><th>Contact</th><th>Status</th><th>Registered</th></tr></thead>
          <tbody>{data.recentActivity.organizations.map((o) => (
            <tr key={o._id}><td className="font-semibold">{o.name}</td><td>{ORG_TYPE_LABEL[o.type]}</td><td>{o.linkedUser?.email}</td><td><StatusBadge status={o.verificationStatus} /></td><td className="text-sm muted">{fmtDate(o.createdAt)}</td></tr>
          ))}</tbody>
        </table></div>
      </Card>
      <p className="hint m-0 flex items-center gap-2"><Truck size={14} aria-hidden="true" />Meals and weights count only organisation-confirmed, non-demo completions.</p>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <AppShell nav={NAV}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="verification" element={<Verification />} />
        <Route path="monitoring" element={<Monitoring />} />
        <Route path="users" element={<Users />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="reports" element={<Reports />} />
        <Route path="support" element={<Complaints />} />
      </Routes>
    </AppShell>
  );
}
