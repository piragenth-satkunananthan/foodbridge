import React from 'react';

export default function OverviewTab({ stats, setActiveTab, onRefresh }) {
  const kpis = stats?.kpis || {};
  const pending = kpis.pendingVerifications || 0;
  const activity = [
    ...(stats?.recentActivity?.donations || []).map(item => ({ ...item, kind: 'Food', description: item.foodType })),
    ...(stats?.recentActivity?.wasteRequests || []).map(item => ({ ...item, kind: 'Waste', description: item.wasteCategory }))
  ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const totals = [
    ['Estimated meals rescued', kpis.totalMealsRescued || 0],
    ['Materials recycled (kg)', kpis.totalKgRecycled || 0],
    ['Organic waste collected (kg)', kpis.totalOrganicKg || 0]
  ];
  return (
    <div className="operations-overview">
      <div className="operations-heading"><div><p className="eyebrow">Administration</p><h1>Review and follow up</h1></div><button className="btn btn-secondary" onClick={onRefresh}>Refresh</button></div>
      <section className="review-queue" aria-labelledby="review-heading">
        <div><p className="queue-count">{pending}</p><h2 id="review-heading">{pending === 1 ? 'Organisation awaiting review' : 'Organisations awaiting review'}</h2><p>{pending ? 'Check registration details and decide whether to approve each account.' : 'There are no organisation accounts waiting for a decision.'}</p></div>
        <button className="btn btn-primary" onClick={() => setActiveTab('verification')}>{pending ? 'Review organisations' : 'View organisations'}</button>
      </section>
      <section className="activity-section" aria-labelledby="activity-heading">
        <div className="section-heading"><h2 id="activity-heading">Recent submissions</h2><button className="text-action" onClick={() => setActiveTab('monitoring')}>View all activity →</button></div>
        {activity.length ? <div className="table-wrapper"><table className="data-table"><thead><tr><th>Item</th><th>Quantity</th><th>District</th><th>Donor</th><th>Status</th></tr></thead><tbody>{activity.map(item => <tr key={`${item.kind}-${item._id}`}><td><strong>{item.description}</strong><span className="table-detail">{item.kind}</span></td><td>{item.quantity}</td><td>{item.district}</td><td>{item.donor?.name || 'Not provided'}</td><td><span className={`badge ${item.status}`}>{item.status?.replace(/_/g, ' ')}</span></td></tr>)}</tbody></table></div> : <div className="activity-empty"><p>No recent submissions recorded.</p><p>Food donations and waste collection requests will appear here.</p></div>}
      </section>
      <section className="operations-records" aria-labelledby="totals-heading"><div className="section-heading"><h2 id="totals-heading">Recorded outcomes</h2><button className="text-action" onClick={() => setActiveTab('reports')}>Open reports →</button></div><dl className="outcome-totals">{totals.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{Number(value).toLocaleString()}</dd></div>)}</dl><p className="report-note">Totals from completed records. Meal counts are estimates.</p></section>
      <details className="account-breakdown"><summary>Account and waste request counts</summary><div className="report-columns"><section><div className="section-heading"><h2>Accounts by role</h2><button className="text-action" onClick={() => setActiveTab('users')}>Manage users →</button></div><dl className="report-breakdown">{Object.entries(stats?.userCounts || {}).map(([role, count]) => <div key={role}><dt>{role}</dt><dd>{count}</dd></div>)}</dl></section><section><h2>Waste requests by material</h2><p className="report-note">Includes all statuses.</p><dl className="report-breakdown">{Object.entries(stats?.wasteByCategory || {}).map(([category, count]) => <div key={category}><dt>{category.replace(/_/g, ' ')}</dt><dd>{count}</dd></div>)}</dl></section></div></details>
    </div>
  );
}
