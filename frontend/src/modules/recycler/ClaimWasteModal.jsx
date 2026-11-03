import React, { useState } from 'react';
import {
  X, Recycle, AlertCircle, CheckCircle2, ShieldCheck,
  MapPin, Clock, Package, Leaf, ArrowRight
} from 'lucide-react';
import { claimWasteRequest } from '../../api/client';

export default function ClaimWasteModal({ isOpen, onClose, wasteRequest, onClaimSuccess }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !wasteRequest) return null;

  const handleClaim = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await claimWasteRequest(wasteRequest._id, notes);
      setLoading(false);
      onClaimSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to claim waste request');
    }
  };

  const categoryLabels = {
    plastic: '🧴 Plastics & Polymers',
    glass: '🍾 Glass Bottles & Cullet',
    paper: '📦 Paperboard & Cardboard',
    metal: '🥫 Scrap Metals',
    organic: '🥬 Organic Food Scraps',
    non_recyclable: '🗑 Non-Recyclable Residuals'
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '16px',
          padding: 0,
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #f1f5f9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#0284c7',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Recycle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                Accept Waste Collection Batch
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                Module 3 Circular Sourcing & Material Intake
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleClaim} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '12px 16px',
                color: '#991b1b',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13.5px'
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Batch Summary Card */}
          <div
            style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <span className="badge blue" style={{ fontSize: '12px', fontWeight: '600' }}>
                  {categoryLabels[wasteRequest.wasteCategory] || wasteRequest.wasteCategory}
                </span>
                <h4 style={{ margin: '8px 0 0 0', fontSize: '18px', fontWeight: '700', color: '#0369a1' }}>
                  {wasteRequest.quantity}
                </h4>
              </div>
              {wasteRequest.impact && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#0284c7', display: 'block', fontWeight: '600' }}>
                    EST. CO₂e SAVINGS
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#059669' }}>
                    ~{wasteRequest.impact.co2eSavedKg} kg CO₂e
                  </span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12.5px', color: '#334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#0284c7" />
                <span>
                  <strong>District:</strong> {wasteRequest.district} {wasteRequest.distanceKm ? `(~${wasteRequest.distanceKm} km)` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={15} color="#d97706" />
                <span>
                  <strong>Pickup Deadline:</strong> {new Date(wasteRequest.pickupDeadline).toLocaleDateString()}
                </span>
              </div>
            </div>

            {wasteRequest.donor && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0f2fe', fontSize: '12px', color: '#0369a1' }}>
                <strong>Donor Premise:</strong> {wasteRequest.donor.name || 'Verified Donor'}
              </div>
            )}
          </div>

          {/* Circular Pathway Notice */}
          {wasteRequest.pathwayTitle && (
            <div style={{ marginBottom: '18px', background: '#ecfdf5', padding: '12px 14px', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                <Leaf size={16} />
                <span>Target Circular Pathway:</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>
                {wasteRequest.pathwayTitle}
              </p>
            </div>
          )}

          {/* Pre-Treatment & Handling Guidelines */}
          {Array.isArray(wasteRequest.handlingGuidelines) && wasteRequest.handlingGuidelines.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                Pre-Treatment & Facility Guidelines:
              </label>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                {wasteRequest.handlingGuidelines.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Operational Notes / Logistics Instructions */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Intake Notes & Courier Instructions (Optional):
            </label>
            <textarea
              rows="3"
              className="form-control"
              placeholder="e.g. Schedule warehouse bay #3 intake; courier should verify baled bags before sign-off."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '10px 18px', fontSize: '13.5px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                padding: '10px 20px',
                fontSize: '13.5px',
                background: '#0284c7',
                borderColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <span>Confirming Claim...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Claim Waste Batch</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
