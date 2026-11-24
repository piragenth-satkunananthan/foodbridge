import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Building2, CheckCircle2, Clock, Leaf, MapPin, PackageCheck, Recycle, Scale, Search, Truck } from 'lucide-react';
import { claimWasteRequest, fetchRecyclerClaims, fetchRecyclerFeed, fetchRecyclerStats } from '../../api/client';
import useAsync from '../../lib/useAsync';
import { WASTE_LABEL, fmtDate, fmtNum, isUrgent, timeLeft } from '../../lib/format';
import AppShell from '../../components/AppShell';
import Support from '../../components/Support';
import OrgProfile, { VerificationBanner, useOrganization } from '../../components/OrgProfile';
import { ClaimList } from '../../components/Claims';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Empty, ErrorState, Loading, Modal, PageHead, Stat, Tabs } from '../../components/ui';

const NAV = [
  { to: '/recycler', label: 'Collection requests', icon: Recycle, end: true },
  { to: '/recycler/claims', label: 'My collections', icon: PackageCheck },
  { to: '/recycler/profile', label: 'Facility', icon: Building2 }
];

function ClaimDialog({ post, onClose, onDone }) {
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const claim = async () => {
    setBusy(true);
    setError('');
    try {
      await claimWasteRequest(post._id);
      addToast('Claimed — volunteers in the district have been notified');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Claim ${WASTE_LABEL[post.wasteCategory]}?`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Recycle} onClick={claim} loading={busy}>Claim batch</Button></>}>
      <div className="grid gap-4">
        {error && <ErrorState message={error} />}
        <dl className="dl">
          <dt>Quantity</dt><dd>{post.quantity}</dd>
          <dt>Pathway</dt><dd>{post.pathwayTitle}</dd>
          <dt>Deadline</dt><dd>{fmtDate(post.pickupDeadline)} ({timeLeft(post.pickupDeadline)})</dd>
          <dt>From</dt><dd>{[post.city, post.district].filter(Boolean).join(', ')}</dd>
          <dt>Distance</dt><dd>~{fmtNum(post.distanceKm, 1)} km <span className="hint">({post.distanceBasis})</span></dd>
          {post.specialInstructions && <><dt>Instructions</dt><dd>{post.specialInstructions}</dd></>}
        </dl>
        <p className="hint m-0">After collection you record the processing outcome; only then does it count as diverted.</p>
      </div>
    </Modal>
  );
}

function Feed() {
  const org = useOrganization();
  const o = org.data?.organization;
  const verified = o?.verificationStatus === 'verified' && o.accepting;
  const [filters, setFilters] = useState({ category: 'all', sortBy: 'deadline', search: '' });
  const [search, setSearch] = useState('');
  const stats = useAsync(fetchRecyclerStats);
  const feed = useAsync(() => (verified ? fetchRecyclerFeed({ category: filters.category, sortBy: filters.sortBy, ...(filters.search ? { search: filters.search } : {}) }) : Promise.resolve(null)), [verified, filters.category, filters.sortBy, filters.search]);
  const [claiming, setClaiming] = useState(null);
  const s = stats.data;
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const items = feed.data?.feed || [];
  const handled = o?.materialTypesHandled || [];
  return (
    <>
      <PageHead title="Collection requests" subtitle="Waste your facility can process, within your capacity and service area." />
      {!org.loading && <VerificationBanner org={o} />}
      <div className="stat-grid">
        <Stat icon={Truck} label="Active collections" value={s ? fmtNum(s.activeBatches) : '—'} />
        <Stat icon={CheckCircle2} label="Processed batches" value={s ? fmtNum(s.completedBatches) : '—'} />
        <Stat icon={Scale} label="Processed weight" value={s ? `${fmtNum(s.totalWeightKg, 1)} kg` : '—'} note="Declared mass" />
        <Stat icon={Leaf} label="Diverted from landfill" value={s ? `${fmtNum(s.totalDivertedKg, 1)} kg` : '—'} note="Recycled or composted" />
      </div>
      {verified && (
        <Card pad={false}>
          <form className="card-pad flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, search: search.trim() })); }}>
            <div className="flex gap-2 flex-1 min-w-[220px]">
              <label htmlFor="ws" className="sr-only">Search</label>
              <input id="ws" className="input" placeholder="Search material, district, donor" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button type="submit" variant="secondary" icon={Search}>Search</Button>
            </div>
            <label className="sr-only" htmlFor="wc">Material</label>
            <select id="wc" className="input" style={{ width: 'auto' }} value={filters.category} onChange={set('category')}>
              <option value="all">All my materials</option>{handled.map((m) => <option key={m} value={m}>{WASTE_LABEL[m]}</option>)}
            </select>
            <label className="sr-only" htmlFor="wsb">Sort by</label>
            <select id="wsb" className="input" style={{ width: 'auto' }} value={filters.sortBy} onChange={set('sortBy')}>
              <option value="deadline">Deadline</option><option value="distance">Nearest</option><option value="quantity">Largest</option>
            </select>
          </form>
          {feed.error && <div className="px-5 pb-5"><ErrorState message={feed.error} onRetry={feed.reload} /></div>}
          {feed.loading && !feed.data ? <Loading /> : items.length === 0 ? <Empty icon={Recycle} title="No compatible requests right now">You'll be notified when matching material is posted in your district.</Empty> : (
            <div className="list border-t border-[var(--rule)]">
              {items.map((p) => (
                <div key={p._id} className="row-item">
                  <span className="icon-tile waste"><Recycle size={18} aria-hidden="true" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><strong>{WASTE_LABEL[p.wasteCategory]}</strong><Badge tone="accent" plain>{p.pathwayTitle}</Badge>{isUrgent(p.pickupDeadline) && <Badge tone="danger">Urgent</Badge>}</div>
                    <div className="meta mt-1">
                      <span>{p.quantity}</span>
                      <span><MapPin size={13} aria-hidden="true" />{[p.city, p.district].filter(Boolean).join(', ')} · ~{fmtNum(p.distanceKm, 1)} km</span>
                      <span><Clock size={13} aria-hidden="true" />{timeLeft(p.pickupDeadline)}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setClaiming(p)}>Claim</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {s && s.completedBatches > 0 && (
        <Card title="Processed by material">
          <div className="grid gap-3">
            {Object.entries(s.materialBreakdown).filter(([, v]) => v.count).map(([k, v]) => (
              <div key={k} className="grid gap-1">
                <div className="flex justify-between text-sm"><span className="font-semibold">{WASTE_LABEL[k]}</span><span className="num muted">{fmtNum(v.weightKg, 1)} kg · {v.count} batches</span></div>
                <div style={{ height: 6, borderRadius: 6, background: 'var(--sheet-2)' }}><div style={{ height: 6, borderRadius: 6, background: 'var(--terra)', width: `${Math.max(2, (v.weightKg / (s.totalWeightKg || 1)) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {claiming && <ClaimDialog post={claiming} onClose={() => setClaiming(null)} onDone={() => { setClaiming(null); feed.reload(); stats.reload(); }} />}
    </>
  );
}

function Claims() {
  const [tab, setTab] = useState('active');
  const { data, error, loading, reload } = useAsync(() => fetchRecyclerClaims({ status: tab }), [tab]);
  // API returns the waste request with its pickup nested; ClaimList expects pickup-shaped items.
  const claims = (data?.claims || []).map((c) => ({ ...c.pickup, wasteRequest: { ...c, pickup: undefined } }));
  return (
    <>
      <PageHead title="My collections" subtitle="Track pickups to your facility and record the processing outcome." />
      <Card pad={false}>
        <div className="px-5 pt-3"><Tabs label="Collection status" value={tab} onChange={setTab} tabs={[['active', 'Active'], ['completed', 'Processed'], ['all', 'All history']]} /></div>
        {error && <div className="card-pad"><ErrorState message={error} onRetry={reload} /></div>}
        {loading ? <Loading /> : <ClaimList claims={claims} onChanged={reload} emptyTitle="No collections here" emptyText="Claimed waste appears here with its pickup progress." />}
      </Card>
    </>
  );
}

export default function RecyclerDashboard() {
  return (
    <AppShell nav={NAV}>
      <Routes>
        <Route index element={<Feed />} />
        <Route path="claims" element={<Claims />} />
        <Route path="profile" element={<OrgProfile role="recycler" />} />
        <Route path="support" element={<Support />} />
      </Routes>
    </AppShell>
  );
}
