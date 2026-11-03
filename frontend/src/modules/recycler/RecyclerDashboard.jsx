import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Recycle, MapPin, Clock, Search, ShieldCheck,
  Filter, AlertTriangle, CheckCircle2, ChevronRight,
  RotateCw, Truck, ArrowRight, Package, Phone, Calendar,
  Leaf, Award, Sparkles, Building2, AlertCircle, Eye,
  Check, XCircle, Info, ChevronDown, CheckCheck
} from 'lucide-react';
import {
  fetchRecyclerFeed,
  fetchRecyclerClaims,
  fetchRecyclerStats,
  cancelWasteClaim,
  confirmWasteRecycled,
  classifyWasteItem
} from '../../api/client';
import ClaimWasteModal from './ClaimWasteModal';
import RecyclingCertificateModal from './RecyclingCertificateModal';
import AnimatedCounter from '../../components/AnimatedCounter';

const SRI_LANKA_DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

const WASTE_CATEGORIES = [
  { key: 'all', label: 'All Material Streams' },
  { key: 'plastic', label: '🧴 Plastics & Polymers', icon: '🧴' },
  { key: 'glass', label: '🍾 Glass Bottles & Cullet', icon: '🍾' },
  { key: 'paper', label: '📦 Paper & Cardboard', icon: '📦' },
  { key: 'metal', label: '🥫 Scrap Metals', icon: '🥫' },
  { key: 'organic', label: '🥬 Organic Food Scraps', icon: '🥬' }
];

