import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RecipientDashboard() {
  const { user } = useAuth();
  const status = user?.verificationStatus || 'pending';
  return <main className="main-content account-page">
    <div className="page-heading"><p className="eyebrow">{user?.district}</p><h1>Recipient dashboard</h1><p>{user?.name}</p></div>
    <section className="account-details"><h2>Account details</h2><dl className="report-breakdown"><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Organisation review</dt><dd><span className={`badge ${status}`}>{status === 'verified' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Awaiting review'}</span></dd></div></dl></section>
    <section className="availability-note"><h2>Food requests</h2><p>Food browsing and claims are not available in this version yet.</p></section>
  </main>;
}
