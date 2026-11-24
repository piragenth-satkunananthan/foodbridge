import React, { useState } from 'react';
import { Ban, Camera, Check, Download, FileBarChart, RotateCcw, Search, ShieldCheck, Undo2, X } from 'lucide-react';
import {
  cancelDonationClaim, cancelWasteClaim, fetchAllDonations, fetchAllPickups, fetchAllUsers, fetchAllWasteRequests, fetchComplaints,
  fetchOrganizationDetails, fetchOrganizations, fetchPublicImpact, fetchReports, resolveComplaint, snapshotImpact, updateUserStatus, verifyOrganization
} from '../../api/client';
import useAsync from '../../lib/useAsync';
import { DISTRICTS, ORG_TYPE_LABEL, ROLE_LABEL, STORAGE_LABEL, WASTE_LABEL, fmtDate, fmtNum } from '../../lib/format';
import { downloadCSV, exportImpactMetricsCSV, exportOrganizationsCSV } from '../../utils/exportUtils';
import { useToast } from '../../components/Toast';
import { Badge, Button, Card, Empty, ErrorState, Field, Loading, Modal, PageHead, Stat, StatusBadge, Tabs } from '../../components/ui';

const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v && v !== 'all'));

function Filters({ children, onSearch, placeholder = 'Search' }) {
  const [q, setQ] = useState('');
  return (
    <form className="card-pad flex flex-wrap gap-3" onSubmit={(e) => { e.preventDefault(); onSearch?.(q.trim()); }}>
      {onSearch && (
        <div className="flex gap-2 flex-1 min-w-[220px]">
          <label className="sr-only" htmlFor="aq">{placeholder}</label>
          <input id="aq" className="input" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="secondary" icon={Search}>Search</Button>
        </div>
      )}
      {children}
    </form>
  );
}
const Select = ({ label, value, onChange, options }) => (
  <label className="flex items-center gap-2">
    <span className="sr-only">{label}</span>
    <select className="input" style={{ width: 'auto' }} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>
);

/* ---------------- Verification ---------------- */
function OrgReview({ id, onClose, onDone }) {
  const { addToast } = useToast();
  const { data, error, loading } = useAsync(() => fetchOrganizationDetails(id), [id]);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(null);
  const org = data?.organization;
  const decide = async (status) => {
    if (status === 'rejected' && !remarks.trim()) return addToast('Add remarks explaining the rejection', 'error');
    setBusy(status);
    try { await verifyOrganization(id, status, remarks.trim()); addToast(`Organisation ${status}`); onDone(); }
    catch (err) { addToast(err.message, 'error'); } finally { setBusy(null); }
  };
  return (
    <Modal open wide onClose={onClose} title={org?.name || 'Organisation'}
      footer={org && <><Button variant="danger" icon={X} loading={busy === 'rejected'} onClick={() => decide('rejected')}>Reject</Button><Button icon={Check} loading={busy === 'verified'} onClick={() => decide('verified')}>Verify</Button></>}>
      {error && <ErrorState message={error} />}
      {loading && !data && <Loading rows={6} />}
      {org && (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2"><StatusBadge status={org.verificationStatus} /><Badge plain>{ORG_TYPE_LABEL[org.type]}</Badge>{!org.accepting && <Badge>Not accepting</Badge>}</div>
          <div className="grid gap-6 md:grid-cols-2">
            <dl className="dl">
              <dt>Registration</dt><dd>{org.registrationInfo}</dd>
              <dt>District</dt><dd>{org.district}</dd>
              <dt>Address</dt><dd>{[org.address, org.area, org.city].filter(Boolean).join(', ') || '—'}</dd>
              <dt>Capacity</dt><dd>{org.capacityKg ?? '—'} kg ({org.reservedKg || 0} reserved)</dd>
              <dt>Service area</dt><dd>{org.serviceDistricts?.length ? org.serviceDistricts.join(', ') : 'Any district'}</dd>
              {org.storageConditions?.length > 0 && <><dt>Storage</dt><dd>{org.storageConditions.map((s) => STORAGE_LABEL[s]).join(', ')}</dd></>}
              {org.materialTypesHandled?.length > 0 && <><dt>Materials</dt><dd>{org.materialTypesHandled.map((m) => WASTE_LABEL[m]).join(', ')}</dd></>}
            </dl>
            <dl className="dl">
              <dt>Contact</dt><dd>{org.linkedUser?.name}</dd>
              <dt>Email</dt><dd>{org.linkedUser?.email}</dd>
              <dt>Phone</dt><dd>{org.linkedUser?.contactNumber}</dd>
              <dt>Account</dt><dd><StatusBadge status={org.linkedUser?.status} /></dd>
              <dt>Submitted</dt><dd>{fmtDate(org.updatedAt)}</dd>
              {org.verifiedBy && <><dt>Last decision</dt><dd>{org.verifiedBy.name}, {fmtDate(org.verifiedAt)}</dd></>}
            </dl>
          </div>
          <p className="text-sm muted m-0">Activity: {data.activity.donations.length} food claims, {data.activity.wasteRequests.length} waste claims (latest 10 each).</p>
          <Field label="Remarks" hint="Sent to the organisation. Required when rejecting."><textarea className="input" rows={2} maxLength={1000} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
        </div>
      )}
    </Modal>
  );
}

