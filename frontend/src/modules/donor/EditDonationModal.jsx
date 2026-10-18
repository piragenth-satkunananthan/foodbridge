import React, { useState } from 'react';
import { X, Edit3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { updateDonation } from '../../api/client';

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function EditDonationModal({ donation, isOpen, onClose, onUpdated }) {
  if (!isOpen || !donation) return null;

  const [foodType, setFoodType] = useState(donation.foodType || '');
  const [quantity, setQuantity] = useState(donation.quantity || '');
  const [storageCondition, setStorageCondition] = useState(donation.storageCondition || 'refrigerated');
  const [pickupDeadline, setPickupDeadline] = useState(
    donation.pickupDeadline ? new Date(donation.pickupDeadline).toISOString().slice(0, 16) : ''
  );
  const [district, setDistrict] = useState(donation.district || 'Colombo');
  const [specialInstructions, setSpecialInstructions] = useState(donation.specialInstructions || '');
  const [photo, setPhoto] = useState(donation.photo || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateDonation(donation._id, {
        foodType,
        quantity,
        storageCondition,
        pickupDeadline: new Date(pickupDeadline).toISOString(),
        district,
        specialInstructions,
        photo
      });

      setLoading(false);
      onUpdated();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to update donation');
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="card" style={{
        maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          <div>
            <span className="badge donor" style={{ marginBottom: '4px' }}>Edit Surplus Post</span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
              Modify Posting Details
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px',
              padding: '12px 16px', color: '#991b1b', marginBottom: '20px',
              display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px'
            }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Food Description *
            </label>
            <input 
              type="text" 
              className="form-control"
              value={foodType}
              onChange={(e) => setFoodType(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Quantity *
              </label>
              <input 
                type="text" 
                className="form-control"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Storage Condition *
              </label>
              <select 
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                <option value="refrigerated">❄️ Refrigerated</option>
                <option value="room_temperature">🌡️ Room Temperature</option>
                <option value="frozen">🧊 Frozen</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                District *
              </label>
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                Pickup Deadline *
              </label>
              <input 
                type="datetime-local" 
                className="form-control"
                value={pickupDeadline}
                onChange={(e) => setPickupDeadline(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              Special Access Instructions
            </label>
            <textarea 
              rows="3"
              className="form-control"
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <div style={{
            padding: '16px 0 0', borderTop: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px'
          }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
