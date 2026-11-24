import React, { useState } from 'react';
import { Building2, FileCheck2, Phone, User } from 'lucide-react';
import { fetchDonationById, fetchEligibleCollectorsForWaste, fetchRecipientsForDonation, fetchWasteRequestById } from '../../api/client';
import useAsync from '../../lib/useAsync';
import { ORG_TYPE_LABEL, STORAGE_LABEL, WASTE_LABEL, fmtDate, fmtNum, timeLeft } from '../../lib/format';
import ProcessingRecord from '../../components/ProcessingRecord';
import { Badge, Button, ErrorState, Loading, Modal, Pipeline, StatusBadge, Timeline } from '../../components/ui';

function Matches({ id, kind }) {
  const { data, error, loading } = useAsync(() => (kind === 'donation' ? fetchRecipientsForDonation(id) : fetchEligibleCollectorsForWaste(id)), [id]);
  if (error) return <ErrorState message={error} />;
  if (loading && !data) return <Loading rows={2} />;
  const list = kind === 'donation' ? data.organizations : data.eligibleCollectors;
  if (!list.length) return <p className="muted text-sm m-0">No verified organisation can currently take this post (capacity, storage, material or time window). It stays open until the deadline.</p>;
  return (
    <ul className="grid gap-2 p-0 m-0" style={{ listStyle: 'none' }}>
      {list.slice(0, 5).map((o) => (
        <li key={o._id || o.organizationId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2"><Building2 size={15} aria-hidden="true" /><strong>{o.name}</strong><span className="muted">{ORG_TYPE_LABEL[o.type]} · {o.district}</span></span>
          <span className="muted num">~{fmtNum(o.distanceKm, 1)} km <span className="hint">({o.distanceBasis})</span></span>
        </li>
      ))}
    </ul>
  );
}

export default function PostDetails({ id, kind, onClose }) {
  const { data, error, loading } = useAsync(() => (kind === 'donation' ? fetchDonationById(id) : fetchWasteRequestById(id)), [id, kind]);
  const [record, setRecord] = useState(false);
  const post = data?.[kind === 'donation' ? 'donation' : 'wasteRequest'];
  const pickup = data?.pickup;
  const org = post?.matchedRecipient || post?.matchedCollector || pickup?.receivingOrganization;
  return (
    <Modal open onClose={onClose} wide title={post ? (kind === 'donation' ? post.foodType : WASTE_LABEL[post.wasteCategory]) : 'Post details'}>
      {error && <ErrorState message={error} />}
      {loading && !data && <Loading rows={6} />}
      {post && (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            <Badge tone={kind === 'donation' ? 'success' : 'accent'} plain>{kind === 'donation' ? 'Food donation' : 'Waste request'}</Badge>
            {['posted', 'matched', 'pickup_scheduled'].includes(post.status) && <span className="text-sm muted">{timeLeft(post.pickupDeadline)}</span>}
          </div>
          {pickup?.active && <Pipeline status={pickup.statusPipeline} />}
          <div className="grid gap-6 md:grid-cols-2">
            <dl className="dl">
              <dt>Quantity</dt><dd>{post.quantity}</dd>
              {kind === 'donation' && <><dt>Storage</dt><dd>{STORAGE_LABEL[post.storageCondition]}</dd><dt>Prepared</dt><dd>{fmtDate(post.preparedTime)}</dd></>}
              <dt>Available</dt><dd>{fmtDate(post.availableTime)}</dd>
              <dt>Deadline</dt><dd>{fmtDate(post.pickupDeadline)}</dd>
              <dt>Location</dt><dd>{[post.address, post.city, post.district].filter(Boolean).join(', ')}</dd>
              {post.specialInstructions && <><dt>Instructions</dt><dd>{post.specialInstructions}</dd></>}
              {post.processingOutcome && <><dt>Outcome</dt><dd>{post.processingOutcome}</dd></>}
              <dt>Reference</dt><dd className="num text-xs">{post._id}</dd>
            </dl>
            <div className="grid gap-4 content-start">
              {post.photo && <img src={post.photo} alt="Donor-provided photo of the post" className="w-full max-h-48 object-cover rounded-lg border border-[var(--border)]" loading="lazy" referrerPolicy="no-referrer" />}
              {org && <div className="card card-pad"><div className="eyebrow mb-1">Receiving organisation</div><div className="font-semibold">{org.name}</div><div className="text-sm muted">{ORG_TYPE_LABEL[org.type]} · {org.district}</div></div>}
              {pickup?.volunteer && (
                <div className="card card-pad"><div className="eyebrow mb-1">Volunteer</div>
                  <div className="flex items-center gap-2 font-semibold"><User size={15} aria-hidden="true" />{pickup.volunteer.name}</div>
                  {pickup.volunteer.contactNumber && <a className="flex items-center gap-2 text-sm text-[var(--primary)] mt-1" href={`tel:${pickup.volunteer.contactNumber}`}><Phone size={14} aria-hidden="true" />{pickup.volunteer.contactNumber}</a>}
                </div>
              )}
            </div>
          </div>
          {post.status === 'posted' && <section><h3 className="text-sm mb-3">Organisations that can take this now</h3><Matches id={post._id} kind={kind} /></section>}
          {kind === 'wasteRequest' && post.status === 'completed' && <div><Button variant="secondary" icon={FileCheck2} onClick={() => setRecord(true)}>View processing record</Button></div>}
          <section><h3 className="text-sm mb-3">History</h3><Timeline items={post.statusHistory} /></section>
        </div>
      )}
      {record && <ProcessingRecord wasteId={post._id} onClose={() => setRecord(false)} />}
    </Modal>
  );
}
