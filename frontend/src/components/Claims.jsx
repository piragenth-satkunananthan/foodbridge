import React, { useState } from 'react';
import { CheckCircle2, Clock, FileCheck2, MapPin, Phone, Recycle, Undo2, User, Utensils } from 'lucide-react';
import { cancelDonationClaim, cancelWasteClaim, confirmPickupReceipt } from '../api/client';
import { STORAGE_LABEL, WASTE_LABEL, fmtDate, timeLeft } from '../lib/format';
import { useToast } from './Toast';
import ProcessingRecord from './ProcessingRecord';
import { Button, Empty, ErrorState, Field, Modal, Pipeline, StatusBadge } from './ui';

const OUTCOME_FOR = (category) => (category === 'organic' ? 'composted' : category === 'non_recyclable' ? 'disposed' : 'recycled');

function ConfirmModal({ pickup, onClose, onDone }) {
  const { addToast } = useToast();
  const waste = pickup.wasteRequest && !pickup.donation;
  const outcome = waste ? OUTCOME_FOR(pickup.wasteRequest.wasteCategory) : null;
  const [accepted, setAccepted] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await confirmPickupReceipt(pickup._id, accepted
        ? { accepted, ...(note ? { note } : {}), ...(waste ? { processingOutcome: outcome, processingNotes: note } : {}) }
        : { accepted, note });
      addToast(accepted ? 'Confirmed — thank you' : 'Delivery rejected and recorded');
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };
  return (
    <Modal open onClose={onClose} title={waste ? 'Confirm processing' : 'Confirm receipt'}
      footer={<><Button variant="secondary" onClick={onClose}>Back</Button><Button type="submit" form="confirm-form" variant={accepted ? 'primary' : 'danger'} loading={busy}>{accepted ? 'Confirm' : 'Reject delivery'}</Button></>}>
      <form id="confirm-form" onSubmit={submit} className="grid gap-4">
        {error && <ErrorState message={error} />}
        <div className="choice-row">
          <label className="choice"><input type="radio" checked={accepted} onChange={() => setAccepted(true)} />{waste ? `Material ${outcome}` : 'Food accepted'}</label>
          <label className="choice"><input type="radio" checked={!accepted} onChange={() => setAccepted(false)} />Reject</label>
        </div>
        {waste && accepted && <p className="text-sm muted m-0">Confirm only after the material has actually been {outcome}. This outcome is recorded against your organisation.</p>}
        {!waste && accepted && <p className="text-sm muted m-0">Accepting confirms the food was received and fit for your beneficiaries. It then counts toward rescued meals.</p>}
        <Field label={!accepted ? 'Reason (required)' : waste ? 'Processing notes (required)' : 'Note (optional)'}>
          <textarea className="input" rows={3} maxLength={2000} required={!accepted || waste} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}

export function ClaimItem({ pickup, onChanged }) {
  const { addToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [record, setRecord] = useState(false);
  const source = pickup.donation || pickup.wasteRequest || {};
  const food = Boolean(pickup.donation);
  const stage = pickup.statusPipeline;
  const release = async () => {
    if (!window.confirm('Release this claim? The post returns to the open list and your reserved capacity is freed.')) return;
    try {
      await (food ? cancelDonationClaim(source._id, 'Released by organisation') : cancelWasteClaim(source._id));
      addToast('Claim released');
      onChanged();
    } catch (err) { addToast(err.message, 'error'); }
  };
  return (
    <div className="row-item">
      <span className={`icon-tile ${food ? '' : 'waste'}`}>{food ? <Utensils size={18} aria-hidden="true" /> : <Recycle size={18} aria-hidden="true" />}</span>
      <div className="flex-1 min-w-0 grid gap-2">
        <div className="flex flex-wrap items-center gap-2"><strong>{(food ? source.foodType : WASTE_LABEL[source.wasteCategory]) || <span className="muted">Item details not recorded</span>}</strong><StatusBadge status={stage} /></div>
        <div className="meta">
          <span>{source.quantity}</span>
          {source.district && <span><MapPin size={13} aria-hidden="true" />{[source.city, source.district].filter(Boolean).join(', ')}</span>}
          {food && source.storageCondition && <span>{STORAGE_LABEL[source.storageCondition]}</span>}
          {pickup.active && ['matched', 'pickup_scheduled'].includes(stage) && <span><Clock size={13} aria-hidden="true" />{timeLeft(source.pickupDeadline)}</span>}
          {!pickup.active && <span>Updated {fmtDate(pickup.updatedAt)}</span>}
        </div>
        {pickup.active && <Pipeline status={stage} />}
        {pickup.volunteer && pickup.active && (
          <div className="meta"><span><User size={13} aria-hidden="true" />{pickup.volunteer.name}</span>{pickup.volunteer.contactNumber && <a href={`tel:${pickup.volunteer.contactNumber}`} className="text-[var(--primary)] inline-flex items-center gap-1"><Phone size={13} aria-hidden="true" />{pickup.volunteer.contactNumber}</a>}</div>
        )}
        {pickup.active && stage === 'matched' && <p className="hint m-0">Waiting for a volunteer to accept the pickup.</p>}
      </div>
      <div className="flex flex-col gap-2 items-end">
        {pickup.active && stage === 'delivered_or_recycled' && <Button size="sm" icon={CheckCircle2} onClick={() => setConfirming(true)}>{food ? 'Confirm receipt' : 'Confirm processing'}</Button>}
        {pickup.active && ['matched', 'pickup_scheduled'].includes(stage) && <Button size="sm" variant="ghost" icon={Undo2} onClick={release}>Release</Button>}
        {!food && stage === 'completed' && <Button size="sm" variant="secondary" icon={FileCheck2} onClick={() => setRecord(true)}>Record</Button>}
      </div>
      {confirming && <ConfirmModal pickup={pickup} onClose={() => setConfirming(false)} onDone={() => { setConfirming(false); onChanged(); }} />}
      {record && <ProcessingRecord wasteId={source._id} onClose={() => setRecord(false)} />}
    </div>
  );
}

export function ClaimList({ claims, onChanged, emptyTitle, emptyText }) {
  if (!claims.length) return <Empty title={emptyTitle}>{emptyText}</Empty>;
  return <div className="list">{claims.map((p) => <ClaimItem key={p._id} pickup={p} onChanged={onChanged} />)}</div>;
}
