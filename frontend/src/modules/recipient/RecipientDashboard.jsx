import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  HeartHandshake, MapPin, Clock, Search, ShieldCheck, 
  Filter, AlertTriangle, CheckCircle2, ChevronRight, 
  RotateCw, Truck, ArrowRight, Package, Phone, Calendar, 
  Utensils, Info, Check, XCircle
} from 'lucide-react';
import { 
  fetchNearbyDonations, 
  fetchRecipientStats, 
  fetchRecipientClaims, 
  claimDonation, 
  cancelDonationClaim 
} from '../../api/client';
import ClaimDonationModal from './ClaimDonationModal';
import AnimatedCounter from '../../components/AnimatedCounter';

const DISTRICTS_LIST = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function RecipientDashboard() {
  const { user } = useAuth();
  
  // Tab state: 'available' | 'active_claims' | 'history'
  const [activeTab, setActiveTab] = useState('available');

  // Data states
  const [stats, setStats] = useState({
    availableInDistrict: 0,
    totalAvailable: 0,
    activeClaimsCount: 0,
    completedClaimsCount: 0,
    estimatedMealsRescued: 0,
    isVerified: false
  });
  const [donations, setDonations] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || 'Colombo');
  const [searchTerm, setSearchTerm] = useState('');
  const [storageFilter, setStorageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('smart_match');

  // Modals
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  const isVerified = user?.verificationStatus === 'verified' || stats.isVerified;

  useEffect(() => {
    loadData();
  }, [selectedDistrict, storageFilter, sortBy, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      const statsRes = await fetchRecipientStats().catch(() => ({ stats: {} }));
      if (statsRes?.stats) {
        setStats(statsRes.stats);
      }

      // 2. Fetch Tab Specific Data
      if (activeTab === 'available') {
        const donationRes = await fetchNearbyDonations({
          district: selectedDistrict,
          storageCondition: storageFilter !== 'all' ? storageFilter : undefined,
          sortBy,
          search: searchTerm || undefined
        }).catch(() => ({ donations: [] }));
        setDonations(donationRes?.donations || []);
      } else {
        const claimsRes = await fetchRecipientClaims({
          status: activeTab === 'active_claims' ? 'active' : 'completed'
        }).catch(() => ({ claims: [] }));
        setClaims(claimsRes?.claims || []);
      }
    } catch (err) {
      console.error('Failed to load recipient portal data:', err);
      setError(err.message || 'Error fetching recipient records');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenClaimModal = (donation) => {
    setSelectedDonation(donation);
    setIsClaimModalOpen(true);
  };

  const handleClaimDonation = async (donationId, notes) => {
    const res = await claimDonation(donationId, notes);
    setActionSuccess('Donation successfully claimed! Courier logistics has been notified.');
    setTimeout(() => setActionSuccess(null), 5000);
    // Reload data and navigate to active claims
    setActiveTab('active_claims');
    loadData();
  };

  const handleCancelClaim = async (donationId) => {
    if (!window.confirm('Are you sure you want to release this claim? It will be returned to the open surplus pool.')) {
      return;
    }
    try {
      await cancelDonationClaim(donationId, 'Recipient cancelled claim');
      setActionSuccess('Claim released. The surplus item was returned to the matching pool.');
      setTimeout(() => setActionSuccess(null), 5000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel claim');
    }
  };

  const getUrgencyBadge = (hoursRemaining) => {
    if (hoursRemaining === null || hoursRemaining === undefined) return null;
    if (hoursRemaining <= 2) {
      return (
        <span 
          style={{
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Clock size={12} /> {hoursRemaining}h left (Critical)
        </span>
      );
    }
    if (hoursRemaining <= 6) {
      return (
        <span 
          style={{
            background: '#fef3c7',
            color: '#b45309',
            border: '1px solid #fde68a',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Clock size={12} /> {hoursRemaining}h left
        </span>
      );
    }
    return (
      <span 
        style={{
          background: '#f1f5f9',
          color: '#475569',
          padding: '3px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <Clock size={12} /> {hoursRemaining}h window
      </span>
    );
  };

  return (
    <div className="main-content" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header Banner */}
      <div 
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge recipient" style={{ padding: '4px 10px', fontSize: '12px' }}>
              Charity & Shelter Allocation Portal
            </span>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Module 2: Proximity Smart Matching
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
            Recipient Operations — {user?.name || 'NGO / Charity'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Real-time proximity feed and smart algorithmic matching to claim and redirect edible food before spoilage.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isVerified ? (
            <span 
              className="badge verified" 
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0'
              }}
            >
              <ShieldCheck size={18} /> Verified Charity Partner
            </span>
          ) : (
            <span 
              className="badge pending" 
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fffbeb',
                color: '#d97706',
                border: '1px solid #fde68a'
              }}
            >
              <Clock size={18} /> Verification Pending Admin Review
            </span>
          )}
        </div>
      </div>

      {/* Verification Warning Alert */}
      {!isVerified && (
        <div 
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <AlertTriangle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14.5px', fontWeight: '700', color: '#92400e' }}>
              Notice: Account Verification Pending
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#b45309', lineHeight: 1.5 }}>
              Your organization profile is currently being reviewed by platform administrators. You can browse live surplus donations in read-only mode. Once your official charity license is approved, one-click rescue claims will be instantly unlocked.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {actionSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#065f46',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          <CheckCircle2 size={20} color="#059669" />
          <span>{actionSuccess}</span>
        </motion.div>
      )}

      {/* KPI Stats Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="card" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Surplus in District</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Utensils size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            <AnimatedCounter value={stats.availableInDistrict} />
          </div>
          <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
            {selectedDistrict} Logistics Hub
          </span>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Active Claims</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={18} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            <AnimatedCounter value={stats.activeClaimsCount} />
          </div>
          <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
            Courier Dispatched / In Transit
          </span>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Meals Rescued</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartHandshake size={18} color="#a855f7" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            <AnimatedCounter value={stats.estimatedMealsRescued} />
          </div>
          <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: '600' }}>
            Beneficiary Portions Delivered
          </span>
        </div>

        <div className="card" style={{ padding: '20px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Primary District</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            {user?.district || 'Colombo'}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Autonomous Geo-Match Radius
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div 
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px'
        }}
      >
        <button
          onClick={() => setActiveTab('available')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'available' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'available' ? '#059669' : '#64748b',
            fontWeight: activeTab === 'available' ? '700' : '600',
            fontSize: '14.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Utensils size={18} />
          Smart Matching Feed
          <span 
            style={{
              background: activeTab === 'available' ? '#ecfdf5' : '#f1f5f9',
              color: activeTab === 'available' ? '#059669' : '#64748b',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}
          >
            {donations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active_claims')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'active_claims' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'active_claims' ? '#059669' : '#64748b',
            fontWeight: activeTab === 'active_claims' ? '700' : '600',
            fontSize: '14.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Truck size={18} />
          Active Rescue Logistics
          {stats.activeClaimsCount > 0 && (
            <span 
              style={{
                background: '#2563eb',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px'
              }}
            >
              {stats.activeClaimsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 20px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'history' ? '3px solid #059669' : '3px solid transparent',
            color: activeTab === 'history' ? '#059669' : '#64748b',
            fontWeight: activeTab === 'history' ? '700' : '600',
            fontSize: '14.5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={18} />
          Completed Rescues
        </button>
      </div>

      {/* Tab Content: Available Donations */}
      {activeTab === 'available' && (
        <>
          {/* Controls & Filter Bar */}
          <div 
            className="card"
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              marginBottom: '24px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '14px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Search */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', flex: '1 1 260px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Search food type or donor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: '36px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    border: '1px solid #cbd5e1',
                    width: '100%'
                  }}
                />
              </div>
            </form>

            {/* Dropdown Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {/* District Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={15} color="#059669" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#ffffff',
                    color: '#334155'
                  }}
                >
                  {DISTRICTS_LIST.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} {dist === user?.district ? '(My District)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Storage Condition */}
              <select
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#334155'
                }}
              >
                <option value="all">All Storage Types</option>
                <option value="room_temperature">Room Temp</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="frozen">Frozen</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: '600'
                }}
              >
                <option value="smart_match">★ Smart Match Score</option>
                <option value="urgency">⏳ Expiring Soonest</option>
                <option value="distance">📍 Nearest Proximity</option>
                <option value="newest">Newest Listed</option>
              </select>

              <button
                onClick={loadData}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Refresh list"
              >
                <RotateCw size={15} />
              </button>
            </div>
          </div>

          {/* List or Empty State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RotateCw size={32} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Computing district distance and smart matching scores...</p>
            </div>
          ) : donations.length === 0 ? (
            <div 
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px dashed #cbd5e1'
              }}
            >
              <HeartHandshake size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                No active surplus found in {selectedDistrict}
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                All nearby donations have either been claimed or safely allocated. Check other neighbouring districts or check back shortly.
              </p>
              <button
                onClick={() => setSelectedDistrict('Colombo')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                Switch to Colombo Hub
              </button>
            </div>
          ) : (
            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '20px'
              }}
            >
              {donations.map((donation) => {
                const matchScore = donation.matchScore || 0;
                return (
                  <motion.div
                    key={donation._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{
                      borderRadius: '16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                    }}
                  >
                    {/* Card Header with Badges */}
                    <div 
                      style={{
                        padding: '16px 20px 12px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        background: '#fcfcfd'
                      }}
                    >
                      <div>
                        {/* Match Score Badge */}
                        <span 
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: matchScore >= 80 ? '#ecfdf5' : '#eff6ff',
                            color: matchScore >= 80 ? '#059669' : '#2563eb',
                            border: `1px solid ${matchScore >= 80 ? '#a7f3d0' : '#bfdbfe'}`,
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            marginBottom: '6px'
                          }}
                        >
                          ★ {matchScore}% Smart Match
                        </span>
                        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                          {donation.foodType}
                        </h3>
                      </div>
                      <span 
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '13px',
                          color: '#0f172a'
                        }}
                      >
                        {donation.quantity}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px 20px', flex: 1 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <MapPin size={15} color="#059669" />
                          <span>
                            {donation.district} ({donation.distanceKm ? `${donation.distanceKm} km` : 'Local'})
                          </span>
                        </div>
                        <div>
                          {getUrgencyBadge(donation.hoursRemaining)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <Package size={15} color="#6366f1" />
                          <span style={{ textTransform: 'capitalize' }}>
                            {(donation.storageCondition || 'room_temperature').replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                          <Phone size={15} color="#0284c7" />
                          <span>{donation.donor?.contactNumber || 'Contact on Claim'}</span>
                        </div>
                      </div>

                      {/* Donor Info & Special Instructions */}
                      <div 
                        style={{
                          background: '#f8fafc',
                          borderRadius: '8px',
                          padding: '10px 12px',
                          fontSize: '12.5px',
                          color: '#475569',
                          marginBottom: '14px'
                        }}
                      >
                        <div>
                          <strong>Donor:</strong> {donation.donor?.name || 'Verified Commercial Donor'}
                        </div>
                        {donation.specialInstructions && (
                          <div style={{ marginTop: '4px', color: '#64748b' }}>
                            <strong>Instructions:</strong> {donation.specialInstructions}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div 
                      style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #f1f5f9',
                        background: '#fcfcfd',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {donation.estimatedPortions ? `~${donation.estimatedPortions} Portions` : 'Food Surplus'}
                      </span>
                      <button
                        onClick={() => handleOpenClaimModal(donation)}
                        disabled={!isVerified}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isVerified ? '#059669' : '#94a3b8',
                          color: '#ffffff',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: isVerified ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <HeartHandshake size={15} /> Claim for Rescue
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab Content: Active Claims Pipeline */}
      {activeTab === 'active_claims' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RotateCw size={32} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
              <p>Fetching active rescue missions...</p>
            </div>
          ) : claims.length === 0 ? (
            <div 
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px dashed #cbd5e1'
              }}
            >
              <Truck size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                No active claims in progress
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px auto' }}>
                Browse the Smart Matching Feed to claim surplus food for your shelter or community.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#059669',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Browse Available Surplus
              </button>
            </div>
          ) : (
            claims.map((claim) => {
              const donation = claim.donation || {};
              const volunteer = claim.volunteer;
              const pipelineStage = claim.statusPipeline;

              return (
                <div 
                  key={claim._id}
                  className="card"
                  style={{
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <span 
                        style={{
                          background: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}
                      >
                        Pipeline: {pipelineStage.replace(/_/g, ' ')}
                      </span>
                      <h3 style={{ margin: '6px 0 0 0', fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
                        {donation.foodType || 'Food Surplus Claim'}
                      </h3>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Donor: {donation.donor?.name || 'Commercial Partner'} • District: {donation.district || 'Colombo'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span 
                        style={{
                          background: '#f1f5f9',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '14px',
                          color: '#0f172a'
                        }}
                      >
                        {donation.quantity || 'Portion Reserved'}
                      </span>
                      {pipelineStage === 'matched' && (
                        <button
                          onClick={() => handleCancelClaim(donation._id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #fecaca',
                            background: '#fff1f2',
                            color: '#b91c1c',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Release Claim
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5-Step Pipeline Progress Indicator */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '8px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      padding: '14px',
                      marginBottom: '16px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    {[
                      { key: 'matched', label: '1. Matched' },
                      { key: 'pickup_scheduled', label: '2. Courier Assigned' },
                      { key: 'picked_up', label: '3. In Transit' },
                      { key: 'delivered_or_recycled', label: '4. Delivered' },
                      { key: 'completed', label: '5. Completed' }
                    ].map((step, idx) => {
                      const stages = ['matched', 'pickup_scheduled', 'picked_up', 'delivered_or_recycled', 'completed'];
                      const currentIdx = stages.indexOf(pipelineStage);
                      const isComplete = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div key={step.key} style={{ textAlign: 'center' }}>
                          <div 
                            style={{
                              height: '6px',
                              borderRadius: '3px',
                              background: isComplete ? '#059669' : '#e2e8f0',
                              marginBottom: '8px'
                            }}
                          />
                          <span 
                            style={{
                              fontSize: '11px',
                              fontWeight: isCurrent ? '800' : '600',
                              color: isComplete ? '#059669' : '#94a3b8'
                            }}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Volunteer Dispatch Status */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#475569' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={16} color={volunteer ? '#059669' : '#94a3b8'} />
                      <span>
                        {volunteer ? (
                          <>Volunteer Courier: <strong>{volunteer.name}</strong> ({volunteer.contactNumber})</>
                        ) : (
                          <span style={{ color: '#d97706' }}>Awaiting community volunteer assignment</span>
                        )}
                      </span>
                    </div>

                    {donation.pickupDeadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} color="#64748b" />
                        <span>Deadline: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Content: Completed Rescues History */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RotateCw size={32} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
              <p>Loading rescue archive...</p>
            </div>
          ) : claims.length === 0 ? (
            <div 
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1px dashed #cbd5e1'
              }}
            >
              <CheckCircle2 size={48} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                No completed rescue missions yet
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                When active rescue missions are delivered, they will be archived here for your impact report.
              </p>
            </div>
          ) : (
            claims.map((claim) => (
              <div 
                key={claim._id}
                className="card"
                style={{
                  borderRadius: '12px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                      {claim.donation?.foodType || 'Completed Food Rescue'}
                    </h4>
                    <span className="badge verified" style={{ padding: '2px 8px', fontSize: '11px' }}>
                      Delivered
                    </span>
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Donor: {claim.donation?.donor?.name || 'Commercial Donor'} • District: {claim.donation?.district}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                    {claim.donation?.quantity}
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(claim.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Claim Modal */}
      <ClaimDonationModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        donation={selectedDonation}
        onClaim={handleClaimDonation}
        isVerified={isVerified}
      />
    </div>
  );
}
