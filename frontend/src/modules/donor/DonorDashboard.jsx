import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { CheckCircle2, Clock, LayoutDashboard, ListChecks, MapPin, Pencil, Plus, Recycle, Search, Utensils, XCircle } from 'lucide-react';
import { cancelDonation, cancelWasteRequest, fetchDonations, fetchDonorStats, fetchWasteRequests } from '../../api/client';
import useAsync from '../../lib/useAsync';
import { WASTE_LABEL, fmtNum, isUrgent, timeLeft } from '../../lib/format';
import AppShell from '../../components/AppShell';
import Support from '../../components/Support';
import { useToast } from '../../components/Toast';
import { Button, Card, Empty, ErrorState, Loading, PageHead, Stat, StatusBadge, Tabs } from '../../components/ui';
import PostForm from './PostForm';
import PostDetails from './PostDetails';

const NAV = [
  { to: '/donor', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/donor/posts', label: 'All posts', icon: ListChecks }
];
const OPEN = ['posted', 'matched', 'pickup_scheduled', 'picked_up', 'delivered'];

function PostRow({ post, kind, onOpen, onEdit, onCancel }) {
  const food = kind === 'donation';
  const live = OPEN.includes(post.status);
  return (
    <div className="row-item">
      <span className={`icon-tile ${food ? '' : 'waste'}`}>{food ? <Utensils size={18} aria-hidden="true" /> : <Recycle size={18} aria-hidden="true" />}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onOpen} className="tap font-bold text-left hover:underline underline-offset-4" style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>{food ? post.foodType : WASTE_LABEL[post.wasteCategory]}</button>
          <StatusBadge status={post.status} />
        </div>
        <div className="meta mt-1">
          <span>{post.quantity}</span>
          <span><MapPin size={13} aria-hidden="true" />{post.district}</span>
          {live && <span style={isUrgent(post.pickupDeadline) ? { color: 'var(--danger)', fontWeight: 650 } : undefined}><Clock size={13} aria-hidden="true" />{timeLeft(post.pickupDeadline)}</span>}
          {(post.matchedRecipient || post.matchedCollector) && <span>→ {(post.matchedRecipient || post.matchedCollector).name}</span>}
        </div>
      </div>
      <div className="flex gap-1">
        {post.status === 'posted' && <Button variant="ghost" size="sm" className="btn-icon" icon={Pencil} onClick={onEdit} aria-label="Edit post" />}
        {post.status === 'posted' && <Button variant="ghost" size="sm" className="btn-icon" icon={XCircle} onClick={onCancel} aria-label="Cancel post" />}
        <Button variant="secondary" size="sm" onClick={onOpen}>Details</Button>
      </div>
    </div>
  );
}

