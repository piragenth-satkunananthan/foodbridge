import React, { useEffect, useState } from 'react';
import { Building2, LocateFixed, Save, ShieldCheck } from 'lucide-react';
import { fetchMyOrganization, saveMyOrganization } from '../api/client';
import useAsync from '../lib/useAsync';
import { DISTRICTS, ORG_TYPE_LABEL, STORAGE_LABEL, WASTE_LABEL, fmtDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { Badge, Button, Card, ErrorState, Field, Loading, PageHead, StatusBadge } from './ui';

const TYPES = { recipient: ['ngo', 'charity', 'shelter'], recycler: ['recycler', 'composting_facility', 'waste_management'] };
const MATERIALS_FOR = { recycler: ['plastic', 'glass', 'paper', 'metal'], composting_facility: ['organic'], waste_management: ['non_recyclable'] };

const blank = (role, district) => ({
  name: '', type: TYPES[role][0], registrationInfo: '', district: district || 'Colombo', capacityKg: '',
  serviceDistricts: [], storageConditions: [], foodTypes: '', materialTypesHandled: [], accepting: true,
  city: '', area: '', address: '', location: null
});

export function useOrganization() {
  return useAsync(fetchMyOrganization);
}

export function VerificationBanner({ org }) {
  if (!org) return <div className="alert alert-warning"><Building2 size={18} aria-hidden="true" /><div><strong>Set up your organisation profile.</strong> Claiming requires a verified profile with declared capacity.</div></div>;
  if (org.verificationStatus === 'pending') return <div className="alert alert-warning"><ShieldCheck size={18} aria-hidden="true" /><div><strong>Verification pending.</strong> An administrator is reviewing {org.name}. You can browse, but claiming unlocks once verified.</div></div>;
  if (org.verificationStatus === 'rejected') return <div className="alert alert-danger"><ShieldCheck size={18} aria-hidden="true" /><div><strong>Verification was not approved.</strong> {org.verificationRemarks || 'Update your profile and resubmit.'}</div></div>;
  if (!org.accepting) return <div className="alert"><ShieldCheck size={18} aria-hidden="true" /><div>{org.name} is verified but currently <strong>not accepting</strong> new claims.</div></div>;
  return null;
}

function Multi({ options, value, onChange, labels }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <div className="choice-row">
      {options.map((o) => (
        <label key={o} className="choice"><input type="checkbox" checked={value.includes(o)} onChange={() => toggle(o)} />{labels?.[o] || o}</label>
      ))}
    </div>
  );
}

