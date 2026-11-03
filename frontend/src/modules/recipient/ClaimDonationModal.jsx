import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, AlertTriangle, Clock, MapPin, 
  Package, ShieldCheck, HeartHandshake, Phone, Info 
} from 'lucide-react';

export default function ClaimDonationModal({ 
  isOpen, 
  onClose, 
  donation, 
  onClaim, 
  isVerified = true 
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !donation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) return;
    
    setLoading(true);
    setError(null);
    try {
      await onClaim(donation._id, notes);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to claim donation');
    } finally {
      setLoading(false);
    }
  };

  const hoursRemaining = donation.hoursRemaining !== undefined 
    ? donation.hoursRemaining 
    : Math.max(0, Math.round(((new Date(donation.pickupDeadline).getTime() - Date.now()) / (1000 * 60 * 60)) * 10) / 10);

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '560px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0'
          }}
        >
          {/* Header */}
          <div 
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Claim Food Surplus
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Proximity Rescue Allocation Engine
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px',
                borderRadius: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Verification Block Warning */}
            {!isVerified && (
              <div 
                style={{
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '12px'
                }}
              >
                <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: '#92400e' }}>
                  <strong style={{ display: 'block', marginBottom: '2px' }}>Admin Verification Required</strong>
                  Your organization account is currently pending administrative review. You can explore available surplus, but claiming is locked until approval.
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div 
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  color: '#b91c1c'
                }}
              >
                {error}
              </div>
            )}

            {/* Surplus Summary Card */}
            <div 
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span 
                    style={{
                      display: 'inline-block',
                      background: '#10b981',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {donation.matchScore ? `${donation.matchScore}% Smart Match` : 'Available'}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                    {donation.foodType}
                  </h4>
                </div>
                <span 
                  style={{
                    background: '#f1f5f9',
                    color: '#334155',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px'
                  }}
                >
                  {donation.quantity}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <MapPin size={15} color="#059669" />
                  <span>{donation.district} ({donation.distanceKm ? `${donation.distanceKm} km away` : 'Local'})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <Clock size={15} color={hoursRemaining <= 2 ? '#dc2626' : '#d97706'} />
                  <span style={{ fontWeight: hoursRemaining <= 2 ? '700' : '500', color: hoursRemaining <= 2 ? '#dc2626' : '#475569' }}>
                    {hoursRemaining}h remaining
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <Package size={15} color="#6366f1" />
                  <span style={{ textTransform: 'capitalize' }}>
                    {(donation.storageCondition || 'room_temperature').replace('_', ' ')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <Phone size={15} color="#0284c7" />
                  <span>{donation.donor?.contactNumber || 'Donor Contact Attached'}</span>
                </div>
              </div>

              {donation.specialInstructions && (
                <div 
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed #cbd5e1',
                    fontSize: '12.5px',
                    color: '#64748b'
                  }}
                >
                  <strong>Pickup Instructions:</strong> {donation.specialInstructions}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label 
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#334155',
                    marginBottom: '6px'
                  }}
                >
                  Logistics & Distribution Notes (Optional)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Feeding 65 shelter residents this evening. Volunteer courier required."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div 
                style={{
                  background: '#f0fdf4',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '20px',
                  display: 'flex',
                  gap: '10px',
                  fontSize: '12.5px',
                  color: '#166534'
                }}
              >
                <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>
                  Once confirmed, this donation is reserved for your shelter. A courier delivery job will be broadcast to the volunteer fleet.
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isVerified}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isVerified ? '#059669' : '#94a3b8',
                    color: '#ffffff',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: isVerified ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isVerified ? '0 4px 6px -1px rgba(5, 150, 105, 0.2)' : 'none'
                  }}
                >
                  {loading ? 'Claiming...' : (
                    <>
                      <CheckCircle2 size={16} /> Confirm Allocation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
