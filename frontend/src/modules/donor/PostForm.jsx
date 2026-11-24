import React, { useState } from 'react';
import { Leaf, Package, Sparkles, Utensils } from 'lucide-react';
import { classifyWasteItem, createSurplus, updateDonation, updateWasteRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { DISTRICTS, STORAGE_LABEL, WASTE_LABEL, fromLocalInput, toLocalInput } from '../../lib/format';
import { Badge, Button, ErrorState, Field, Modal } from '../../components/ui';

const KINDS = [
  ['edible', Utensils, 'Edible food', 'Safe to eat — goes to NGOs and shelters'],
  ['inedible', Leaf, 'Food not fit to eat', 'Spoiled or scraps — goes to composting'],
  ['material', Package, 'Recyclable or other waste', 'Plastic, glass, paper, metal or residual']
];
const hours = (h) => toLocalInput(Date.now() + h * 3600000);

function initial(post, kind, user) {
  if (post) return { ...post, preparedTime: toLocalInput(post.preparedTime), availableTime: toLocalInput(post.availableTime), pickupDeadline: toLocalInput(post.pickupDeadline), photo: post.photo || '' };
  return {
    foodType: '', quantity: '', storageCondition: 'room_temperature', preparedTime: hours(-1), availableTime: hours(0),
    pickupDeadline: hours(kind === 'edible' ? 4 : 48), district: user?.district || 'Colombo', city: '', area: '', address: '',
    photo: '', specialInstructions: '', wasteCategory: '', description: ''
  };
}

/** New post (post = null) or edit an open post ({ post, kind: 'donation' | 'wasteRequest' }). */
export default function PostForm({ open, onClose, onSaved, editing }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isEdit = Boolean(editing);
  const [kind, setKind] = useState(isEdit ? (editing.kind === 'donation' ? 'edible' : 'material') : 'edible');
  const [form, setForm] = useState(() => initial(editing?.post, kind, user));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isFood = kind === 'edible';
  const wasteLocked = isEdit && editing.post.wasteCategory === 'organic';

  const classify = async () => {
    setSuggestion(null);
    try {
      const res = await classifyWasteItem({ description: form.description });
      setSuggestion(res.classification);
      if (res.classification.category) setForm((f) => ({ ...f, wasteCategory: res.classification.category }));
    } catch (err) { setSuggestion({ reason: err.message }); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const common = {
      quantity: form.quantity, district: form.district, availableTime: fromLocalInput(form.availableTime), pickupDeadline: fromLocalInput(form.pickupDeadline),
      city: form.city, area: form.area, address: form.address, photo: form.photo.trim() || null, specialInstructions: form.specialInstructions
    };
    const food = { foodType: form.foodType, preparedTime: fromLocalInput(form.preparedTime), storageCondition: form.storageCondition };
    try {
      if (isEdit) {
        if (editing.kind === 'donation') await updateDonation(editing.post._id, { ...common, ...food });
        else await updateWasteRequest(editing.post._id, { ...common, ...(wasteLocked ? {} : { wasteCategory: form.wasteCategory }) });
        addToast('Post updated');
      } else {
        const body = kind === 'material'
          ? { itemType: 'material', ...common, wasteCategory: form.wasteCategory || undefined, description: form.description || undefined }
          : { itemType: 'food', condition: kind, ...common, ...(isFood ? food : {}) };
        const res = await createSurplus(body);
        addToast(res.kind === 'donation' ? 'Food posted — nearby organisations have been notified' : `Waste request posted (${WASTE_LABEL[res.post.wasteCategory]})`);
      }
      onSaved();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} wide title={isEdit ? 'Edit post' : 'Post surplus'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="post-form" loading={busy}>{isEdit ? 'Save changes' : 'Publish post'}</Button></>}>
      <form id="post-form" onSubmit={submit} className="grid gap-5">
        {error && <ErrorState message={error} />}
        {!isEdit && (
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-sm font-semibold mb-2">What are you posting?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {KINDS.map(([value, Icon, title, text]) => (
                <label key={value} className="choice" style={{ alignItems: 'flex-start', padding: 12 }}>
                  <input type="radio" name="kind" className="sr-only" checked={kind === value} onChange={() => { setKind(value); setForm((f) => ({ ...f, pickupDeadline: hours(value === 'edible' ? 4 : 48) })); }} />
                  <Icon size={20} aria-hidden="true" style={{ marginTop: 2 }} />
                  <span><span className="block">{title}</span><span className="block text-xs font-medium muted">{text}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {isFood && (
          <div className="form-grid">
            <Field label="Food"><input className="input" required maxLength={200} placeholder="e.g. Rice and curry" value={form.foodType} onChange={set('foodType')} /></Field>
            <Field label="Storage"><select className="input" value={form.storageCondition} onChange={set('storageCondition')}>{Object.entries(STORAGE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Prepared at"><input className="input" type="datetime-local" required value={form.preparedTime} onChange={set('preparedTime')} /></Field>
          </div>
        )}

        {kind === 'material' && (
          <div className="grid gap-3">
            <span className="text-sm font-semibold">Material {wasteLocked && <span className="hint">(organic posts keep their category)</span>}</span>
            <div className="choice-row">
              {['plastic', 'glass', 'paper', 'metal', 'non_recyclable', ...(isEdit ? ['organic'] : [])].map((c) => (
                <label key={c} className="choice"><input type="radio" name="cat" disabled={wasteLocked} checked={form.wasteCategory === c} onChange={() => setForm((f) => ({ ...f, wasteCategory: c }))} />{WASTE_LABEL[c]}</label>
              ))}
            </div>
            {!isEdit && (
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
                <Field label="Not sure? Describe it" hint="Mixed materials must be posted separately."><input className="input" maxLength={500} placeholder="e.g. empty glass jars" value={form.description} onChange={set('description')} /></Field>
                <Button variant="secondary" icon={Sparkles} onClick={classify} disabled={!form.description.trim()}>Suggest category</Button>
              </div>
            )}
            {suggestion && (suggestion.category
              ? <div className="alert alert-success">Suggested: <Badge tone="success">{WASTE_LABEL[suggestion.category]}</Badge> → {suggestion.pathwayTitle}. Check it matches before publishing.</div>
              : <div className="alert alert-warning">{suggestion.reason}</div>)}
          </div>
        )}

        <div className="form-grid">
          <Field label="Quantity" hint={isFood ? 'e.g. 20 kg or 50 meals' : 'Weight only, e.g. 15 kg'}><input className="input" required placeholder={isFood ? '20 kg' : '15 kg'} value={form.quantity} onChange={set('quantity')} /></Field>
          <Field label="Available from"><input className="input" type="datetime-local" value={form.availableTime} onChange={set('availableTime')} /></Field>
          <Field label="Pickup deadline"><input className="input" type="datetime-local" required value={form.pickupDeadline} onChange={set('pickupDeadline')} /></Field>
        </div>
        <div className="form-grid">
          <Field label="District"><select className="input" value={form.district} onChange={set('district')}>{DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select></Field>
          <Field label="City"><input className="input" maxLength={100} value={form.city} onChange={set('city')} /></Field>
          <Field label="Pickup address"><input className="input" maxLength={500} value={form.address} onChange={set('address')} /></Field>
        </div>
        <Field label="Photo URL (optional)" hint="Link to an image hosted elsewhere; uploads are not yet supported."><input className="input" type="url" value={form.photo} onChange={set('photo')} placeholder="https://" /></Field>
        <Field label="Instructions for the volunteer (optional)"><textarea className="input" maxLength={2000} rows={3} value={form.specialInstructions} onChange={set('specialInstructions')} placeholder="Gate, contact on arrival, packaging…" /></Field>
        {isFood && <p className="hint m-0">The receiving organisation makes the final food-safety decision on arrival.</p>}
      </form>
    </Modal>
  );
}
