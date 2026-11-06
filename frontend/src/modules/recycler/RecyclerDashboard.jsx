import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Recycle, MapPin, Clock, Search, ShieldCheck,
  Filter, AlertTriangle, CheckCircle2, ChevronRight,
  RotateCw, Truck, ArrowRight, Package, Phone, Calendar,
  Leaf, Award, Sparkles, Building2, AlertCircle, Eye,
  Check, XCircle, Info, FileCheck, CheckCheck
} from 'lucide-react';
import {
  fetchRecyclerFeed,
  fetchRecyclerClaims,
  fetchRecyclerStats,
  cancelWasteClaim,
  confirmWasteRecycled,
  classifyWasteItem,
  fetchWasteCertificate,
  confirmPickupReceipt
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
  { key: 'plastic', label: '🧴 Plastics & Polymers' },
  { key: 'glass', label: '🍾 Glass Bottles & Cullet' },
  { key: 'paper', label: '📦 Paper & Cardboard' },
  { key: 'metal', label: '🥫 Scrap Metals' },
  { key: 'organic', label: '🥬 Organic Food Scraps' }
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
    totalDivertedKg: 0,
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
  const [sortBy, setSortBy] = useState('urgency');

  // Modals
  const [selectedBatchForClaim, setSelectedBatchForClaim] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  // Recycled Certification Dialog Modal State (replaces prompt)
  const [certifyingBatch, setCertifyingBatch] = useState(null);
  const [certifyingNotes, setCertifyingNotes] = useState('Passed facility intake inspection. Reprocessed into circular feedstock.');
  const [submittingCertification, setSubmittingCertification] = useState(false);

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
          setClaims(allClaims.filter((c) => c.status === 'matched' || c.status === 'pickup_scheduled' || c.status === 'picked_up' || c.statusPipeline === 'delivered_or_recycled'));
        } else {
          setClaims(allClaims.filter((c) => c.status === 'recycled' || c.status === 'completed' || c.statusPipeline === 'completed'));
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

  const handleSubmitRecycleCertification = async () => {
    if (!certifyingBatch) return;
    setSubmittingCertification(true);
    try {
      const res = await confirmWasteRecycled(certifyingBatch._id, { processingNotes: certifyingNotes });
      setSubmittingCertification(false);
      setCertifyingBatch(null);
      setActionSuccess('Batch certified as successfully processed! ESG Diversion Certificate issued.');
      setTimeout(() => setActionSuccess(null), 5000);

      // Open certificate modal with generated certificate
      if (res?.certificate) {
        setActiveCertificate(res.certificate);
        setIsCertModalOpen(true);
      }
      loadDashboardData();
    } catch (err) {
      setSubmittingCertification(false);
      setError(err.message || 'Failed to certify batch recycling');
    }
  };

  const handleViewCertificate = async (batch) => {
    try {
      const cert = await fetchWasteCertificate(batch._id);
      if (cert) {
        setActiveCertificate(cert);
        setIsCertModalOpen(true);
      }
    } catch (err) {
      setError(err.message || 'Could not load certificate for this batch');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-sky-100 text-sky-800">
              Module 3 • Circular Waste Network
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Material Recovery & Diversion Certification
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {stats.organizationName || user?.name || 'Recycling & Upcycling Facility'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl flex items-center gap-1.5">
            <MapPin size={15} className="text-sky-600 shrink-0" />
            <span>{user?.district || 'Colombo'} Service District • {user?.email}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <ShieldCheck size={16} className="text-emerald-600" />
              Verified Processing Facility
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              <Clock size={16} className="text-amber-600" />
              Awaiting Verification
            </span>
          )}

          <button
            onClick={() => {
              setActiveTab('classifier');
              setClassifierInput('PET bottles and corrugated cardboard packaging');
              handleRunClassifier('PET bottles and corrugated cardboard packaging');
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={14} className="text-sky-600" />
            <span>Classifier</span>
          </button>

          <button
            onClick={loadDashboardData}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {!isVerified && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 shadow-2xs">
          <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <h4 className="font-bold text-amber-900">Facility Verification Pending</h4>
            <p className="text-amber-800 mt-0.5">
              Your recycling facility license and environmental clearance documents are being verified by platform administrators. You can browse available waste streams, but intake claims are locked until verification is approved.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {actionSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-sm font-semibold text-emerald-800 shadow-2xs"
        >
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </motion.div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-sm text-rose-800 shadow-2xs">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {error}
          </div>
        </div>
      )}

      {/* KPI Stats Grid - 100% Truthful Metrics from Database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Landfill Diversion</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Recycle size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.totalDivertedKg || stats.totalWeightKg || 0} decimals={1} suffix=" kg" />
          </div>
          <p className="mt-1 text-xs font-semibold text-sky-600">
            100% Database-Audited Diversion
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Collections</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.activeBatches || 0} />
          </div>
          <p className="mt-1 text-xs font-semibold text-amber-600">
            Scheduled / In-Flight Intake
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Certified Batches</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Award size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.completedBatches || 0} />
          </div>
          <p className="mt-1 text-xs font-semibold text-purple-600">
            ESG Diversion Certificates Issued
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Facility District</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Building2 size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 truncate">
            {user?.district || 'Colombo'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Primary Sourcing Radius
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'available'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Recycle size={17} />
          <span>Available Waste Streams</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'available' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {feed.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active_claims')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'active_claims'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Truck size={17} />
          <span>Active Collections ({stats.activeBatches || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Award size={17} />
          <span>Certified History</span>
        </button>

        <button
          onClick={() => setActiveTab('classifier')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'classifier'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Sparkles size={17} />
          <span>AI Waste Classifier</span>
        </button>
      </div>

      {/* Tab 1: Available Waste Streams Feed */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search material type, commercial generator, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {WASTE_CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>

              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-sky-600 shrink-0" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  {SRI_LANKA_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} {dist === user?.district ? '(My District)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="urgency">⏳ Expiring Soonest</option>
                <option value="distance">📍 Nearest Proximity</option>
                <option value="quantity">⚖ Highest Quantity</option>
              </select>
            </div>
          </div>

          {/* Feed Cards or Empty State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Recycle size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No open waste batches found in {selectedDistrict}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Commercial generators have not posted unclaimed recyclable or compostable streams in this district currently. Check neighbouring districts or check back shortly.
              </p>
              <button
                onClick={() => setSelectedDistrict('Colombo')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Switch to Colombo District
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {feed.map((batch) => (
                <motion.div
                  key={batch._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
                >
                  <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/40">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded text-2xs font-bold uppercase bg-sky-100 text-sky-800 mb-1.5">
                          {batch.wasteCategory}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {batch.foodType || batch.title || `${batch.wasteCategory} Stream`}
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-2xs shrink-0">
                        {batch.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin size={14} className="text-sky-600 shrink-0" />
                        <span className="truncate">{batch.district} ({batch.distanceKm ? `${batch.distanceKm} km` : 'Local'})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span>{batch.hoursRemaining ? `${batch.hoursRemaining}h window` : 'Available'}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1 border border-slate-100">
                      <div>
                        <strong className="text-slate-800">Generator:</strong> {batch.donor?.name || 'Commercial Partner'}
                      </div>
                      {batch.handlingRequirements && (
                        <div className="text-slate-500 italic">
                          "Handling: {batch.handlingRequirements}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                      Intake Ready
                    </span>
                    <button
                      onClick={() => handleOpenClaimModal(batch)}
                      disabled={!isVerified}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                        isVerified
                          ? 'bg-sky-600 hover:bg-sky-700 text-white'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Recycle size={14} />
                      Claim Batch
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Collections */}
      {activeTab === 'active_claims' && (
        <div className="space-y-5">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 animate-pulse">
              <RotateCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Fetching active collection logistics...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
                <Truck size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No active waste claims
              </h3>
              <p className="text-sm text-slate-500">
                Browse available waste streams to source organic feedstocks, glass, metal, paper, or plastic batches.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer"
              >
                Browse Available Streams
              </button>
            </div>
          ) : (
            claims.map((batch) => {
              const isDeliveredOrArrived = batch.status === 'picked_up' || batch.statusPipeline === 'delivered_or_recycled' || batch.status === 'delivered';
              return (
                <div
                  key={batch._id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase tracking-wide bg-sky-100 text-sky-800">
                          Status: {batch.status || batch.statusPipeline}
                        </span>
                        <span className="text-2xs font-bold text-slate-500 uppercase">
                          {batch.wasteCategory} Stream
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {batch.foodType || batch.title || 'Recovered Material Batch'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Generator: <strong className="text-slate-700">{batch.donor?.name || 'Commercial Donor'}</strong> • District: {batch.district || 'Colombo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold">
                        {batch.quantity}
                      </span>
                      {batch.status === 'matched' && (
                        <button
                          onClick={() => handleCancelClaim(batch._id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Release Batch
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Processing / Certification Action */}
                  <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-sky-900">
                      <strong className="block mb-0.5">Facility Material Intake</strong>
                      Once the batch has arrived at your facility and completed decontamination/shredding/composting, record the processing outcome to generate an audited ESG diversion certificate.
                    </div>
                    <button
                      onClick={() => {
                        setCertifyingBatch(batch);
                        setCertifyingNotes('Passed facility contamination inspection. Reprocessed into circular feedstock.');
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Award size={14} /> Certify Recycling
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Certified History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 animate-pulse">
              <RotateCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Loading certified history...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
                <Award size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No certified recycling batches yet
              </h3>
              <p className="text-sm text-slate-500">
                When active waste collections are processed and certified, they will be archived here with immutable ESG diversion records.
              </p>
            </div>
          ) : (
            claims.map((batch) => (
              <div
                key={batch._id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCheck size={16} className="text-emerald-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {batch.foodType || batch.title || `${batch.wasteCategory} Batch`}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-purple-100 text-purple-800">
                      ESG Certified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Generator: {batch.donor?.name || 'Commercial Partner'} • Category: {batch.wasteCategory}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900">
                      {batch.quantity}
                    </div>
                    <span className="text-2xs text-slate-400">
                      {new Date(batch.updatedAt || batch.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewCertificate(batch)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>View Certificate</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: AI Waste Classifier */}
      {activeTab === 'classifier' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs max-w-2xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles size={16} /> Intelligent Stream Classification
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Rule-Based Material Sorter
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Type or paste material descriptions to classify waste into standard circular streams: plastic, glass, metal, paper, or organic.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Material Description
            </label>
            <textarea
              rows={3}
              value={classifierInput}
              onChange={(e) => setClassifierInput(e.target.value)}
              placeholder="e.g. 50 kg of HDPE plastic drums with residue cleaned out and stacked."
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
            />
            <button
              onClick={() => handleRunClassifier()}
              disabled={classifierLoading || !classifierInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-2 disabled:bg-slate-200 disabled:cursor-not-allowed"
            >
              {classifierLoading ? <RotateCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Classify Material</span>
            </button>
          </div>

          {classifierResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-sky-50/70 border border-sky-200 p-4 space-y-2 text-xs text-sky-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-2xs text-sky-700">Classification Result</span>
                <span className="px-2 py-0.5 rounded bg-sky-200 text-sky-900 font-extrabold uppercase">
                  {classifierResult.category}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900">
                Recommended Stream: <strong className="capitalize">{classifierResult.category}</strong>
              </p>
              {classifierResult.handling && (
                <p className="text-slate-600">
                  <strong>Handling:</strong> {classifierResult.handling}
                </p>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* Sourcing Modal */}
      <ClaimWasteModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        wasteRequest={selectedBatchForClaim}
        onClaimSuccess={handleClaimSuccess}
      />

      {/* Recycled Certification Dialog Modal (Replacing prompt) */}
      <AnimatePresence>
        {certifyingBatch && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Certify Circular Material Recycling
                  </h3>
                </div>
                <button
                  onClick={() => setCertifyingBatch(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-900">Stream:</strong> {certifyingBatch.foodType || certifyingBatch.wasteCategory} ({certifyingBatch.quantity})
                  </p>
                  <p>
                    <strong className="text-slate-900">Generator:</strong> {certifyingBatch.donor?.name || 'Commercial Partner'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Facility Processing / Sorting Notes
                  </label>
                  <textarea
                    rows={3}
                    value={certifyingNotes}
                    onChange={(e) => setCertifyingNotes(e.target.value)}
                    placeholder="e.g. Passed facility contamination inspection. Reprocessed into circular feedstock."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setCertifyingBatch(null)}
                    disabled={submittingCertification}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRecycleCertification}
                    disabled={submittingCertification}
                    className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingCertification ? <RotateCw size={13} className="animate-spin" /> : <Award size={14} />}
                    Issue Diversion Certificate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ESG Recycling Certificate Modal */}
      <RecyclingCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        certificate={activeCertificate}
      />
    </div>
  );
}
