import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Bike, HandHeart, Leaf, MapPin, Recycle, ShieldCheck, Utensils } from 'lucide-react';
import { fetchPublicImpact, fetchLiveFeed } from '../api/client';
import useAsync from '../lib/useAsync';
import { fmtNum, STORAGE_LABEL, WASTE_LABEL } from '../lib/format';
import PublicLayout from '../components/PublicLayout';
import { Empty, ErrorState, Loading, StatusBadge } from '../components/ui';

const ROLES = [
  [Utensils, 'Donors', 'Hotels, wedding halls, restaurants, bakeries and households post what is left over.', '/register?role=donor'],
  [HandHeart, 'Recipients', 'Verified NGOs, charities and shelters claim food that suits their storage and capacity.', '/register?role=recipient'],
  [Bike, 'Volunteers', 'Pick up a job, collect, deliver — each step is time-stamped for everyone involved.', '/register?role=volunteer'],
  [Recycle, 'Recyclers', 'Licensed recyclers and composting yards collect sorted material they can process.', '/register?role=recycler'],
  [ShieldCheck, 'Administrators', 'Verify organisations, answer reports and remove fake accounts.', null]
];

const time = new Intl.DateTimeFormat('en-LK', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function Board() {
  const { data, error, loading } = useAsync(fetchLiveFeed);
  if (error) return <ErrorState message="The activity board is unavailable right now." />;
  if (loading && !data) return <Loading rows={5} />;
  if (!data.items.length) return <Empty title="The board is empty">New posts appear here as soon as donors publish them.</Empty>;
  return (
    <ol className="list p-0 m-0" style={{ listStyle: 'none' }}>
      {data.items.slice(0, 7).map((i) => (
        <li key={i.id} className="grid grid-cols-[64px_1fr_auto] gap-3 py-3 items-start">
          <span className="mono text-xs muted pt-1">{time.format(new Date(i.createdAt))}</span>
          <span className="min-w-0">
            <span className="block font-semibold truncate">{i.type === 'waste' ? `${WASTE_LABEL[i.wasteCategory]} for collection` : i.itemTitle}</span>
            <span className="meta"><span>{i.quantity}</span><span><MapPin size={12} aria-hidden="true" />{i.district}</span>{i.storageCondition && <span>{STORAGE_LABEL[i.storageCondition]}</span>}</span>
          </span>
          <StatusBadge status={i.status} />
        </li>
      ))}
    </ol>
  );
}

function Impact() {
  const { data, error, loading, reload } = useAsync(fetchPublicImpact);
  if (error) return <ErrorState message={`Impact figures are unavailable right now (${error}).`} onRetry={reload} />;
  if (loading && !data) return <Loading rows={3} />;
  const s = data.summary, e = data.ecosystem;
  return (
    <div className="grid gap-4">
      <div className="stat-grid">
        <div className="stat"><div className="stat-label">Meals rescued</div><div className="stat-value">{fmtNum(s.mealsRescued)}</div><div className="stat-note">From confirmed deliveries</div></div>
        <div className="stat"><div className="stat-label">Recycled</div><div className="stat-value">{fmtNum(s.totalKgRecycled, 1)} <small>kg</small></div><div className="stat-note">Plastic, glass, paper, metal</div></div>
        <div className="stat"><div className="stat-label">Composted</div><div className="stat-value">{fmtNum(s.kgOrganicDiverted, 1)} <small>kg</small></div><div className="stat-note">Organic waste kept from landfill</div></div>
        <div className="stat"><div className="stat-label">Districts reached</div><div className="stat-value">{fmtNum(s.districtsCoveredCount)} <small>of 25</small></div></div>
      </div>
      <p className="m-0 text-sm muted">
        Today the network counts <strong className="text-[var(--ink)]">{fmtNum(e.verifiedNGOs)}</strong> verified food organisations, <strong className="text-[var(--ink)]">{fmtNum(e.verifiedRecyclers)}</strong> recyclers and composters, and <strong className="text-[var(--ink)]">{fmtNum(e.activeVolunteers)}</strong> active volunteers.
        Only receiver-confirmed, non-demonstration activity is counted; meals use declared portions, or 2.5 per kg.
      </p>
    </div>
  );
}

export default function LandingPage() {
  const { hash } = useLocation();
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView(); }, [hash]);
  return (
    <PublicLayout>
      <div className="wrap">
        <section className="front">
          <div>
            <p className="eyebrow">From kitchens to communities</p>
            <h1 className="headline mt-4">Good food should feed people, <em>not landfill.</em></h1>
            <p className="dek mt-6">When a wedding, hotel or bakery has food left over, FoodBridge puts it in front of a verified shelter nearby — and finds a volunteer to carry it. Whatever can't be eaten is sorted and sent to the recycler or compost yard that can actually take it.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-lg">Post your surplus <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/register?role=recipient" className="btn btn-secondary btn-lg">Register an organisation</Link>
            </div>
          </div>
          <aside aria-labelledby="board-title">
            <div className="flex items-baseline justify-between border-b border-[var(--ink)] pb-2">
              <h2 id="board-title" className="text-xl">On the board</h2>
              <span className="eyebrow">Latest posts</span>
            </div>
            <Board />
          </aside>
        </section>

        <section className="section" id="impact">
          <div className="section-title"><h2>What has been recorded so far</h2><span className="eyebrow">Public impact ledger</span></div>
          <Impact />
        </section>

        <section className="section" id="how">
          <div className="section-title"><h2>One post, sorted two ways</h2><span className="eyebrow">How it works</span></div>
          <div className="columns">
            <div>
              <h3 className="pathway-title"><span className="icon-tile"><Utensils size={18} aria-hidden="true" /></span>If it can be eaten</h3>
              <ol className="numbered">
                <li><span>1</span><span>The donor notes what it is, how it's stored, and when it must be collected by.</span></li>
                <li><span>2</span><span>Verified recipients nearby see it, ranked by distance and how fresh it is.</span></li>
                <li><span>3</span><span>A volunteer collects and delivers it. The recipient confirms it arrived in good condition.</span></li>
              </ol>
            </div>
            <div>
              <h3 className="pathway-title"><span className="icon-tile waste"><Leaf size={18} aria-hidden="true" /></span>If it can't</h3>
              <ol className="numbered waste">
                <li><span>1</span><span>It is sorted: plastic, glass, paper, metal, organic, or residual waste.</span></li>
                <li><span>2</span><span>Only a collector that processes that material can claim it.</span></li>
                <li><span>3</span><span>After collection, the facility records whether it was recycled, composted or disposed of.</span></li>
              </ol>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-title"><h2>Who keeps it moving</h2><span className="eyebrow">Five roles, one network</span></div>
          <div className="directory">
            {ROLES.map(([Icon, title, text, to]) => (
              <div key={title}>
                <Icon size={20} className="text-[var(--leaf)]" aria-hidden="true" />
                <h3>{title}</h3>
                <p className="text-sm muted mt-1 mb-2">{text}</p>
                {to && <Link to={to} className="link tap text-sm">Join as {title.slice(0, -1).toLowerCase()}</Link>}
              </div>
            ))}
          </div>
        </section>

        <section className="closing">
          <div><h2>Something left over today?</h2><p className="m-0 mt-2 muted">Post it in under a minute. Matching organisations nearby are told straight away.</p></div>
          <Link to="/register" className="btn btn-primary btn-lg">Create a free account <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
      </div>
    </PublicLayout>
  );
}
