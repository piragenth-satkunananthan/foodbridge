import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchPublicImpact } from '../api/client';
import { exportImpactMetricsCSV } from '../utils/exportUtils';
import ImpactSummary from '../components/ImpactSummary';

export default function LandingPage() {
  const { pathname } = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadedAt, setLoadedAt] = useState(null);
  const loadImpact = async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchPublicImpact());
      setLoadedAt(new Date());
    } catch {
      setData(null);
      setError('Impact data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (pathname === '/impact') loadImpact(); }, [pathname]);
  if (pathname === '/') return (
    <main className="home-page">
      <section className="home-intro">
        <div><p className="eyebrow">Food sharing · Sri Lanka</p><h1>Post surplus food<br />for collection.</h1><p className="home-lead">Tell us what you have, how much, and when it needs collecting. Keep the food details and collection progress in one place.</p><Link className="btn btn-primary" to="/register?role=donor">Register as a donor</Link><p className="home-signin">Already registered? <Link to="/login">Sign in to post food</Link></p></div>
        <aside className="collection-note" aria-label="Before you post"><p className="eyebrow">Before you post</p><h2>Food, storage and collection details.</h2><dl><div><dt>Food</dt><dd>What is available and how much?</dd></div><div><dt>Storage</dt><dd>How has the food been stored?</dd></div><div><dt>Collection</dt><dd>Which district, and what is the deadline?</dd></div></dl><p>Use a photo of the food you are offering.</p></aside>
      </section>
      <section className="participation" aria-labelledby="participate-title"><div><p className="eyebrow">Taking part</p><h2 id="participate-title">Food needs a pickup,<br />and someone to receive it.</h2></div><div className="participation-rows"><article><h3>Donate food</h3><p>Post available food and follow its collection status from your dashboard.</p><Link to="/register?role=donor">Create a donor account →</Link></article><article><h3>Volunteer for deliveries</h3><p>Browse available pickups by district. Accept a delivery and record collection and handover.</p><Link to="/register?role=volunteer">Register as a volunteer →</Link></article><article><h3>Register an organisation</h3><p>Recipient organisations and recyclers can register for admin review. Food claims and waste claims are not available in these dashboards yet.</p><Link to="/register?role=recipient">Register your organisation →</Link></article></div></section>
      <section className="home-waste"><h2>Have waste to collect?</h2><p>Donors can also post organic waste and recyclable materials. Keep these separate from food donations.</p><Link to="/login">Sign in to post a collection request →</Link></section>
      <section className="home-report"><div><h2>Recorded deliveries and collections</h2><p>See completed food deliveries, recycling quantities, and the districts covered.</p></div><Link to="/impact">View community impact →</Link></section>
    </main>
  );
  return (
    <main className="main-content impact-page">
      <section aria-labelledby="impact-title">
        <div className="report-heading">
          <div>
            {pathname === '/impact' ? <h1 id="impact-title">FoodBridge community impact</h1> : <h2 id="impact-title">FoodBridge community impact</h2>}
            <p>Food delivered and waste recorded for recycling.</p>
          </div>
          <div className="report-actions">
            <button className="btn btn-secondary" onClick={loadImpact} disabled={loading}>Refresh</button>
            <button className="btn btn-secondary" disabled={loading || !data} onClick={() => exportImpactMetricsCSV(data.summary, data.ecosystem)}>Download impact report</button>
          </div>
        </div>
        {loading ? <p role="status">Loading impact data…</p> : error ? (
          <div className="report-error" role="alert"><p>{error}</p><button className="btn btn-secondary" onClick={loadImpact}>Try again</button></div>
        ) : data && (
          <><p className="report-note">Last loaded: {loadedAt?.toLocaleString()}</p><ImpactSummary data={data} /></>
        )}
      </section>
    </main>
  );
}