export function Verification() {
  const [f, setF] = useState({ status: 'pending', type: 'all', search: '' });
  const list = useAsync(() => fetchOrganizations(clean(f)), [f.status, f.type, f.search]);
  const [open, setOpen] = useState(null);
  return (
    <>
      <PageHead title="Organisation verification" subtitle="Only verified, accepting organisations can claim posts.">
        <Button variant="secondary" icon={Download} disabled={!list.data?.length} onClick={() => exportOrganizationsCSV(list.data)}>Export CSV</Button>
      </PageHead>
      <Card pad={false}>
        <Filters onSearch={(search) => setF({ ...f, search })} placeholder="Search name or registration">
          <Select label="Status" value={f.status} onChange={(status) => setF({ ...f, status })} options={[['pending', 'Pending'], ['verified', 'Verified'], ['rejected', 'Rejected'], ['all', 'All']]} />
          <Select label="Type" value={f.type} onChange={(type) => setF({ ...f, type })} options={[['all', 'All types'], ...Object.entries(ORG_TYPE_LABEL)]} />
        </Filters>
        {list.error && <div className="px-5 pb-5"><ErrorState message={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? <Loading /> : !list.data?.length ? <Empty icon={ShieldCheck} title="Nothing to review" /> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Organisation</th><th>Type</th><th>District</th><th>Capacity</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{list.data.map((o) => (
              <tr key={o._id}>
                <td><div className="font-semibold">{o.name}</div><div className="text-xs muted">{o.registrationInfo}</div></td>
                <td>{ORG_TYPE_LABEL[o.type]}</td><td>{o.district}</td><td className="num">{o.capacityKg ?? '—'} kg</td>
                <td><StatusBadge status={o.verificationStatus} /></td>
                <td className="text-right"><Button size="sm" variant="secondary" onClick={() => setOpen(o._id)}>Review</Button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
      {open && <OrgReview id={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); list.reload(); }} />}
    </>
  );
}

/* ---------------- Monitoring ---------------- */
const POST_STATUSES = ['all', 'posted', 'matched', 'pickup_scheduled', 'picked_up', 'delivered', 'completed', 'cancelled', 'expired'];
const PICKUP_STATUSES = ['all', 'matched', 'pickup_scheduled', 'picked_up', 'delivered_or_recycled', 'completed', 'cancelled', 'expired', 'rejected'];

export function Monitoring() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('donations');
  const [f, setF] = useState({ status: 'all', district: 'all', search: '' });
  const fetcher = { donations: fetchAllDonations, waste: fetchAllWasteRequests, pickups: fetchAllPickups }[tab];
  const list = useAsync(() => fetcher(clean(tab === 'pickups' ? { status: f.status } : f)), [tab, f.status, f.district, f.search]);
  const release = async (row) => {
    if (!window.confirm('Release this claim on behalf of the organisation? The post returns to the open list.')) return;
    try {
      await (tab === 'donations' ? cancelDonationClaim(row._id, 'Released by administrator') : cancelWasteClaim(row._id));
      addToast('Claim released');
      list.reload();
    } catch (err) { addToast(err.message, 'error'); }
  };
  const rows = list.data || [];
  return (
    <>
      <PageHead title="Platform monitoring" subtitle="Every donation, waste request and pickup across the platform." />
      <Card pad={false}>
        <div className="px-5 pt-3"><Tabs label="Records" value={tab} onChange={(t) => { setTab(t); setF({ status: 'all', district: 'all', search: '' }); }} tabs={[['donations', 'Donations'], ['waste', 'Waste requests'], ['pickups', 'Pickups']]} /></div>
        <Filters key={tab} onSearch={tab === 'pickups' ? undefined : (search) => setF({ ...f, search })} placeholder={tab === 'donations' ? 'Search food or instructions' : 'Search quantity'}>
          <Select label="Status" value={f.status} onChange={(status) => setF({ ...f, status })} options={(tab === 'pickups' ? PICKUP_STATUSES : POST_STATUSES).map((s) => [s, s === 'all' ? 'All statuses' : s.replaceAll('_', ' ')])} />
          {tab !== 'pickups' && <Select label="District" value={f.district} onChange={(district) => setF({ ...f, district })} options={[['all', 'All districts'], ...DISTRICTS.map((d) => [d, d])]} />}
        </Filters>
        {list.error && <div className="px-5 pb-5"><ErrorState message={list.error} onRetry={list.reload} /></div>}
        {list.loading ? <Loading /> : !rows.length ? <Empty title="No records" /> : (
          <div className="table-wrap"><table className="table">
            {tab === 'pickups' ? (
              <>
                <thead><tr><th>Item</th><th>Volunteer</th><th>Receiver</th><th>Stage</th><th>Updated</th></tr></thead>
                <tbody>{rows.map((p) => {
                  const src = p.donation || p.wasteRequest || p.sourceSnapshot || {};
                  return (
                    <tr key={p._id}>
                      <td><div className="font-semibold">{src.foodType || WASTE_LABEL[src.wasteCategory] || '—'}</div><div className="text-xs muted">{src.quantity} · {src.district}</div></td>
                      <td>{p.volunteer?.name || <span className="muted">Unassigned</span>}</td>
                      <td>{p.receivingOrganization?.name}</td>
                      <td><StatusBadge status={p.statusPipeline} /></td>
                      <td className="text-sm muted">{fmtDate(p.updatedAt)}</td>
                    </tr>
                  );
                })}</tbody>
              </>
            ) : (
              <>
                <thead><tr><th>Item</th><th>Donor</th><th>District</th><th>Receiver</th><th>Status</th><th>Posted</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>{rows.map((r) => {
                  const recv = r.matchedRecipient || r.matchedCollector;
                  return (
                    <tr key={r._id}>
                      <td><div className="font-semibold">{tab === 'donations' ? r.foodType : WASTE_LABEL[r.wasteCategory]}</div><div className="text-xs muted">{r.quantity}{r.isDemo ? ' · demo' : ''}</div></td>
                      <td>{r.donor?.name}<div className="text-xs muted">{r.donor?.contactNumber}</div></td>
                      <td>{r.district}</td>
                      <td>{recv?.name || <span className="muted">—</span>}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className="text-sm muted">{fmtDate(r.createdAt)}</td>
                      <td>{['matched', 'pickup_scheduled'].includes(r.status) && <Button size="sm" variant="ghost" icon={Undo2} onClick={() => release(r)}>Release</Button>}</td>
                    </tr>
                  );
                })}</tbody>
              </>
            )}
          </table></div>
        )}
      </Card>
    </>
  );
}

/* ---------------- Users ---------------- */
export function Users() {
  const { addToast } = useToast();
  const [f, setF] = useState({ role: 'all', status: 'all', search: '' });
  const list = useAsync(() => fetchAllUsers(clean(f)), [f.role, f.status, f.search]);
  const toggle = async (u) => {
    const suspend = u.status === 'active';
    const reason = suspend ? window.prompt(`Suspend ${u.name}? They will be signed out immediately. Reason (sent to the user):`) : '';
    if (reason === null) return;
    try { await updateUserStatus(u._id, suspend ? 'suspended' : 'active', reason || undefined); addToast(suspend ? 'Account suspended' : 'Account reactivated'); list.reload(); }
    catch (err) { addToast(err.message, 'error'); }
  };
  return (
    <>
      <PageHead title="Users & accounts" subtitle="Suspend fake or abusive accounts. History is retained; nothing is deleted." />
      <Card pad={false}>
        <Filters onSearch={(search) => setF({ ...f, search })} placeholder="Search name, email or phone">
          <Select label="Role" value={f.role} onChange={(role) => setF({ ...f, role })} options={[['all', 'All roles'], ...Object.entries(ROLE_LABEL)]} />
          <Select label="Status" value={f.status} onChange={(status) => setF({ ...f, status })} options={[['all', 'Any status'], ['active', 'Active'], ['suspended', 'Suspended']]} />
        </Filters>
        {list.error && <div className="px-5 pb-5"><ErrorState message={list.error} onRetry={list.reload} /></div>}
        {list.loading && !list.data ? <Loading /> : !list.data?.length ? <Empty title="No users match" /> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>User</th><th>Role</th><th>District</th><th>Organisation</th><th>Status</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>{list.data.map((u) => (
              <tr key={u._id}>
                <td><div className="font-semibold">{u.name}</div><div className="text-xs muted">{u.email} · {u.contactNumber}</div></td>
                <td>{ROLE_LABEL[u.role]}</td><td>{u.district}</td>
                <td>{u.organization ? <span>{u.organization.name} <StatusBadge status={u.organization.verificationStatus} /></span> : <span className="muted">—</span>}</td>
                <td><StatusBadge status={u.status} /></td>
                <td className="text-sm muted">{fmtDate(u.createdAt)}</td>
                <td>{u.role !== 'admin' && <Button size="sm" variant={u.status === 'active' ? 'danger' : 'secondary'} icon={u.status === 'active' ? Ban : RotateCcw} onClick={() => toggle(u)}>{u.status === 'active' ? 'Suspend' : 'Reactivate'}</Button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}

/* ---------------- Complaints ---------------- */
function Resolve({ complaint, onClose, onDone }) {
  const { addToast } = useToast();
  const [status, setStatus] = useState(complaint.status === 'open' ? 'investigating' : 'resolved');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await resolveComplaint(complaint._id, status, note); addToast('Report updated; the reporter was notified'); onDone(); }
    catch (err) { addToast(err.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={complaint.subject} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="resolve" loading={busy}>Update</Button></>}>
      <form id="resolve" onSubmit={submit} className="grid gap-4">
        <p className="m-0 text-sm">{complaint.description}</p>
        <dl className="dl text-sm"><dt>About</dt><dd>{complaint.relatedType}{complaint.relatedId ? ` · ${complaint.relatedId}` : ''}</dd><dt>Filed</dt><dd>{fmtDate(complaint.createdAt)}</dd></dl>
        <div className="choice-row">{['investigating', 'resolved', 'dismissed'].map((s) => <label key={s} className="choice"><input type="radio" checked={status === s} onChange={() => setStatus(s)} />{s}</label>)}</div>
        <Field label="Response to reporter"><textarea className="input" rows={3} required maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <p className="hint m-0">To act on a fake account, suspend it from Users & accounts.</p>
      </form>
    </Modal>
  );
}

export function Complaints() {
  const [status, setStatus] = useState('open');
  const list = useAsync(() => fetchComplaints(status === 'all' ? {} : { status }), [status]);
  const [open, setOpen] = useState(null);
  return (
    <>
      <PageHead title="Complaints & reports" subtitle="Reports filed by users about the platform, accounts or specific records." />
      <Card pad={false}>
        <div className="px-5 pt-3"><Tabs label="Complaint status" value={status} onChange={setStatus} tabs={[['open', 'Open'], ['investigating', 'Investigating'], ['resolved', 'Resolved'], ['dismissed', 'Dismissed'], ['all', 'All']]} /></div>
        {list.error && <div className="card-pad"><ErrorState message={list.error} onRetry={list.reload} /></div>}
        {list.loading ? <Loading /> : !list.data?.complaints.length ? <Empty title="No reports here" /> : (
          <div className="list">{list.data.complaints.map((c) => (
            <div key={c._id} className="row-item">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2"><strong>{c.subject}</strong><StatusBadge status={c.status} /><Badge plain>{c.relatedType}</Badge></div>
                <p className="text-sm muted mt-1 mb-0 line-clamp-2">{c.description}</p>
                <div className="meta mt-1"><span>{fmtDate(c.createdAt)}</span></div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setOpen(c)}>Respond</Button>
            </div>
          ))}</div>
        )}
      </Card>
      {open && <Resolve complaint={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); list.reload(); }} />}
    </>
  );
}

/* ---------------- Reports ---------------- */
export function Reports() {
  const { addToast } = useToast();
  const [f, setF] = useState({ fromDate: '', toDate: '', district: 'all' });
  const [applied, setApplied] = useState(f);
  const report = useAsync(() => fetchReports(clean(applied)), [applied]);
  const r = report.data;
  const snapshot = async () => {
    try { const res = await snapshotImpact(); addToast(res.message); } catch (err) { addToast(err.message, 'error'); }
  };
  const exportPublic = async () => {
    try { const p = await fetchPublicImpact(); exportImpactMetricsCSV(p.summary, p.ecosystem); } catch (err) { addToast(err.message, 'error'); }
  };
  const exportReport = () => downloadCSV('FoodBridge_Report', [
    { Metric: 'Period', Value: `${applied.fromDate || 'start'} to ${applied.toDate || 'today'}`, District: applied.district },
    { Metric: 'Donations posted', Value: r.summary.totalDonations }, { Metric: 'Waste requests posted', Value: r.summary.totalWasteRequests },
    { Metric: 'Donations completed', Value: r.summary.completedDonations }, { Metric: 'Waste requests completed', Value: r.summary.completedWasteRequests },
    { Metric: 'Meals rescued (estimated)', Value: r.impact.mealsRescued },
    ...Object.entries(r.impact.kgRecycled).map(([k, v]) => ({ Metric: `Recycled ${k} (kg)`, Value: v })),
    { Metric: 'Organic composted (kg)', Value: r.impact.kgOrganicDiverted },
    { Metric: 'Districts covered', Value: r.impact.districtsCovered.join(' ') },
    { Metric: 'Basis', Value: r.periodBasis }
  ]);
  return (
    <>
      <PageHead title="Reports" subtitle="Confirmed, non-demonstration activity. Posts are counted by creation date; outcomes by completion date.">
        <Button variant="secondary" icon={Camera} onClick={snapshot}>Save monthly snapshot</Button>
        <Button variant="secondary" icon={Download} onClick={exportPublic}>Public impact CSV</Button>
      </PageHead>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setApplied(f); }}>
          <Field label="From"><input type="date" className="input" value={f.fromDate} onChange={(e) => setF({ ...f, fromDate: e.target.value })} /></Field>
          <Field label="To"><input type="date" className="input" value={f.toDate} onChange={(e) => setF({ ...f, toDate: e.target.value })} /></Field>
          <Field label="District"><select className="input" value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })}><option value="all">All districts</option>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Button type="submit" icon={FileBarChart}>Run report</Button>
          {r && <Button variant="secondary" icon={Download} onClick={exportReport}>Export CSV</Button>}
        </form>
      </Card>
      {report.error && <ErrorState message={report.error} onRetry={report.reload} />}
      {report.loading && !r ? <Card><Loading rows={4} /></Card> : r && (
        <>
          <div className="stat-grid">
            <Stat label="Donations posted" value={fmtNum(r.summary.totalDonations)} note={`${fmtNum(r.summary.completedDonations)} completed`} />
            <Stat label="Waste requests posted" value={fmtNum(r.summary.totalWasteRequests)} note={`${fmtNum(r.summary.completedWasteRequests)} completed`} />
            <Stat label="Meals rescued" value={fmtNum(r.impact.mealsRescued)} note="Estimated" />
            <Stat label="Recycled" value={`${fmtNum(Object.values(r.impact.kgRecycled).reduce((a, b) => a + b, 0), 1)} kg`} />
            <Stat label="Composted" value={`${fmtNum(r.impact.kgOrganicDiverted, 1)} kg`} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {[['Completed donations by district', r.donationsByDistrict], ['Completed waste by district', r.wasteByDistrict]].map(([title, rows]) => (
              <Card key={title} title={title} pad={false}>
                {!rows.length ? <Empty title="No completed activity in this period" /> : (
                  <table className="table"><thead><tr><th>District</th><th className="text-right">Completed</th></tr></thead>
                    <tbody>{[...rows].sort((a, b) => b.completed - a.completed).map((d) => <tr key={d._id}><td>{d._id}</td><td className="text-right num">{d.completed}</td></tr>)}</tbody></table>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
