import React, { useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { ArrowRight, Bike, Building2, CheckCircle2, Clock, History, LocateFixed, MapPin, Navigation, Phone, Recycle, Route as RouteIcon, Undo2, Utensils } from 'lucide-react';
import { acceptPickupJob, cancelPickupJob, fetchMyActivePickups, fetchOpenPickups, fetchPickupHistory, fetchVolunteerStats, updatePickupLocation, updatePickupStatus } from '../../api/client';
import useAsync from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { DISTRICTS, STORAGE_LABEL, WASTE_LABEL, fmtDate, fmtNum, isUrgent, routeUrl, timeLeft } from '../../lib/format';
import AppShell from '../../components/AppShell';
import Support from '../../components/Support';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Empty, ErrorState, Field, Loading, Modal, PageHead, Pipeline, Stat, StatusBadge } from '../../components/ui';

const NAV = [
  { to: '/volunteer', label: 'Open pickups', icon: Bike, end: true },
  { to: '/volunteer/active', label: 'My active jobs', icon: RouteIcon },
  { to: '/volunteer/history', label: 'History', icon: History }
];

const sourceOf = (job) => job.donation || job.wasteRequest || {};
const titleOf = (job) => (job.donation ? sourceOf(job).foodType : sourceOf(job).wasteCategory && `${WASTE_LABEL[sourceOf(job).wasteCategory]} waste`) || 'Item details not recorded';
const Kind = ({ job }) => (job.donation ? <span className="icon-tile"><Utensils size={18} aria-hidden="true" /></span> : <span className="icon-tile waste"><Recycle size={18} aria-hidden="true" /></span>);