function usePostActions(reload) {
  const { addToast } = useToast();
  const [details, setDetails] = useState(null);
  const [editing, setEditing] = useState(null);
  const cancel = async (post, kind) => {
    if (!window.confirm('Cancel this post? Organisations will no longer see it.')) return;
    try {
      await (kind === 'donation' ? cancelDonation(post._id) : cancelWasteRequest(post._id));
      addToast('Post cancelled');
      reload();
    } catch (err) { addToast(err.message, 'error'); }
  };
  const row = (post, kind) => (
    <PostRow key={post._id} post={post} kind={kind} onOpen={() => setDetails({ id: post._id, kind })} onEdit={() => setEditing({ post, kind })} onCancel={() => cancel(post, kind)} />
  );
  const modals = (
    <>
      {details && <PostDetails {...details} onClose={() => setDetails(null)} />}
      {editing && <PostForm open editing={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
  return { row, modals };
}

function Overview() {
  const [creating, setCreating] = useState(false);
  const stats = useAsync(fetchDonorStats);
  const posts = useAsync(() => Promise.all([fetchDonations({ limit: 100 }), fetchWasteRequests({ limit: 100 })]));
  const reload = () => { stats.reload(); posts.reload(); };
  const { row, modals } = usePostActions(reload);
  const s = stats.data;
  const active = posts.data
    ? [...posts.data[0].donations.map((p) => [p, 'donation']), ...posts.data[1].wasteRequests.map((p) => [p, 'wasteRequest'])]
        .filter(([p]) => OPEN.includes(p.status))
        .sort(([a], [b]) => new Date(a.pickupDeadline) - new Date(b.pickupDeadline))
    : [];
  return (
    <>
      <PageHead title="Your surplus" subtitle="Post food or waste and follow each item until it is confirmed received.">
        <Button icon={Plus} size="lg" onClick={() => setCreating(true)}>Post surplus</Button>
      </PageHead>
      {stats.error && <ErrorState message={stats.error} onRetry={stats.reload} />}
      <div className="stat-grid">
        <Stat icon={Utensils} label="Active food posts" value={s ? fmtNum(s.activeDonations) : '—'} />
        <Stat icon={Recycle} label="Active waste requests" value={s ? fmtNum(s.activeWasteRequests) : '—'} />
        <Stat icon={CheckCircle2} label="Completed" value={s ? fmtNum(s.completedDonations + s.completedWasteRequests) : '—'} note="Confirmed by the receiver" />
        <Stat icon={Utensils} label="Meals rescued" value={s ? fmtNum(s.estimatedMeals) : '—'} note="Estimated from declared quantities" />
      </div>
      <Card title="In progress" pad={false} action={<span className="text-sm muted">Soonest deadline first</span>}>
        {posts.error && <div className="card-pad"><ErrorState message={posts.error} onRetry={posts.reload} /></div>}
        {posts.loading && !posts.data ? <Loading /> : active.length === 0
          ? <Empty title="Nothing in progress" action={<Button icon={Plus} onClick={() => setCreating(true)}>Post surplus</Button>}>Post surplus food or waste and matching organisations nearby are notified.</Empty>
          : <div className="list">{active.map(([p, k]) => row(p, k))}</div>}
      </Card>
      {creating && <PostForm open onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />}
      {modals}
    </>
  );
}

function AllPosts() {
  const [tab, setTab] = useState('donation');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const list = useAsync(() => (tab === 'donation'
    ? fetchDonations({ limit: 100, status, ...(query ? { search: query } : {}) }).then((r) => r.donations)
    : fetchWasteRequests({ limit: 100, status }).then((r) => r.wasteRequests)), [tab, status, query]);
  const { row, modals } = usePostActions(list.reload);
  return (
    <>
      <PageHead title="All posts" subtitle="Your complete posting history (latest 100 per type)." />
      <Card pad={false}>
        <div className="px-5 pt-3"><Tabs label="Post type" value={tab} onChange={(t) => { setTab(t); setStatus('all'); }} tabs={[['donation', 'Food donations'], ['wasteRequest', 'Waste requests']]} /></div>
        <form className="card-pad flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); setQuery(search.trim()); }}>
          <label className="sr-only" htmlFor="status">Status</label>
          <select id="status" className="input" style={{ width: 'auto' }} value={status} onChange={(e) => setStatus(e.target.value)}>
            {['all', ...OPEN, 'completed', 'cancelled', 'expired'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.replaceAll('_', ' ')}</option>)}
          </select>
          {tab === 'donation' && (
            <div className="flex gap-2 flex-1 min-w-[200px]">
              <label className="sr-only" htmlFor="q">Search food</label>
              <input id="q" className="input" placeholder="Search food type" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Button type="submit" variant="secondary" icon={Search}>Search</Button>
            </div>
          )}
        </form>
        {list.error && <div className="px-5 pb-5"><ErrorState message={list.error} onRetry={list.reload} /></div>}
        {list.loading ? <Loading /> : !list.data?.length ? <Empty title="No posts match" /> : <div className="list border-t border-[var(--rule)]">{list.data.map((p) => row(p, tab))}</div>}
      </Card>
      {modals}
    </>
  );
}

export default function DonorDashboard() {
  return (
    <AppShell nav={NAV}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="posts" element={<AllPosts />} />
        <Route path="support" element={<Support />} />
      </Routes>
    </AppShell>
  );
}