export default function OrgProfile({ role }) {
  const { user } = useAuth();
  const { data, error, loading, reload } = useOrganization();
  const { addToast } = useToast();
  const [form, setForm] = useState(blank(role, user?.district));
  const [busy, setBusy] = useState(false);
  const org = data?.organization;

  useEffect(() => {
    if (org) setForm({ ...blank(role), ...org, capacityKg: org.capacityKg ?? '', foodTypes: (org.foodTypes || []).join(', '), location: org.location?.lat != null ? org.location : null });
  }, [org, role]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => set('location', { lat: +p.coords.latitude.toFixed(5), lng: +p.coords.longitude.toFixed(5) }),
    () => addToast('Location permission was not granted', 'error')
  );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const isRecipient = role === 'recipient';
    const payload = {
      name: form.name, type: form.type, registrationInfo: form.registrationInfo, district: form.district,
      capacityKg: Number(form.capacityKg), serviceDistricts: form.serviceDistricts, accepting: form.accepting,
      city: form.city, area: form.area, address: form.address,
      storageConditions: isRecipient ? form.storageConditions : [],
      foodTypes: isRecipient ? form.foodTypes.split(',').map((s) => s.trim()).filter(Boolean) : [],
      materialTypesHandled: isRecipient ? [] : form.materialTypesHandled.filter((m) => MATERIALS_FOR[form.type].includes(m)),
      ...(form.location ? { location: form.location } : {})
    };
    try {
      await saveMyOrganization(payload);
      addToast('Profile submitted for verification');
      reload();
    } catch (err) { addToast(err.message, 'error'); } finally { setBusy(false); }
  };

  if (loading && !data) return <Card><Loading rows={6} /></Card>;
  return (
    <>
      <PageHead title="Organisation profile" subtitle="Your profile decides which posts you can claim: type, capacity, storage or materials, and service districts.">
        {org && <StatusBadge status={org.verificationStatus} />}
      </PageHead>
      {error && <ErrorState message={error} onRetry={reload} />}
      {org?.verificationStatus === 'verified' && <div className="alert alert-success"><ShieldCheck size={18} aria-hidden="true" /><div>Verified {org.verifiedAt ? `on ${fmtDate(org.verifiedAt)}` : ''}. <strong>Saving changes sends the profile back for review</strong> and pauses claiming until re-verified.</div></div>}
      {org?.reservedKg > 0 && <div className="alert alert-warning">Profile changes are locked while {org.reservedKg} kg is reserved by active claims.</div>}
      <form onSubmit={submit} className="grid gap-5">
        <Card title="Organisation">
          <div className="form-grid">
            <Field label="Organisation name"><input className="input" required maxLength={200} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Type">
              <select className="input" value={form.type} onChange={(e) => set('type', e.target.value)}>
                {TYPES[role].map((t) => <option key={t} value={t}>{ORG_TYPE_LABEL[t]}</option>)}
              </select>
            </Field>
            <Field label="Registration / licence number"><input className="input" required maxLength={1000} value={form.registrationInfo} onChange={(e) => set('registrationInfo', e.target.value)} /></Field>
            <Field label="Daily capacity (kg)" hint="Claims are refused beyond this declared capacity."><input className="input num" type="number" min="1" step="any" required value={form.capacityKg} onChange={(e) => set('capacityKg', e.target.value)} /></Field>
          </div>
        </Card>
        <Card title="Location & coverage">
          <div className="form-grid">
            <Field label="District"><select className="input" value={form.district} onChange={(e) => set('district', e.target.value)}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
            <Field label="City"><input className="input" maxLength={100} value={form.city} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label="Area"><input className="input" maxLength={100} value={form.area} onChange={(e) => set('area', e.target.value)} /></Field>
            <Field label="Address"><input className="input" maxLength={500} value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="secondary" icon={LocateFixed} onClick={locate}>Use current location</Button>
            {form.location ? <Badge tone="success">{form.location.lat}, {form.location.lng}</Badge> : <span className="hint">Optional. Without coordinates, distances are district estimates.</span>}
          </div>
          <div className="mt-5 grid gap-2">
            <span className="text-sm font-semibold">Service districts</span>
            <span className="hint">Leave empty to accept posts from any district.</span>
            <Multi options={DISTRICTS} value={form.serviceDistricts} onChange={(v) => set('serviceDistricts', v)} />
          </div>
        </Card>
        <Card title={role === 'recipient' ? 'Food you can accept' : 'Materials you process'}>
          {role === 'recipient' ? (
            <div className="grid gap-5">
              <div className="grid gap-2"><span className="text-sm font-semibold">Storage you can handle (required)</span><Multi options={Object.keys(STORAGE_LABEL)} labels={STORAGE_LABEL} value={form.storageConditions} onChange={(v) => set('storageConditions', v)} /></div>
              <Field label="Accepted food types" hint="Comma separated, e.g. rice, bread. Leave empty to accept any food type."><input className="input" value={form.foodTypes} onChange={(e) => set('foodTypes', e.target.value)} /></Field>
            </div>
          ) : (
            <div className="grid gap-2">
              <span className="text-sm font-semibold">Materials (required)</span>
              <span className="hint">{form.type === 'recycler' ? 'Recyclers handle plastic, glass, paper and metal.' : form.type === 'composting_facility' ? 'Composting facilities handle organic waste only.' : 'Waste management handles non-recyclable disposal only.'}</span>
              <Multi options={MATERIALS_FOR[form.type]} labels={WASTE_LABEL} value={form.materialTypesHandled} onChange={(v) => set('materialTypesHandled', v)} />
            </div>
          )}
          <label className="choice mt-5"><input type="checkbox" checked={form.accepting} onChange={(e) => set('accepting', e.target.checked)} />Currently accepting new claims</label>
        </Card>
        <div><Button type="submit" size="lg" icon={Save} loading={busy} disabled={org?.reservedKg > 0}>{org ? 'Save & resubmit for verification' : 'Submit for verification'}</Button></div>
      </form>
    </>
  );
}
