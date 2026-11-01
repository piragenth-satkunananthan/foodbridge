import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchPublicImpact, snapshotImpact } from '../../api/client';
import ImpactSummary from '../../components/ImpactSummary';
import { exportImpactMetricsCSV } from '../../utils/exportUtils';

export default function PublicImpactModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loadedAt, setLoadedAt] = useState(null);
  const load = async () => {
    setLoading(true);
    setError('');
    try { setData(await fetchPublicImpact()); setLoadedAt(new Date()); }
    catch { setData(null); setError('Impact data could not be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (isOpen) { load(); setMessage(''); } }, [isOpen]);
  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      await snapshotImpact(new Date().toISOString().slice(0, 7));
      setMessage('Cumulative snapshot saved for the current month.');
    } catch { setMessage('The snapshot could not be saved. Please try again.'); }
    finally { setSaving(false); }
  };
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="public-impact-title" style={{ maxWidth: '900px' }}>
        <div className="modal-header"><h2 id="public-impact-title">Community impact</h2><button className="icon-btn" onClick={onClose} aria-label="Close impact preview"><X size={18} /></button></div>
        {loading ? <p role="status">Loading impact data…</p> : error ? <div role="alert" className="report-error"><p>{error}</p><button onClick={load} className="btn btn-secondary">Try again</button></div> : data && <>
          <p className="report-note">Last loaded: {loadedAt?.toLocaleString()}</p>
          <ImpactSummary data={data} />
          <div className="report-actions">
            <button className="btn btn-secondary" onClick={load}>Refresh</button>
            <button className="btn btn-secondary" onClick={() => exportImpactMetricsCSV(data.summary, data.ecosystem)}>Download impact report</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save current snapshot'}</button>
          </div>
          <p className="report-note">A snapshot records all-time totals at the time of saving. It replaces this month’s previous snapshot; it does not measure activity within that month.</p>
          {message && <p role="status">{message}</p>}
        </>}
      </div>
    </div>
  );
}