function Open() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [district, setDistrict] = useState('all');
  const stats = useAsync(fetchVolunteerStats);
  const jobs = useAsync(() => fetchOpenPickups(district === 'all' ? {} : { district }), [district]);
  const [busy, setBusy] = useState(null);
  const accept = async (job) => {
    setBusy(job._id);
    try {
      await acceptPickupJob(job._id);
      addToast('Pickup accepted — find it under My active jobs');
      jobs.reload();
      stats.reload();
    } catch (err) { addToast(err.message, 'error'); jobs.reload(); } finally { setBusy(null); }
  };
  const s = stats.data?.stats;
  return (
    <>
      <PageHead title="Open pickups" subtitle={`Claimed surplus waiting for a volunteer. Nearest to ${user?.district} first.`}>
        <label className="sr-only" htmlFor="vd">District</label>
        <select id="vd" className="input" style={{ width: 'auto' }} value={district} onChange={(e) => setDistrict(e.target.value)}>
          <option value="all">All districts</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </PageHead>
      <div className="stat-grid">
        <Stat icon={RouteIcon} label="Active jobs" value={s ? fmtNum(s.activeMissions) : '—'} />
        <Stat icon={CheckCircle2} label="Completed" value={s ? fmtNum(s.completedMissions) : '—'} />
        <Stat icon={Utensils} label="Meals carried" value={s ? fmtNum(s.totalMealsTransported) : '—'} note="Estimated" />
        <Stat icon={Navigation} label="Distance" value={s ? `${fmtNum(s.totalKmTraveled, 1)} km` : '—'} note="Estimated, not tracked" />
      </div>
      <Card pad={false}>
        {jobs.error && <div className="card-pad"><ErrorState message={jobs.error} onRetry={jobs.reload} /></div>}
        {jobs.loading && !jobs.data ? <Loading /> : !jobs.data?.jobs.length ? <Empty icon={Bike} title="No open pickups">New jobs in your district are sent to your notifications.</Empty> : (
          <div className="list">
            {jobs.data.jobs.map((job) => {
              const src = sourceOf(job), r = job.routeDetails;
              return (
                <div key={job._id} className="row-item">
                  <Kind job={job} />
                  <div className="flex-1 min-w-0 grid gap-1">
                    <div className="flex flex-wrap items-center gap-2"><strong>{titleOf(job)}</strong><span className="muted text-sm">{src.quantity}</span>{isUrgent(src.pickupDeadline) && <Badge tone="danger">Urgent</Badge>}</div>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center gap-1"><MapPin size={13} aria-hidden="true" />{[src.city, r.originDistrict].filter(Boolean).join(', ')}</span>
                      <ArrowRight size={14} aria-hidden="true" className="muted" />
                      <span className="inline-flex items-center gap-1"><Building2 size={13} aria-hidden="true" />{job.receivingOrganization?.name}, {r.destinationDistrict}</span>
                    </div>
                    <div className="meta">
                      <span>~{fmtNum(r.volunteerToOriginKm)} km to pickup</span>
                      <span>~{fmtNum(r.routeDistanceKm, 1)} km trip · ~{fmtNum(r.transitTimeMinutes)} min</span>
                      <span><Clock size={13} aria-hidden="true" />{timeLeft(src.pickupDeadline)}</span>
                    </div>
                  </div>
                  <Button size="sm" loading={busy === job._id} onClick={() => accept(job)}>Accept</Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <p className="hint m-0">Distances and times are planning estimates (district or straight-line), not road navigation. Contact details unlock after you accept.</p>
    </>
  );
}

function AdvanceDialog({ job, next, onClose, onDone }) {
  const { addToast } = useToast();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const label = next === 'picked_up' ? 'Record collection' : 'Record arrival';
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await updatePickupStatus(job._id, { status: next, ...(note.trim() ? { note: note.trim(), proofNotes: note.trim() } : {}) });
      addToast(next === 'picked_up' ? 'Collection recorded' : 'Arrival recorded — waiting for the receiver to confirm');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={label} footer={<><Button variant="secondary" onClick={onClose}>Back</Button><Button type="submit" form="adv" loading={busy}>{label}</Button></>}>
      <form id="adv" onSubmit={submit} className="grid gap-4">
        {error && <ErrorState message={error} />}
        <p className="m-0 text-sm muted">{next === 'picked_up' ? 'Confirm you have collected the full batch from the donor.' : `Confirm you have arrived at ${job.receivingOrganization?.name}. They will confirm receipt.`}</p>
        <Field label="Note (optional)" hint="Condition, packaging, who you handed over to…"><textarea className="input" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}

function ActiveJob({ job, onChanged }) {
  const { addToast } = useToast();
  const [advancing, setAdvancing] = useState(null);
  const src = sourceOf(job), org = job.receivingOrganization || {}, r = job.routeDetails, donor = src.donor || {};
  const stage = job.statusPipeline;
  const share = () => {
    if (!navigator.geolocation) return addToast('Location is not available on this device', 'error');
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try { await updatePickupLocation(job._id, { lat: p.coords.latitude, lng: p.coords.longitude }); addToast('Location shared with the donor and receiver'); }
        catch (err) { addToast(err.message, 'error'); }
      },
      () => addToast('Location permission was not granted', 'error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };
  const release = async () => {
    const reason = window.prompt('Why are you releasing this pickup? It goes back to the open list.');
    if (reason === null) return;
    try { await cancelPickupJob(job._id, reason.trim()); addToast('Pickup released'); onChanged(); } catch (err) { addToast(err.message, 'error'); }
  };
  const origin = { district: r.originDistrict, coords: r.originCoords };
  const dest = { district: r.destinationDistrict, coords: r.destinationCoords };
  return (
    <Card pad={false}>
      <div className="card-head">
        <div className="flex items-center gap-3"><Kind job={job} /><div><h2 className="text-base">{titleOf(job)}</h2><div className="text-sm muted">{src.quantity}{src.storageCondition ? ` · ${STORAGE_LABEL[src.storageCondition]}` : ''}</div></div></div>
        <StatusBadge status={stage} />
      </div>
      <div className="card-pad grid gap-5">
        <Pipeline status={stage} />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card card-pad" style={{ boxShadow: 'none' }}>
            <div className="eyebrow mb-2">1 · Collect from</div>
            <div className="font-semibold">{donor.name}</div>
            <div className="text-sm muted">{[src.address, src.area, src.city, src.district].filter(Boolean).join(', ')}</div>
            {donor.contactNumber && <a href={`tel:${donor.contactNumber}`} className="tap inline-flex items-center gap-1 text-sm text-[var(--leaf)] mt-2"><Phone size={13} aria-hidden="true" />{donor.contactNumber}</a>}
            <div className="text-sm mt-2"><Clock size={13} className="inline" aria-hidden="true" /> Deadline {fmtDate(src.pickupDeadline)}</div>
            {src.specialInstructions && <p className="text-sm mt-2 mb-0"><span className="muted">Instructions:</span> {src.specialInstructions}</p>}
          </div>
          <div className="card card-pad" style={{ boxShadow: 'none' }}>
            <div className="eyebrow mb-2">2 · Deliver to</div>
            <div className="font-semibold">{org.name}</div>
            <div className="text-sm muted">{[org.address, org.area, org.city, org.district].filter(Boolean).join(', ')}</div>
            {org.linkedUser?.contactNumber && <a href={`tel:${org.linkedUser.contactNumber}`} className="tap inline-flex items-center gap-1 text-sm text-[var(--leaf)] mt-2"><Phone size={13} aria-hidden="true" />{org.linkedUser.contactNumber}</a>}
            <div className="text-sm muted mt-2">~{fmtNum(r.routeDistanceKm, 1)} km · ~{fmtNum(r.transitTimeMinutes)} min ({r.distanceBasis})</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {stage === 'pickup_scheduled' && <Button icon={CheckCircle2} onClick={() => setAdvancing('picked_up')}>Record collection</Button>}
          {stage === 'picked_up' && <Button icon={CheckCircle2} onClick={() => setAdvancing('delivered_or_recycled')}>Record arrival</Button>}
          {stage === 'delivered_or_recycled' && <div className="alert alert-success flex-1">Arrival recorded. Waiting for {org.name} to confirm receipt.</div>}
          <a className="btn btn-secondary" href={routeUrl(origin, dest)} target="_blank" rel="noreferrer"><Navigation size={16} aria-hidden="true" />Open route map</a>
          <Button variant="secondary" icon={LocateFixed} onClick={share}>Share my location</Button>
          {stage === 'pickup_scheduled' && <Button variant="ghost" icon={Undo2} onClick={release}>Release job</Button>}
        </div>
        {r.locationUpdatedAt && <p className="hint m-0">Last shared location {fmtDate(r.locationUpdatedAt)}.</p>}
      </div>
      {advancing && <AdvanceDialog job={job} next={advancing} onClose={() => setAdvancing(null)} onDone={() => { setAdvancing(null); onChanged(); }} />}
    </Card>
  );
}

function Active() {
  const { data, error, loading, reload } = useAsync(fetchMyActivePickups);
  return (
    <>
      <PageHead title="My active jobs" subtitle="Record each step as it happens — every change is time-stamped and shared with the donor and receiver." />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && !data ? <Card><Loading rows={5} /></Card> : !data?.activeJobs.length ? <Card><Empty icon={RouteIcon} title="No active jobs">Accept an open pickup to start.</Empty></Card> : data.activeJobs.map((job) => <ActiveJob key={job._id} job={job} onChanged={reload} />)}
    </>
  );
}

function PastJobs() {
  const { data, error, loading, reload } = useAsync(fetchPickupHistory);
  return (
    <>
      <PageHead title="History" subtitle="Completed, released, rejected and expired pickups." />
      <Card pad={false}>
        {error && <div className="card-pad"><ErrorState message={error} onRetry={reload} /></div>}
        {loading && !data ? <Loading /> : !data?.history.length ? <Empty icon={History} title="No past pickups yet" /> : (
          <div className="list">
            {data.history.map((job) => (
              <div key={job._id} className="row-item">
                <Kind job={job} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><strong>{titleOf(job)}</strong><StatusBadge status={job.statusPipeline} /></div>
                  <div className="meta mt-1"><span>{sourceOf(job).quantity}</span><span>{job.routeDetails.originDistrict} → {job.receivingOrganization?.name || job.routeDetails.destinationDistrict}</span><span>{fmtDate(job.updatedAt)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

export default function VolunteerDashboard() {
  return (
    <AppShell nav={NAV}>
      <Routes>
        <Route index element={<Open />} />
        <Route path="active" element={<Active />} />
        <Route path="history" element={<PastJobs />} />
        <Route path="support" element={<Support />} />
      </Routes>
    </AppShell>
  );
}
