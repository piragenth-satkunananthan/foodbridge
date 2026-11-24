import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bike, Building2, HandHeart, Leaf, MapPin, Recycle, ShieldCheck, Truck, Utensils } from 'lucide-react';
import { fetchPublicImpact, fetchLiveFeed } from '../api/client';
import useAsync from '../lib/useAsync';
import { fmtNum, fmtDate, STORAGE_LABEL, WASTE_LABEL } from '../lib/format';
import PublicLayout from '../components/PublicLayout';
import { Card, Empty, ErrorState, Loading, StatusBadge } from '../components/ui';

const ROLES = [
  [Utensils, 'Donors', 'Hotels, wedding halls, restaurants, bakeries and households post surplus in under a minute.'],
  [HandHeart, 'Recipients', 'Verified NGOs, charities and shelters claim nearby food that fits their storage and capacity.'],
  [Bike, 'Volunteers', 'Accept a pickup, record collection and arrival — every step is time-stamped.'],
  [Recycle, 'Recyclers', 'Licensed recyclers and composting facilities collect sorted material they can process.'],
  [ShieldCheck, 'Administrators', 'Verify organisations, handle reports and remove fake accounts.']
];

function Metric({ label, value, unit, note }) {
  return (
    <div className="card stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}<span className="text-base font-semibold muted"> {unit}</span></div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

function Impact() {
  const { data, error, loading, reload } = useAsync(fetchPublicImpact);
  if (error) return <ErrorState message={`Impact figures are unavailable right now (${error}).`} onRetry={reload} />;
  if (loading && !data) return <Card><Loading rows={3} /></Card>;
  const s = data.summary, e = data.ecosystem;
  return (
    <div className="grid gap-4">
      <div className="stat-grid">
        <Metric label="Meals rescued" value={fmtNum(s.mealsRescued)} unit="meals" note="Estimated from confirmed quantities" />
        <Metric label="Recycled" value={fmtNum(s.totalKgRecycled, 1)} unit="kg" note="Plastic, glass, paper, metal" />
        <Metric label="Organic composted" value={fmtNum(s.kgOrganicDiverted, 1)} unit="kg" />
        <Metric label="Districts covered" value={fmtNum(s.districtsCoveredCount)} unit="of 25" />
      </div>
      <div className="meta">
        <span><Building2 size={14} aria-hidden="true" />{fmtNum(e.verifiedNGOs)} verified food organisations</span>
        <span><Recycle size={14} aria-hidden="true" />{fmtNum(e.verifiedRecyclers)} verified recyclers & composters</span>
        <span><Bike size={14} aria-hidden="true" />{fmtNum(e.activeVolunteers)} active volunteers</span>
      </div>
      <p className="hint m-0">Counts only organisation-confirmed, non-demonstration activity. Meals use declared portions, or 2.5 per kg.</p>
    </div>
  );
}

function LiveFeed() {
  const { data, error, loading } = useAsync(fetchLiveFeed);
  if (error) return <ErrorState message="Recent activity is unavailable." />;
  if (loading && !data) return <Loading rows={4} />;
  if (!data.items.length) return <Empty title="No activity yet">The first posts will appear here.</Empty>;
  return (
    <div className="list">
      {data.items.slice(0, 6).map((i) => (
        <div key={i.id} className="row-item">
          <span className={`icon-tile ${i.type === 'waste' ? 'waste' : ''}`}>{i.type === 'waste' ? <Recycle size={18} aria-hidden="true" /> : <Utensils size={18} aria-hidden="true" />}</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2"><strong className="truncate">{i.type === 'waste' ? WASTE_LABEL[i.wasteCategory] : i.itemTitle}</strong><StatusBadge status={i.status} /></div>
            <div className="meta"><span>{i.quantity}</span><span><MapPin size={13} aria-hidden="true" />{i.district}</span>{i.storageCondition && <span>{STORAGE_LABEL[i.storageCondition]}</span>}<span>{fmtDate(i.createdAt)}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <PublicLayout>
      <section className="hero">
        <div className="wrap grid gap-10 lg:grid-cols-[1.15fr_1fr] items-center">
          <div>
            <p className="eyebrow">Food rescue · Waste routing · Sri Lanka</p>
            <h1 className="mt-3">Every surplus finds the <em>right place</em> before it spoils.</h1>
            <p className="lead mt-5">FoodBridge sorts each surplus post into edible food or a waste stream, then routes it to a verified NGO, recycler or composting facility nearby — with a volunteer to carry it.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn btn-primary btn-lg">Start posting surplus <ArrowRight size={18} aria-hidden="true" /></Link>
              <Link to="/register?role=recipient" className="btn btn-secondary btn-lg">Register an organisation</Link>
            </div>
          </div>
          <Card title="Recent activity" pad={false}><LiveFeed /></Card>
        </div>
      </section>

      <section className="section" id="impact" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--border)' }}>
        <div className="wrap grid gap-6">
          <div><p className="eyebrow">Public impact</p><h2 className="mt-2">Recorded outcomes, not estimates dressed up as facts</h2></div>
          <Impact />
        </div>
      </section>

      <section className="section">
        <div className="wrap grid gap-8">
          <div><p className="eyebrow">How it works</p><h2 className="mt-2">One post, two pathways</h2></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card pathway food">
              <span className="icon-tile"><Utensils size={20} aria-hidden="true" /></span>
              <h3 className="mt-4 text-lg">Edible food → people</h3>
              <ol className="mt-4 grid gap-3 p-0" style={{ listStyle: 'none' }}>
                {['Donor declares food, storage and pickup deadline', 'Verified recipients nearby see it ranked by distance and freshness', 'A volunteer collects and delivers; the recipient confirms receipt'].map((t, i) => <li key={t} className="flex gap-3 items-start"><span className="step-num">{i + 1}</span><span className="pt-1">{t}</span></li>)}
              </ol>
            </div>
            <div className="card pathway waste">
              <span className="icon-tile waste"><Leaf size={20} aria-hidden="true" /></span>
              <h3 className="mt-4 text-lg">Waste → the right facility</h3>
              <ol className="mt-4 grid gap-3 p-0" style={{ listStyle: 'none' }}>
                {['Material is classified: plastic, glass, paper, metal, organic or residual', 'Only collectors that process that material can claim it', 'After collection, the facility records recycling, composting or disposal'].map((t, i) => <li key={t} className="flex gap-3 items-start"><span className="step-num" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>{i + 1}</span><span className="pt-1">{t}</span></li>)}
              </ol>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map(([Icon, title, text]) => (
              <div key={title} className="card card-pad">
                <Icon size={20} className="text-[var(--primary)]" aria-hidden="true" />
                <h3 className="mt-3 text-base">{title}</h3>
                <p className="text-sm muted mt-1 mb-0">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pt-0">
        <div className="wrap">
          <div className="card card-pad flex flex-wrap items-center justify-between gap-4" style={{ background: 'var(--primary)', color: 'var(--on-primary)', borderColor: 'transparent' }}>
            <div><h2 style={{ color: 'inherit' }} className="text-2xl">Have surplus today?</h2><p className="m-0 mt-1 opacity-90">Post it now; matching organisations are notified straight away.</p></div>
            <Link to="/register" className="btn btn-lg" style={{ background: 'var(--surface)', color: 'var(--primary)' }}><Truck size={18} aria-hidden="true" />Create a free account</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
