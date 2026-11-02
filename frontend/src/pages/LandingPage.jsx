import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchPublicImpact } from '../api/client';
import { exportImpactMetricsCSV } from '../utils/exportUtils';
import ImpactSummary from '../components/ImpactSummary';
import HomePage from './HomePage';

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
  if (pathname === '/') return <HomePage />;
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