export default function RecyclerDashboard() {
  const { user } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('available');

  // Core Data States
  const [stats, setStats] = useState({
    totalBatches: 0,
    activeBatches: 0,
    completedBatches: 0,
    totalWeightKg: 0,
    totalCo2eSavedKg: 0,
    treeEquivalents: 0,
    materialBreakdown: {}
  });
  const [feed, setFeed] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Sourcing Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState(user?.district || 'Colombo');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'distance' | 'quantity'

  // Modals
  const [selectedBatchForClaim, setSelectedBatchForClaim] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Processing state for recycling confirmation
  const [processingId, setProcessingId] = useState(null);

  // Smart Classifier State (Tab 4)
  const [classifierInput, setClassifierInput] = useState('');
  const [classifierResult, setClassifierResult] = useState(null);
  const [classifierLoading, setClassifierLoading] = useState(false);

  const isVerified = user?.verificationStatus === 'verified' || stats.verificationStatus === 'verified';

  useEffect(() => {
    loadDashboardData();
  }, [activeTab, selectedCategory, selectedDistrict, sortBy]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Recycler Aggregate Stats
      const statsRes = await fetchRecyclerStats().catch(() => null);
      if (statsRes) {
        setStats(statsRes);
      }

      // 2. Fetch Tab Data
      if (activeTab === 'available') {
        const feedRes = await fetchRecyclerFeed({
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          district: selectedDistrict,
          sortBy,
          search: searchTerm || undefined
        }).catch(() => ({ feed: [] }));
        setFeed(feedRes?.feed || []);
      } else if (activeTab === 'active_claims' || activeTab === 'history') {
        const claimsRes = await fetchRecyclerClaims({
          status: activeTab === 'active_claims' ? undefined : 'recycled'
        }).catch(() => ({ claims: [] }));

        const allClaims = claimsRes?.claims || [];
        if (activeTab === 'active_claims') {
          // Filter to in-progress statuses
          setClaims(allClaims.filter((c) => c.status === 'matched' || c.status === 'pickup_scheduled' || c.status === 'picked_up'));
        } else {
          setClaims(allClaims.filter((c) => c.status === 'recycled' || c.status === 'completed'));
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading recycler dashboard:', err);
      setError(err.message || 'Failed to load recycler dashboard data');
      setLoading(false);
    }
  };

  const handleOpenClaimModal = (batch) => {
    setSelectedBatchForClaim(batch);
    setIsClaimModalOpen(true);
  };

  const handleClaimSuccess = () => {
    setActionSuccess('Waste batch successfully claimed! Scheduled for collection.');
    setTimeout(() => setActionSuccess(null), 5000);
    loadDashboardData();
  };

  const handleCancelClaim = async (wasteId) => {
    if (!window.confirm('Are you sure you want to release this claimed batch back to the open collection pool?')) {
      return;
    }

    try {
      await cancelWasteClaim(wasteId, 'Recycler released claim from portal.');
      setActionSuccess('Claim released successfully; batch returned to open pool.');
      setTimeout(() => setActionSuccess(null), 5000);
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to cancel claim');
    }
  };

  const handleConfirmRecycled = async (batch) => {
    const notes = prompt('Enter optional facility processing / sorting notes:', 'Passed contamination inspection. Reprocessed into circular feedstock.');
    if (notes === null) return; // User pressed Cancel

    setProcessingId(batch._id);
    try {
      const res = await confirmWasteRecycled(batch._id, { processingNotes: notes });
      setProcessingId(null);
      setActionSuccess('Batch certified as successfully recycled! ESG Diversion Certificate issued.');
      setTimeout(() => setActionSuccess(null), 5000);

      // Open certificate modal with generated certificate
      if (res?.certificate) {
        setActiveCertificate(res.certificate);
        setIsCertModalOpen(true);
      }
      loadDashboardData();
    } catch (err) {
      setProcessingId(null);
      setError(err.message || 'Failed to confirm batch recycling');
    }
  };

  const handleRunClassifier = async (customText) => {
    const textToClassify = customText || classifierInput;
    if (!textToClassify.trim()) return;

    setClassifierLoading(true);
    try {
      const res = await classifyWasteItem({ description: textToClassify });
      setClassifierResult(res);
      setClassifierLoading(false);
    } catch (err) {
      console.error('Classification error:', err);
      setClassifierLoading(false);
    }
  };

  return (
    <main className="main-content dashboard-page">
      {/* Page Header */}
      <div className="page-heading" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge blue" style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                Module 3 • Circular Waste Network
              </span>
              <span className={`badge ${isVerified ? 'green' : 'amber'}`} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={13} />
                <span>{isVerified ? 'Verified Facility' : 'Awaiting Review'}</span>
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
              {stats.organizationName || user?.name || 'Recycling & Composting Facility'}
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={15} color="#0284c7" />
              <span>{user?.district || 'Colombo'} Service District • {user?.email}</span>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setActiveTab('classifier');
                setClassifierInput('PET bottles and cardboard boxes');
                handleRunClassifier('PET bottles and cardboard boxes');
              }}
              className="btn btn-outline"
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={16} color="#0284c7" />
              <span>Waste Classifier</span>
            </button>
            <button
              onClick={loadDashboardData}
              className="btn btn-outline"
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RotateCw size={15} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {!isVerified && (
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13.5px', color: '#92400e' }}>
            <strong>Account Verification Pending:</strong> Your industrial recycling facility profile is currently under administrative KYC review. You can browse live surplus streams and test the smart classification engine; batch claiming will be activated upon approval.
          </div>
        </div>
      )}

      {/* Action Success / Error Notifications */}
      {actionSuccess && (
        <div
          style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '20px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '10px',
            padding: '12px 18px',
            marginBottom: '20px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Metrics Summary Grid */}
      <div
        className="kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="card stat-card" style={{ padding: '20px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Landfill Diversion
            </span>
            <Recycle size={20} color="#0284c7" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
            <AnimatedCounter value={stats.totalWeightKg || 0} decimals={1} suffix=" kg" />
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#059669', fontWeight: '600' }}>
            100% Circular Feedstock
          </p>
        </div>

        <div className="card stat-card" style={{ padding: '20px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              CO₂e Avoided
            </span>
            <Leaf size={20} color="#059669" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#059669' }}>
            <AnimatedCounter value={stats.totalCo2eSavedKg || 0} decimals={1} suffix=" kg" />
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            ~{stats.treeEquivalents || 0} urban tree seedlings
          </p>
        </div>

        <div className="card stat-card" style={{ padding: '20px', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Active Collections
            </span>
            <Truck size={20} color="#d97706" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
            <AnimatedCounter value={stats.activeBatches || 0} />
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            In-flight courier pipeline
          </p>
        </div>

        <div className="card stat-card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
              Certified Batches
            </span>
            <Award size={20} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
            <AnimatedCounter value={stats.completedBatches || 0} />
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            ESG audited completions
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '24px',
          gap: '8px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setActiveTab('available')}
          className="tab-btn"
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14.5px',
            fontWeight: activeTab === 'available' ? '700' : '500',
            color: activeTab === 'available' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'available' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Recycle size={18} />
          <span>Available Waste Streams</span>
          {feed.length > 0 && (
            <span
              style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {feed.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('active_claims')}
          className="tab-btn"
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14.5px',
            fontWeight: activeTab === 'active_claims' ? '700' : '500',
            color: activeTab === 'active_claims' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'active_claims' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Truck size={18} />
          <span>Active Collections ({stats.activeBatches || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className="tab-btn"
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14.5px',
            fontWeight: activeTab === 'history' ? '700' : '500',
            color: activeTab === 'history' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'history' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Award size={18} />
          <span>Certified History</span>
        </button>

        <button
          onClick={() => setActiveTab('classifier')}
          className="tab-btn"
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14.5px',
            fontWeight: activeTab === 'classifier' ? '700' : '500',
            color: activeTab === 'classifier' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'classifier' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={18} />
          <span>Smart Classifier</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className="tab-btn"
          style={{
            padding: '12px 18px',
            border: 'none',
            background: 'none',
            fontSize: '14.5px',
            fontWeight: activeTab === 'profile' ? '700' : '500',
            color: activeTab === 'profile' ? '#0284c7' : '#64748b',
            borderBottom: activeTab === 'profile' ? '3px solid #0284c7' : '3px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Building2 size={18} />
          <span>Facility Profile</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: AVAILABLE WASTE STREAMS (LIVE SOURCING FEED)
         ========================================================================= */}
      {activeTab === 'available' && (
        <section>
          {/* Filter Pills & Sourcing Toolbar */}
          <div className="card" style={{ padding: '18px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Category Filter Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {WASTE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className="btn"
                    style={{
                      padding: '6px 14px',
                      fontSize: '12.5px',
                      borderRadius: '20px',
                      border: selectedCategory === cat.key ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: selectedCategory === cat.key ? '#e0f2fe' : '#ffffff',
                      color: selectedCategory === cat.key ? '#0369a1' : '#475569',
                      fontWeight: selectedCategory === cat.key ? '700' : '500',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* District & Sort Dropdowns */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="urgency">Sort: Pickup Deadline (Urgent First)</option>
                  <option value="distance">Sort: Nearest Distance (km)</option>
                  <option value="quantity">Sort: Largest Batch (kg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Feed Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <RotateCw className="animate-spin" size={32} style={{ margin: '0 auto 12px auto' }} />
              <p>Scanning district waste streams...</p>
            </div>
          ) : feed.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc' }}>
              <Recycle size={44} color="#94a3b8" style={{ margin: '0 auto 14px auto' }} />
              <h3 style={{ fontSize: '18px', color: '#334155', margin: '0 0 6px 0' }}>
                No open waste batches currently available in {selectedDistrict}
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 18px auto' }}>
                Commercial donors post recyclable plastics, paper, metals, and organics regularly. Try expanding to adjacent districts or clearing filters.
              </p>
              <button
                onClick={() => { setSelectedCategory('all'); setSelectedDistrict('Colombo'); }}
                className="btn btn-outline"
                style={{ fontSize: '13px' }}
              >
                Reset Sourcing Filters
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {feed.map((batch) => {
                const streamLabels = {
                  plastic: { name: 'Plastic & Polymers', badge: 'blue' },
                  glass: { name: 'Glass & Cullet', badge: 'green' },
                  paper: { name: 'Paper & Cardboard', badge: 'amber' },
                  metal: { name: 'Scrap Metals', badge: 'purple' },
                  organic: { name: 'Organic Food Scraps', badge: 'green' },
                  non_recyclable: { name: 'General Waste', badge: 'red' }
                };
                const info = streamLabels[batch.wasteCategory] || { name: batch.wasteCategory, badge: 'blue' };

                return (
                  <div
                    key={batch._id}
                    className="card"
                    style={{
                      borderRadius: '14px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid #e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className={`badge ${info.badge}`} style={{ fontSize: '11.5px', fontWeight: '700' }}>
                          {info.name}
                        </span>
                        {batch.isUrgent ? (
                          <span className="badge red" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            <span>Urgent • ~{batch.hoursRemaining}h left</span>
                          </span>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} />
                            <span>~{batch.hoursRemaining}h remaining</span>
                          </span>
                        )}
                      </div>

                      {/* Quantity & Impact */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
                          {batch.quantity}
                        </h3>
                        {batch.impact && (
                          <span style={{ fontSize: '13px', fontWeight: '700', color: '#059669' }}>
                            +{batch.impact.co2eSavedKg} kg CO₂e
                          </span>
                        )}
                      </div>

                      {/* Location & Donor */}
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={15} color="#0284c7" />
                          <span>
                            <strong>{batch.district}</strong> • ~{batch.distanceKm} km away {batch.isSameDistrict ? '(Local)' : ''}
                          </span>
                        </div>
                        {batch.donor && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                            <Building2 size={15} />
                            <span>Premise: {batch.donor.name || 'Commercial Donor'}</span>
                          </div>
                        )}
                      </div>

                      {/* Pathway preview */}
                      <div
                        style={{
                          background: '#f8fafc',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #f1f5f9',
                          fontSize: '12px',
                          color: '#334155',
                          marginBottom: '16px'
                        }}
                      >
                        <div style={{ fontWeight: '600', color: '#0284c7', marginBottom: '2px' }}>
                          Pathway: {batch.pathwayTitle}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11.5px' }}>
                          Facility: {batch.facilityType === 'composting_facility' ? 'Composting Plant' : 'Industrial Recycler'}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <button
                      onClick={() => handleOpenClaimModal(batch)}
                      disabled={!isVerified}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '13.5px',
                        background: isVerified ? '#0284c7' : '#94a3b8',
                        borderColor: isVerified ? '#0284c7' : '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: isVerified ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isVerified ? 'Accept & Claim Batch' : 'Verification Required'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 2: ACTIVE COLLECTIONS (LOGISTICS & LIFECYCLE)
         ========================================================================= */}
      {activeTab === 'active_claims' && (
        <section>
          {claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc' }}>
              <Truck size={44} color="#94a3b8" style={{ margin: '0 auto 14px auto' }} />
              <h3 style={{ fontSize: '18px', color: '#334155', margin: '0 0 6px 0' }}>
                No active collections in transit
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto 18px auto' }}>
                When you accept waste batches from donors, they appear here with real-time pickup status pipeline and volunteer courier telemetry.
              </p>
              <button onClick={() => setActiveTab('available')} className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                Browse Available Waste Streams
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {claims.map((claim) => (
                <div key={claim._id} className="card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge blue" style={{ fontSize: '12px', fontWeight: '700' }}>
                          {claim.wasteCategory.toUpperCase()}
                        </span>
                        <span className="badge amber" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          Pipeline: {claim.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                        {claim.quantity} from {claim.donor?.name || 'Verified Donor'}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                        District: {claim.district} • Claimed on: {new Date(claim.updatedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleConfirmRecycled(claim)}
                        disabled={processingId === claim._id}
                        className="btn btn-primary"
                        style={{
                          fontSize: '13px',
                          background: '#059669',
                          borderColor: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Award size={15} />
                        <span>{processingId === claim._id ? 'Processing...' : 'Confirm Recycled & Certify'}</span>
                      </button>
                      <button
                        onClick={() => handleCancelClaim(claim._id)}
                        className="btn btn-outline"
                        style={{ fontSize: '13px', color: '#991b1b', borderColor: '#fca5a5' }}
                      >
                        Release Claim
                      </button>
                    </div>
                  </div>

                  {/* 5-Stage Status Pipeline Visualization */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Circular Logistics Pipeline
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center', fontSize: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '6px', background: '#ecfdf5', color: '#065f46', fontWeight: '700' }}>
                        ✓ 1. Matched
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: claim.status === 'pickup_scheduled' || claim.status === 'picked_up' ? '#ecfdf5' : '#f1f5f9', color: '#334155', fontWeight: '600' }}>
                        2. Scheduled
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: claim.status === 'picked_up' ? '#ecfdf5' : '#f1f5f9', color: '#334155', fontWeight: '600' }}>
                        3. Picked Up
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b' }}>
                        4. Recycled & Certified
                      </div>
                    </div>

                    {/* Volunteer Info if assigned */}
                    {claim.pickup?.volunteer && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#0369a1' }}>
                        <Truck size={16} />
                        <span>
                          <strong>Assigned Courier:</strong> {claim.pickup.volunteer.name} ({claim.pickup.volunteer.contactNumber})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 3: CERTIFIED RECYCLING HISTORY & ESG CERTIFICATES
         ========================================================================= */}
      {activeTab === 'history' && (
        <section>
          {claims.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc' }}>
              <Award size={44} color="#94a3b8" style={{ margin: '0 auto 14px auto' }} />
              <h3 style={{ fontSize: '18px', color: '#334155', margin: '0 0 6px 0' }}>
                No completed certificates yet
              </h3>
              <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '420px', margin: '0 auto' }}>
                Once you accept batches and confirm circular reprocessing, your verified ESG Landfill Diversion Certificates will be catalogued here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {claims.map((batch) => (
                <div
                  key={batch._id}
                  className="card"
                  style={{
                    padding: '18px 22px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge green" style={{ fontSize: '11px', fontWeight: '700' }}>
                        ✓ RECYCLED & AUDITED
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Ref: FB-REC-{(batch._id).slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>
                      {batch.quantity} ({batch.wasteCategory}) from {batch.donor?.name || 'Commercial Donor'}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#64748b' }}>
                      Pathway: {batch.pathwayTitle || 'Industrial Polymer Reprocessing'} • Completed: {new Date(batch.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {batch.impact && (
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>MITIGATED</span>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#059669' }}>
                          {batch.impact.co2eSavedKg} kg CO₂e
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setActiveCertificate(null); // Will generate from batch
                        setSelectedBatchForClaim(batch);
                        setIsCertModalOpen(true);
                      }}
                      className="btn btn-outline"
                      style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Eye size={15} />
                      <span>View ESG Certificate</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 4: SMART WASTE CLASSIFIER & ROUTING TOOL
         ========================================================================= */}
      {activeTab === 'classifier' && (
        <section>
          <div className="card" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Smart Multi-Stream Waste Classifier & Industrial Router
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Module 3 Algorithmic Classification • Analyzes surplus items, determines facility pathways, and generates pre-treatment advisories.
                </p>
              </div>
            </div>

            {/* Quick Sample Buttons */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>
                Try Common Material Inputs:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const text = 'Clean PET beverage water bottles and HDPE crates from dining hall';
                    setClassifierInput(text);
                    handleRunClassifier(text);
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🧴 PET Bottles & Crates
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = 'Used amber beer bottles and clear glass sauce jars';
                    setClassifierInput(text);
                    handleRunClassifier(text);
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🍾 Amber Glass Bottles
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = 'Corrugated cardboard delivery boxes and shredded office paper';
                    setClassifierInput(text);
                    handleRunClassifier(text);
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  📦 Corrugated Boxes & Paper
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = 'Empty aluminum soda cans and steel food tins';
                    setClassifierInput(text);
                    handleRunClassifier(text);
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🥫 Aluminum Cans & Tins
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = 'Kitchen vegetable peelings, spoiled fruit trimmings, and coffee grounds';
                    setClassifierInput(text);
                    handleRunClassifier(text);
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  🥬 Kitchen Organic Scraps
                </button>
              </div>
            </div>

            {/* Custom Input */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter waste item description, keywords, or material title..."
                value={classifierInput}
                onChange={(e) => setClassifierInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleRunClassifier(); }}
                style={{ flex: 1, padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={() => handleRunClassifier()}
                disabled={classifierLoading}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '14px', background: '#0284c7', borderColor: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {classifierLoading ? <RotateCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                <span>Classify Stream</span>
              </button>
            </div>

            {/* Classifier Results Card */}
            {classifierResult?.classification && (
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '12px',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <span className="badge blue" style={{ fontSize: '12px', fontWeight: '700' }}>
                      CLASSIFICATION: {classifierResult.classification.categoryLabel.toUpperCase()}
                    </span>
                    <h4 style={{ margin: '8px 0 2px 0', fontSize: '19px', fontWeight: '800', color: '#0369a1' }}>
                      {classifierResult.classification.pathwayTitle}
                    </h4>
                    <p style={{ margin: 0, fontSize: '12.5px', color: '#0284c7' }}>
                      Recommended Destination: <strong>{classifierResult.classification.facilityTypeLabel}</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
                      Algorithm Confidence
                    </span>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>
                      {(classifierResult.classification.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', marginBottom: '16px' }}>
                  {classifierResult.classification.pathwayDescription}
                </p>

                {/* Pre-Treatment Guidelines */}
                {Array.isArray(classifierResult.classification.handlingGuidelines) && (
                  <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '10px', border: '1px solid #e0f2fe', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0369a1', marginBottom: '6px' }}>
                      Facility Intake & Pre-Treatment Standards:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#475569', lineHeight: '1.5' }}>
                      {classifierResult.classification.handlingGuidelines.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Circular Impact Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Landfill Diversion Rate</span>
                    <strong style={{ color: '#0f172a', fontSize: '14px' }}>{(classifierResult.classification.landfillDivertRate * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>CO₂e Factor per kg</span>
                    <strong style={{ color: '#059669', fontSize: '14px' }}>+{classifierResult.classification.co2FactorKg} kg CO₂e / kg</strong>
                  </div>
                  <div style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Standard 50kg Batch Yield</span>
                    <strong style={{ color: '#0284c7', fontSize: '14px' }}>~{classifierResult.impact?.co2eSavedKg || 90} kg CO₂e saved</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 5: FACILITY PROFILE & SETTINGS
         ========================================================================= */}
      {activeTab === 'profile' && (
        <section>
          <div className="card" style={{ padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
              Facility Profile & Licensed Material Streams
            </h3>

            <dl className="report-breakdown" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13.5px' }}>
              <div>
                <dt style={{ color: '#64748b', fontSize: '12px' }}>Facility Name</dt>
                <dd style={{ fontWeight: '700', color: '#0f172a' }}>{stats.organizationName || user?.name || 'Recycling Plant'}</dd>
              </div>
              <div>
                <dt style={{ color: '#64748b', fontSize: '12px' }}>Verification Status</dt>
                <dd>
                  <span className={`badge ${isVerified ? 'green' : 'amber'}`}>
                    {isVerified ? 'Approved & Licensed' : 'Under Review'}
                  </span>
                </dd>
              </div>
              <div>
                <dt style={{ color: '#64748b', fontSize: '12px' }}>Primary Service District</dt>
                <dd style={{ fontWeight: '600' }}>{user?.district || 'Colombo'}</dd>
              </div>
              <div>
                <dt style={{ color: '#64748b', fontSize: '12px' }}>Contact Email</dt>
                <dd>{user?.email}</dd>
              </div>
            </dl>

            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
                Handled Material Capabilities:
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {WASTE_CATEGORIES.filter((c) => c.key !== 'all').map((cat) => (
                  <span
                    key={cat.key}
                    className="badge blue"
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600' }}
                  >
                    {cat.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Claim Batch Confirmation Modal */}
      <ClaimWasteModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        wasteRequest={selectedBatchForClaim}
        onClaimSuccess={handleClaimSuccess}
      />

      {/* Printable ESG Recycling Certificate Modal */}
      <RecyclingCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        certificate={activeCertificate}
        batch={selectedBatchForClaim}
      />
    </main>
  );
}
