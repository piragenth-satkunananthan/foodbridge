import React, { useState } from 'react';
import { MessageSquareWarning, Send } from 'lucide-react';
import { fetchComplaints, createComplaint } from '../api/client';
import useAsync from '../lib/useAsync';
import { fmtDate } from '../lib/format';
import { useToast } from './Toast';
import { Button, Card, Empty, ErrorState, Field, Loading, PageHead, StatusBadge } from './ui';

const TYPES = [['system', 'Platform issue'], ['user', 'Another account (suspected fake)'], ['donation', 'A food donation'], ['wasteRequest', 'A waste request'], ['pickup', 'A pickup']];

export default function Support() {
  const { data, error, loading, reload } = useAsync(fetchComplaints);
  const { addToast } = useToast();
  const [form, setForm] = useState({ subject: '', description: '', relatedType: 'system', relatedId: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createComplaint({ ...form, relatedId: form.relatedId.trim() || null });
      addToast('Report submitted to administrators');
      setForm({ subject: '', description: '', relatedType: 'system', relatedId: '' });
      reload();
    } catch (err) { addToast(err.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <>
      <PageHead title="Support & reports" subtitle="Report a problem, a suspicious account, or an issue with a donation or pickup. Administrators review every report." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
        <Card title="New report">
          <form onSubmit={submit} className="grid gap-4">
            <Field label="About"><select className="input" value={form.relatedType} onChange={set('relatedType')}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            {form.relatedType !== 'system' && <Field label="Reference ID (optional)" hint="Copy it from the record's details view."><input className="input" value={form.relatedId} onChange={set('relatedId')} pattern="[a-fA-F0-9]{24}" title="24-character record ID" /></Field>}
            <Field label="Subject"><input className="input" required maxLength={200} value={form.subject} onChange={set('subject')} /></Field>
            <Field label="Details"><textarea className="input" required maxLength={5000} rows={5} value={form.description} onChange={set('description')} /></Field>
            <div><Button type="submit" icon={Send} loading={busy}>Submit report</Button></div>
          </form>
        </Card>
        <Card title="Your reports" pad={false}>
          {error && <div className="card-pad"><ErrorState message={error} onRetry={reload} /></div>}
          {loading && !data ? <Loading /> : !data?.complaints?.length ? <Empty icon={MessageSquareWarning} title="No reports yet" /> : (
            <div className="list">
              {data.complaints.map((c) => (
                <div key={c._id} className="row-item">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><strong>{c.subject}</strong><StatusBadge status={c.status} /></div>
                    <p className="text-sm muted mt-1 mb-0">{c.description}</p>
                    {c.history?.length > 1 && <p className="text-sm mt-2 mb-0"><span className="muted">Latest response:</span> {c.history[c.history.length - 1].note}</p>}
                    <div className="meta mt-1"><span>{fmtDate(c.createdAt)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
