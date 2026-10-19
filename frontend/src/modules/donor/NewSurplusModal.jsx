import React, { useState } from 'react';
import { 
  X, Utensils, Recycle, Sparkles, AlertCircle, 
  Clock, MapPin, Calendar, Camera, ArrowRight, ArrowLeft, CheckCircle2 
} from 'lucide-react';
import { createDonation, createWasteRequest } from '../../api/client';

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const SAMPLE_PHOTOS = [
  { label: 'Buffet Rice & Curry', url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80' },
  { label: 'Bakery Breads & Pastries', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' },
  { label: 'Cooked Chicken & Stew', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80' },
  { label: 'Organic Kitchen Scraps', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80' },
  { label: 'Plastic Bottles & Crates', url: 'https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?w=600&auto=format&fit=crop&q=80' }
];

export default function NewSurplusModal({ isOpen, onClose, onCreated, userDistrict }) {
  const [step, setStep] = useState(1);
  const [postType, setPostType] = useState('food'); // 'food' | 'waste'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common fields
  const [district, setDistrict] = useState(userDistrict || 'Colombo');
  const [quantityValue, setQuantityValue] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [pickupDeadline, setPickupDeadline] = useState('');
  const [photo, setPhoto] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Food specific fields
  const [foodType, setFoodType] = useState('');
  const [preparedTime, setPreparedTime] = useState(new Date().toISOString().slice(0, 16));
  const [storageCondition, setStorageCondition] = useState('refrigerated');

  // Waste specific fields
  const [wasteCategory, setWasteCategory] = useState('organic');

  if (!isOpen) return null;

  // Smart classifier trigger: automatic pathway recommendation
  const handleItemTypeSelect = (type, categoryOrCondition) => {
    if (type === 'food') {
      setPostType('food');
      setFoodType(categoryOrCondition);
    } else {
      setPostType('waste');
      setWasteCategory(categoryOrCondition);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!postType) {
        setError('Please select a posting category');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (postType === 'food' && (!foodType.trim() || !quantityValue)) {
        setError('Please provide food description and a valid quantity');
        return;
      }
      if (postType === 'waste' && (!wasteCategory || !quantityValue)) {
        setError('Please choose a waste category and enter quantity');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!district) {
        setError('Please select your district');
        return;
      }
      if (!pickupDeadline) {
        setError('Please set a pickup deadline');
        return;
      }
      const deadlineDate = new Date(pickupDeadline);
      if (deadlineDate.getTime() <= Date.now()) {
        setError('Pickup deadline must be in the future');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formattedQuantity = `${quantityValue.trim()} ${quantityUnit}`.trim();

    try {
      if (postType === 'food') {
        const payload = {
          foodType: foodType.trim(),
          quantity: formattedQuantity,
          preparedTime: new Date(preparedTime).toISOString(),
          storageCondition,
          pickupDeadline: new Date(pickupDeadline).toISOString(),
          district,
          specialInstructions: specialInstructions.trim()
        };
        if (photo.trim()) {
          payload.photo = photo.trim();
        }
        await createDonation(payload);
      } else {
        const payload = {
          wasteCategory,
          quantity: formattedQuantity,
          district,
          pickupDeadline: new Date(pickupDeadline).toISOString()
        };
        if (photo.trim()) {
          payload.photo = photo.trim();
        }
        await createWasteRequest(payload);
      }

      setLoading(false);
      onCreated();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to submit surplus posting');
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
        maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to right, #f8fafc, #ffffff)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge donor">Surplus Dispatch Flow</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Step {step} of 4</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {step === 1 && 'Select Surplus Type & Automatic Pathway'}
              {step === 2 && 'Surplus Details & Quantity'}
              {step === 3 && 'Logistics, Timings & Instructions'}
              {step === 4 && 'Review & Publish Posting'}
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={20} color="#64748b" />
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '4px', background: '#e2e8f0' }}>
          <div style={{
            height: '100%',
            width: `${(step / 4) * 100}%`,
            background: postType === 'food' ? '#059669' : '#0284c7',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
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

          {/* STEP 1: PATHWAY & CLASSIFICATION */}
          {step === 1 && (
            <div>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '18px' }}>
                FoodBridge automatically routes your post to the right community partner. 
                Is this item edible food for humans (NGOs & Shelters) or non-edible waste for recycling & composting?
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div 
                  onClick={() => setPostType('food')}
                  style={{
                    border: postType === 'food' ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: postType === 'food' ? '#ecfdf5' : '#ffffff',
                    padding: '20px', borderRadius: '12px', cursor: 'pointer',
                    transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: '#059669', color: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                  }}>
                    <Utensils size={24} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                    Edible Food Donation
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.4' }}>
                    Prepared buffet food, cooked meals, bakery bread, fresh vegetables/produce fit for human consumption.
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge green" style={{ fontSize: '11px' }}>Routes to NGOs / Shelters</span>
                    <span className="badge amber" style={{ fontSize: '11px' }}>Cold Chain Monitored</span>
                  </div>
                </div>

                <div 
                  onClick={() => setPostType('waste')}
                  style={{
                    border: postType === 'waste' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: postType === 'waste' ? '#f0f9ff' : '#ffffff',
                    padding: '20px', borderRadius: '12px', cursor: 'pointer',
                    transition: 'all 0.2s ease', position: 'relative'
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: '#0284c7', color: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
                  }}>
                    <Recycle size={24} />
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                    Recyclable or Organic Waste
                  </h3>
                  <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.4' }}>
                    Plate scraps, spoiled food, used cooking oil, plastic containers, cardboard boxes, cans & bottles.
                  </p>
                  <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge blue" style={{ fontSize: '11px' }}>Routes to Recyclers</span>
                    <span className="badge green" style={{ fontSize: '11px' }}>Composting Plants</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Shortcuts */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#334155', fontWeight: '600', fontSize: '13px' }}>
                  <Sparkles size={16} color="#059669" />
                  <span>Quick Classification Presets:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleItemTypeSelect('food', 'Surplus Cooked Buffet Meals')}
                  >
                    🍛 Cooked Buffet Food
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleItemTypeSelect('food', 'Fresh Bakery Bread & Pastries')}
                  >
                    🥖 Bakery Surplus
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleItemTypeSelect('waste', 'organic')}
                  >
                    🥬 Kitchen Organic Food Scraps
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleItemTypeSelect('waste', 'plastic')}
                  >
                    🧴 Plastic Packaging & Crates
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ fontSize: '12px', padding: '6px 10px' }}
                    onClick={() => handleItemTypeSelect('waste', 'paper')}
                  >
                    📦 Cardboard & Paper Boxes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS & QUANTITY */}
          {step === 2 && (
            <div>
              {postType === 'food' ? (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Food Description / Title *
                    </label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. 50 Portions Chicken Biryani & Dhal Curry" 
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Quantity *
                      </label>
                      <input 
                        type="number" 
                        step="0.5"
                        min="0.5"
                        className="form-control"
                        placeholder="e.g. 25" 
                        value={quantityValue}
                        onChange={(e) => setQuantityValue(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Unit
                      </label>
                      <select 
                        value={quantityUnit}
                        onChange={(e) => setQuantityUnit(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="kg">kg</option>
                        <option value="plates">plates</option>
                        <option value="portions">portions</option>
                        <option value="boxes">boxes</option>
                        <option value="liters">liters</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Prepared / Packaged Time *
                      </label>
                      <input 
                        type="datetime-local" 
                        className="form-control"
                        value={preparedTime}
                        onChange={(e) => setPreparedTime(e.target.value)}
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
                        <option value="refrigerated">❄️ Refrigerated (0-4°C)</option>
                        <option value="room_temperature">🌡️ Room Temperature</option>
                        <option value="frozen">🧊 Frozen (-18°C)</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Waste Material Stream *
                    </label>
                    <select 
                      value={wasteCategory}
                      onChange={(e) => setWasteCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="organic">🥬 Organic Food Scraps (for Composting)</option>
                      <option value="plastic">🧴 Plastic Containers & Wraps</option>
                      <option value="paper">📦 Paper, Cardboard & Cartons</option>
                      <option value="metal">🥫 Metal Cans & Tins</option>
                      <option value="glass">🍾 Glass Bottles & Jars</option>
                      <option value="non_recyclable">🗑️ Non-recyclable General Waste</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Estimated Quantity *
                      </label>
                      <input 
                        type="number" 
                        step="1"
                        min="1"
                        className="form-control"
                        placeholder="e.g. 50" 
                        value={quantityValue}
                        onChange={(e) => setQuantityValue(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                        Unit
                      </label>
                      <select 
                        value={quantityUnit}
                        onChange={(e) => setQuantityUnit(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="kg">kg</option>
                        <option value="bags">bags</option>
                        <option value="bins">bins</option>
                        <option value="crates">crates</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 3: LOGISTICS & INSTRUCTIONS */}
          {step === 3 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    Pickup District (Sri Lanka) *
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
                    Must be Picked Up By (Deadline) *
                  </label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={pickupDeadline}
                    onChange={(e) => setPickupDeadline(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Access Notes / Special Instructions
                </label>
                <textarea 
                  rows="3"
                  className="form-control"
                  placeholder="e.g. Come to back gate loading dock, ask for Executive Chef or Kitchen Supervisor. Bring insulated containers."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                  Photo URL (Optional)
                </label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://..."
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '8px' }}
                />
                
                {/* Photo Presets */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>Select preset sample photo:</span>
                  {SAMPLE_PHOTOS.map((sp) => (
                    <button 
                      key={sp.label} 
                      type="button" 
                      onClick={() => setPhoto(sp.url)}
                      className="badge" 
                      style={{ cursor: 'pointer', background: '#f1f5f9', border: '1px solid #cbd5e1' }}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>

                {photo && (
                  <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', maxHeight: '160px', width: '100%', background: '#f1f5f9' }}>
                    <img src={photo} alt="Preview" style={{ width: '100%', height: '160px', objectFit: 'cover' }} onError={() => setPhoto('')} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & CONFIRM */}
          {step === 4 && (
            <div>
              <div style={{
                background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
                padding: '20px', marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span className={`badge ${postType === 'food' ? 'green' : 'blue'}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
                    {postType === 'food' ? '🥗 Food Rescue Donation' : '♻️ Waste Management Request'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    District: <strong>{district}</strong>
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                  {postType === 'food' ? foodType : `${wasteCategory.toUpperCase()} Waste Collection`}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13.5px', marginTop: '14px' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Quantity: </span>
                    <strong>{quantityValue} {quantityUnit}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Pickup Deadline: </span>
                    <strong>{new Date(pickupDeadline).toLocaleString()}</strong>
                  </div>
                  {postType === 'food' && (
                    <>
                      <div>
                        <span style={{ color: '#64748b' }}>Prepared Time: </span>
                        <strong>{new Date(preparedTime).toLocaleTimeString()}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Storage: </span>
                        <strong>{storageCondition}</strong>
                      </div>
                    </>
                  )}
                </div>

                {specialInstructions && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Instructions: </span>
                    <span>{specialInstructions}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontSize: '13px' }}>
                <CheckCircle2 size={16} />
                <span>Ready to publish. This posting will be matched immediately with local verified partners.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f8fafc'
        }}>
          {step > 1 ? (
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={() => setStep(step - 1)}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleNext}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSubmit}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: postType === 'food' ? '#059669' : '#0284c7'
              }}
            >
              {loading ? (
                <span>Publishing Posting...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm & Publish Surplus</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
