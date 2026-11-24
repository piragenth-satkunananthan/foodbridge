import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Building2, CheckCircle2, Clock, HandHeart, MapPin, PackageCheck, Search, Thermometer, Utensils } from 'lucide-react';
import { claimDonation, fetchNearbyDonations, fetchRecipientClaims, fetchRecipientStats } from '../../api/client';
import useAsync from '../../lib/useAsync';
import { STORAGE_LABEL, fmtDate, fmtNum, isUrgent, timeLeft } from '../../lib/format';
import AppShell from '../../components/AppShell';
import Support from '../../components/Support';
import OrgProfile, { VerificationBanner, useOrganization } from '../../components/OrgProfile';
import { ClaimList } from '../../components/Claims';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Empty, ErrorState, Loading, Modal, PageHead, Stat, Tabs } from '../../components/ui';

const NAV = [
  { to: '/recipient', label: 'Available food', icon: Utensils, end: true },
  { to: '/recipient/claims', label: 'My claims', icon: PackageCheck },
  { to: '/recipient/profile', label: 'Organisation', icon: Building2 }
];

function ClaimDialog({ donation, onClose, onDone }) {
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const claim = async () => {
    setBusy(true);
    setError('');
    try {
      await claimDonation(donation._id);
      addToast('Claimed — volunteers in the district have been notified');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={`Claim ${donation.foodType}?`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={HandHeart} onClick={claim} loading={busy}>Claim whole batch</Button></>}>
      <div className="grid gap-4">
        {error && <ErrorState message={error} />}
        <dl className="dl">
          <dt>Quantity</dt><dd>{donation.quantity}</dd>
          <dt>Storage</dt><dd>{STORAGE_LABEL[donation.storageCondition]}</dd>
          <dt>Prepared</dt><dd>{fmtDate(donation.preparedTime)}</dd>
          <dt>Pickup deadline</dt><dd>{fmtDate(donation.pickupDeadline)} ({timeLeft(donation.pickupDeadline)})</dd>
          <dt>From</dt><dd>{[donation.city, donation.district].filter(Boolean).join(', ')}</dd>
          <dt>Distance</dt><dd>~{fmtNum(donation.distanceKm, 1)} km <span className="hint">({donation.distanceBasis})</span></dd>
          {donation.specialInstructions && <><dt>Instructions</dt><dd>{donation.specialInstructions}</dd></>}
        </dl>
        <p className="hint m-0">Claiming reserves capacity for the whole batch. You confirm acceptance only when the food arrives.</p>
      </div>
    </Modal>
  );
}

function Available() {
  const org = useOrganization();
  const verified = org.data?.organization?.verificationStatus === 'verified' && org.data.organization.accepting;
  const [filters, setFilters] = useState({ sortBy: 'score', storageCondition: 'all', search: '' });
  const [search, setSearch] = useState('');
  const stats = useAsync(fetchRecipientStats);
  const list = useAsync(() => (verified ? fetchNearbyDonations({ sortBy: filters.sortBy, storageCondition: filters.storageCondition, ...(filters.search ? { search: filters.search } : {}) }) : Promise.resolve(null)), [verified, filters.sortBy, filters.storageCondition, filters.search]);
  const [claiming, setClaiming] = useState(null);
  const s = stats.data?.stats;
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const donations = list.data?.donations || [];
  return (
    <>
      <PageHead title="Available food" subtitle="Posts your organisation can take now — filtered by your storage, capacity, service area and the pickup window." />
      {!org.loading && <VerificationBanner org={org.data?.organization} />}
      <div className="stat-grid">
        <Stat icon={Utensils} label={`Open in ${s?.district || 'your district'}`} value={s ? fmtNum(s.availableInDistrict) : '—'} />
        <Stat icon={Clock} label="Active claims" value={s ? fmtNum(s.activeClaimsCount) : '—'} />
        <Stat icon={CheckCircle2} label="Received" value={s ? fmtNum(s.completedClaimsCount) : '—'} />
        <Stat icon={HandHeart} label="Meals received" value={s ? fmtNum(s.estimatedMealsRescued) : '—'} note="Estimated from quantities" />
      </div>
      {verified && (
        <Card pad={false}>
          <form className="card-pad flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); setFilters((f) => ({ ...f, search: search.trim() })); }}>
            <div className="flex gap-2 flex-1 min-w-[220px]">
              <label htmlFor="rs" className="sr-only">Search</label>
              <input id="rs" className="input" placeholder="Search food, district, notes" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button type="submit" variant="secondary" icon={Search}>Search</Button>
            </div>
            <label className="sr-only" htmlFor="st">Storage</label>
            <select id="st" className="input" style={{ width: 'auto' }} value={filters.storageCondition} onChange={set('storageCondition')}>
              <option value="all">Any storage</option>{Object.entries(STORAGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <label className="sr-only" htmlFor="sb">Sort by</label>
            <select id="sb" className="input" style={{ width: 'auto' }} value={filters.sortBy} onChange={set('sortBy')}>
              <option value="score">Best match</option><option value="distance">Nearest</option><option value="urgency">Most urgent</option><option value="newest">Newest</option>
            </select>
          </form>
          {list.error && <div className="px-5 pb-5"><ErrorState message={list.error} onRetry={list.reload} /></div>}
          {list.loading && !list.data ? <Loading /> : donations.length === 0 ? <Empty title="No matching food right now">You'll be notified when a compatible post appears in your district.</Empty> : (
            <div className="list border-t border-[var(--border)]">
              {donations.map((d) => (
                <div key={d._id} className="row-item">
                  <span className="icon-tile"><Utensils size={18} aria-hidden="true" /></span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><strong>{d.foodType}</strong><Badge tone="success" plain>{d.matchScore}% match</Badge>{isUrgent(d.pickupDeadline) && <Badge tone="danger">Urgent</Badge>}</div>
                    <div className="meta mt-1">
                      <span>{d.quantity}</span>
                      <span><MapPin size={13} aria-hidden="true" />{[d.city, d.district].filter(Boolean).join(', ')} · ~{fmtNum(d.distanceKm, 1)} km</span>
                      <span><Thermometer size={13} aria-hidden="true" />{STORAGE_LABEL[d.storageCondition]}</span>
                      <span><Clock size={13} aria-hidden="true" />{timeLeft(d.pickupDeadline)}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setClaiming(d)}>Claim</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {claiming && <ClaimDialog donation={claiming} onClose={() => setClaiming(null)} onDone={() => { setClaiming(null); list.reload(); stats.reload(); }} />}
    </>
  );
}

function Claims() {
  const [tab, setTab] = useState('active');
  const { data, error, loading, reload } = useAsync(() => fetchRecipientClaims({ status: tab === 'all' ? '' : tab }), [tab]);
  return (
    <>
      <PageHead title="My claims" subtitle="Follow each pickup and confirm receipt when the food arrives." />
      <Card pad={false}>
        <div className="px-5 pt-3"><Tabs label="Claim status" value={tab} onChange={setTab} tabs={[['active', 'Active'], ['completed', 'Received'], ['all', 'All history']]} /></div>
        {error && <div className="card-pad"><ErrorState message={error} onRetry={reload} /></div>}
        {loading ? <Loading /> : <ClaimList claims={data?.claims || []} onChanged={reload} emptyTitle="No claims here" emptyText="Claimed food appears here with its pickup progress." />}
      </Card>
    </>
  );
}

export default function RecipientDashboard() {
  return (
    <AppShell nav={NAV}>
      <Routes>
        <Route index element={<Available />} />
        <Route path="claims" element={<Claims />} />
        <Route path="profile" element={<OrgProfile role="recipient" />} />
        <Route path="support" element={<Support />} />
      </Routes>
    </AppShell>
  );
}
