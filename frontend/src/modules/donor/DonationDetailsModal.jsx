import React, { useState, useEffect } from 'react';
import { 
  X, Utensils, Calendar, Clock, MapPin, Building, Truck, 
  CheckCircle, AlertTriangle, XCircle, Info, Edit3, Trash2 
} from 'lucide-react';
import { fetchDonationById, cancelDonation } from '../../api/client';

const PIPELINE_STAGES = [
  { key: 'posted', label: 'Surplus Posted', desc: 'Awaiting recipient match' },
  { key: 'matched', label: 'Matched to NGO', desc: 'Recipient approved request' },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', desc: 'Volunteer assigned & dispatched' },
  { key: 'picked_up', label: 'In Transit', desc: 'Collected from your facility' },
  { key: 'delivered', label: 'Delivered / Completed', desc: 'Received & verified by NGO' }
];

export default function DonationDetailsModal({ donationId, isOpen, onClose, onUpdated, onEdit }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isOpen && donationId) {
      loadDetails();
    }
  }, [isOpen, donationId]);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDonationById(donationId);
      setData(res);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load donation details');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this surplus posting?')) return;
    setCancelling(true);
    try {
      await cancelDonation(donationId);
      setCancelling(false);
      onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to cancel donation');
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  const donation = data?.donation;
  const pickup = data?.pickup;

  const getStageIndex = (status) => {
    switch (status) {
      case 'posted': return 0;
      case 'matched': return 1;
      case 'pickup_scheduled': return 2;
      case 'picked_up': return 3;
      case 'delivered':
      case 'completed': return 4;
      default: return -1;
    }
  };

  const currentStageIdx = donation ? getStageIndex(donation.status) : -1;
  const isCancelled = donation?.status === 'cancelled';

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge donor">Donation Tracker</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>ID: {donationId?.slice(-6)}</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {donation?.foodType || 'Donation Details'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Loading donation tracking data...
          </div>
        ) : error ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        ) : (
          <div style={{ padding: '24px' }}>
            {/* Status Timeline */}
            <div style={{
              background: '#f8fafc', padding: '20px', borderRadius: '12px',
              border: '1px solid #e2e8f0', marginBottom: '24px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '16px' }}>
                LIVE SURPLUS LIFECYCLE
              </div>

              {isCancelled ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  background: '#fee2e2', padding: '12px 16px', borderRadius: '8px', color: '#991b1b'
                }}>
                  <XCircle size={20} />
                  <div>
                    <strong>Posting Cancelled</strong>
                    <div style={{ fontSize: '12px' }}>This surplus post was cancelled by the donor.</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {PIPELINE_STAGES.map((stg, idx) => {
                    const isDone = currentStageIdx >= idx;
                    const isCurrent = currentStageIdx === idx;
                    return (
                      <div key={stg.key} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isCurrent ? '#059669' : isDone ? '#d1fae5' : '#e2e8f0',
                          color: isCurrent ? '#ffffff' : isDone ? '#059669' : '#94a3b8',
                          fontWeight: '700', fontSize: '13px'
                        }}>
                          {isDone ? <CheckCircle size={16} /> : idx + 1}
                        </div>
                        <div style={{
                          fontSize: '11px', fontWeight: isCurrent ? '700' : '600',
                          color: isCurrent ? '#059669' : isDone ? '#0f172a' : '#94a3b8'
                        }}>
                          {stg.label}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#94a3b8', marginTop: '2px' }}>
                          {stg.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Main Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>
                  Food & Safety Specs
                </h4>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Quantity: </span>
                    <strong style={{ color: '#0f172a' }}>{donation?.quantity}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Storage Condition: </span>
                    <span className="badge" style={{ textTransform: 'capitalize' }}>
                      {donation?.storageCondition?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Prepared: </span>
                    <span>{new Date(donation?.preparedTime).toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Pickup Deadline: </span>
                    <strong style={{ color: '#dc2626' }}>
                      {new Date(donation?.pickupDeadline).toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>District: </span>
                    <span>{donation?.district}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#334155', marginBottom: '10px' }}>
                  Logistics & Partners
                </h4>
                <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Matched Recipient: </span>
                    {donation?.matchedRecipient ? (
                      <span className="badge green">
                        {donation.matchedRecipient.name} ({donation.matchedRecipient.type})
                      </span>
                    ) : (
                      <span className="badge amber">Searching for closest NGO...</span>
                    )}
                  </div>

                  {pickup ? (
                    <>
                      <div>
                        <span style={{ color: '#64748b' }}>Volunteer Assigned: </span>
                        <strong>{pickup.volunteer?.name || 'Assigned'}</strong> ({pickup.volunteer?.contactNumber || 'N/A'})
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Pickup Pipeline Stage: </span>
                        <span className="badge blue">{pickup.statusPipeline || 'In Progress'}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                      Volunteer courier dispatch activates once matched.
                    </div>
                  )}

                  {donation?.photo && (
                    <div style={{ marginTop: '8px' }}>
                      <img 
                        src={donation.photo} 
                        alt="Donation preview" 
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {donation?.specialInstructions && (
              <div style={{
                background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px',
                fontSize: '13px', color: '#334155', marginBottom: '20px'
              }}>
                <strong>Pickup Access Notes:</strong> {donation.specialInstructions}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div>
            {donation?.status === 'posted' && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="btn btn-outline"
                style={{
                  color: '#ef4444', borderColor: '#fca5a5',
                  display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <Trash2 size={16} />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Surplus Post'}</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {donation?.status === 'posted' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(donation);
                }}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit3 size={16} />
                <span>Edit Post</span>
              </button>
            )}

            <button type="button" onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
