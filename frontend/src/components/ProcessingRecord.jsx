import React from 'react';
import { Printer } from 'lucide-react';
import { fetchWasteCertificate } from '../api/client';
import useAsync from '../lib/useAsync';
import { WASTE_LABEL, fmtDate } from '../lib/format';
import { Button, ErrorState, Loading, Modal } from './ui';

const OUTCOME = { recycled: 'Recycled', composted: 'Composted', disposed: 'Disposed (not recycled)' };

/** Organisation-reported processing outcome for a completed waste request. */
export default function ProcessingRecord({ wasteId, onClose }) {
  const { data, error, loading } = useAsync(() => fetchWasteCertificate(wasteId), [wasteId]);
  const c = data?.certificate;
  return (
    <Modal open onClose={onClose} title="Processing record" footer={c && <Button icon={Printer} onClick={() => window.print()}>Print</Button>}>
      {error && <ErrorState message={error} />}
      {loading && !data && <Loading rows={5} />}
      {c && (
        <div className="grid gap-4">
          <div className="flex justify-between gap-4 flex-wrap">
            <div><div className="eyebrow">Record</div><div className="text-lg font-bold num">{c.certificateId}</div></div>
            <div className="text-right"><div className="eyebrow">Confirmed</div><div className="font-semibold">{fmtDate(c.issuedAt)}</div></div>
          </div>
          <hr className="divider m-0" />
          <dl className="dl">
            <dt>Outcome</dt><dd>{OUTCOME[c.processingOutcome] || c.processingOutcome}</dd>
            <dt>Material</dt><dd>{WASTE_LABEL[c.wasteCategory]}</dd>
            <dt>Declared quantity</dt><dd>{c.quantity}</dd>
            <dt>Donor</dt><dd>{c.donorName || '—'} · {c.donorDistrict}</dd>
            <dt>Facility</dt><dd>{c.facilityName || '—'}{c.facilityDistrict ? ` · ${c.facilityDistrict}` : ''}</dd>
            <dt>Facility registration</dt><dd>{c.facilityLicense || '—'}</dd>
            <dt>Processing notes</dt><dd>{c.processingNotes || '—'}</dd>
          </dl>
          <p className="hint m-0">This is an outcome reported by the receiving facility on FoodBridge. It is not a regulatory or environmental certification.</p>
        </div>
      )}
    </Modal>
  );
}
