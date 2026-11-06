import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  HeartHandshake, MapPin, Clock, Search, ShieldCheck, 
  Filter, AlertTriangle, CheckCircle2, ChevronRight, 
  RotateCw, Truck, ArrowRight, Package, Phone, Calendar, 
  Utensils, Info, Check, XCircle, AlertCircle, FileCheck
} from 'lucide-react';
import { 
  fetchNearbyDonations, 
  fetchRecipientStats, 
  fetchRecipientClaims, 
  claimDonation, 
  cancelDonationClaim,
  confirmPickupReceipt
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

  // Modals & Action States
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Receipt Confirmation State (for couriers arriving with delivered_or_recycled)
  const [receiptModalPickup, setReceiptModalPickup] = useState(null);
  const [receiptNote, setReceiptNote] = useState('');
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);

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
    await claimDonation(donationId, notes);
    setActionSuccess('Donation successfully claimed! Courier logistics has been notified.');
    setTimeout(() => setActionSuccess(null), 5000);
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

  const handleConfirmReceipt = async (pickupId, accepted = true) => {
    setReceiptSubmitting(true);
    try {
      await confirmPickupReceipt(pickupId, {
        accepted,
        note: receiptNote || (accepted ? 'Food verified in good condition and distributed to beneficiaries.' : 'Rejected upon physical inspection.')
      });
      setActionSuccess(accepted ? 'Delivery receipt confirmed! Rescue mission marked completed.' : 'Delivery rejected and recorded.');
      setReceiptModalPickup(null);
      setReceiptNote('');
      setTimeout(() => setActionSuccess(null), 5000);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to confirm receipt');
    } finally {
      setReceiptSubmitting(false);
    }
  };

  const getUrgencyBadge = (hoursRemaining) => {
    if (hoursRemaining === null || hoursRemaining === undefined) return null;
    if (hoursRemaining <= 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
          <Clock size={12} /> {hoursRemaining}h left (Critical)
        </span>
      );
    }
    if (hoursRemaining <= 6) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={12} /> {hoursRemaining}h left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <Clock size={12} /> {hoursRemaining}h window
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
              Charity & Shelter Allocation Portal
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Module 2 • Proximity Smart Matching
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Recipient Operations — {user?.name || 'NGO / Charity'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Live proximity feed and algorithmic matching to claim and redirect edible food before spoilage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <ShieldCheck size={16} className="text-emerald-600" />
              Verified Charity Partner
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
              <Clock size={16} className="text-amber-600" />
              Verification Pending Review
            </span>
          )}
          <button
            onClick={loadData}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Refresh portal data"
            aria-label="Refresh data"
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
            <h4 className="font-bold text-amber-900">Account Verification Pending</h4>
            <p className="text-amber-800 mt-0.5">
              Your charity profile is currently undergoing verification by platform administrators. You can browse live surplus donations in read-only mode. Once approved, one-click claims will be unlocked.
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

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Surplus in District</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Utensils size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.availableInDistrict} />
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            {selectedDistrict} Logistics Hub
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Claims</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.activeClaimsCount} />
          </div>
          <p className="mt-1 text-xs font-semibold text-blue-600">
            Courier Dispatched / In Transit
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Meals Rescued</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <HeartHandshake size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.estimatedMealsRescued} />
          </div>
          <p className="mt-1 text-xs font-semibold text-purple-600">
            Beneficiary Portions Delivered
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Service District</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <MapPin size={18} />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 truncate">
            {user?.district || 'Colombo'}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Autonomous Proximity Radius
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'available'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Utensils size={17} />
          <span>Smart Matching Feed</span>
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            activeTab === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {donations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('active_claims')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'active_claims'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Truck size={17} />
          <span>Active Rescue Logistics</span>
          {stats.activeClaimsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-600 text-white font-bold">
              {stats.activeClaimsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CheckCircle2 size={17} />
          <span>Completed Rescues</span>
        </button>
      </div>

      {/* Tab 1: Available Smart Matching Feed */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search food type or commercial donor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
            </form>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-emerald-600 shrink-0" />
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {DISTRICTS_LIST.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} {dist === user?.district ? '(My District)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Storage Types</option>
                <option value="room_temperature">Room Temp</option>
                <option value="refrigerated">Refrigerated</option>
                <option value="frozen">Frozen</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="smart_match">★ Smart Match Score</option>
                <option value="urgency">⏳ Expiring Soonest</option>
                <option value="distance">📍 Nearest Proximity</option>
                <option value="newest">Newest Listed</option>
              </select>
            </div>
          </div>

          {/* Cards or Empty State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-4 bg-slate-100 rounded" />
                    <div className="h-4 bg-slate-100 rounded" />
                  </div>
                  <div className="h-10 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <HeartHandshake size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No active surplus found in {selectedDistrict}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                All donations in this district have either been claimed or allocated. Check neighbouring districts or check back shortly.
              </p>
              <button
                onClick={() => setSelectedDistrict('Colombo')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Switch to Colombo Hub
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {donations.map((donation) => {
                const matchScore = donation.matchScore || 0;
                return (
                  <motion.div
                    key={donation._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold mb-2 border ${
                            matchScore >= 80 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            ★ {matchScore}% Smart Match
                          </span>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {donation.foodType}
                          </h3>
                        </div>
                        <span className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-2xs">
                          {donation.quantity}
                        </span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-4 flex-1">
                      <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {donation.district} ({donation.distanceKm ? `${donation.distanceKm} km` : 'Local'})
                          </span>
                        </div>
                        <div>
                          {getUrgencyBadge(donation.hoursRemaining)}
                        </div>
                        <div className="flex items-center gap-1.5 capitalize">
                          <Package size={14} className="text-indigo-600 shrink-0" />
                          <span>{(donation.storageCondition || 'room_temperature').replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone size={14} className="text-sky-600 shrink-0" />
                          <span className="truncate">{donation.donor?.contactNumber || 'Contact on Claim'}</span>
                        </div>
                      </div>

                      {/* Donor Box */}
                      <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1 border border-slate-100">
                        <div>
                          <strong className="text-slate-800">Donor:</strong> {donation.donor?.name || 'Commercial Donor'}
                        </div>
                        {donation.specialInstructions && (
                          <div className="text-slate-500 italic">
                            "{donation.specialInstructions}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        {donation.estimatedPortions ? `~${donation.estimatedPortions} Portions` : 'Verified Surplus'}
                      </span>
                      <button
                        onClick={() => handleOpenClaimModal(donation)}
                        disabled={!isVerified}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
                          isVerified
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <HeartHandshake size={14} />
                        Claim for Rescue
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Claims Pipeline */}
      {activeTab === 'active_claims' && (
        <div className="space-y-5">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 animate-pulse">
              <RotateCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Fetching active rescue missions...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Truck size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No active claims in progress
              </h3>
              <p className="text-sm text-slate-500">
                Browse the Smart Matching Feed to claim surplus food for your shelter or community.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                Browse Available Surplus
              </button>
            </div>
          ) : (
            claims.map((claim) => {
              const donation = claim.donation || {};
              const volunteer = claim.volunteer;
              const pipelineStage = claim.statusPipeline;
              const isDeliveredAwaitingConfirmation = pipelineStage === 'delivered_or_recycled';

              return (
                <div 
                  key={claim._id}
                  className={`bg-white rounded-2xl border transition-all p-6 shadow-2xs space-y-5 ${
                    isDeliveredAwaitingConfirmation 
                      ? 'border-emerald-400 ring-2 ring-emerald-500/10' 
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase tracking-wide bg-blue-100 text-blue-800">
                          Pipeline: {pipelineStage.replace(/_/g, ' ')}
                        </span>
                        {isDeliveredAwaitingConfirmation && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-bold uppercase bg-amber-100 text-amber-800 animate-pulse">
                            <AlertCircle size={11} /> Recipient Confirmation Required
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-900">
                        {donation.foodType || 'Food Surplus Claim'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Donor: <strong className="text-slate-700">{donation.donor?.name || 'Commercial Partner'}</strong> • District: {donation.district || 'Colombo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm font-bold">
                        {donation.quantity || 'Reserved Quantity'}
                      </span>
                      {pipelineStage === 'matched' && (
                        <button
                          onClick={() => handleCancelClaim(donation._id)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Release Claim
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5-Step Pipeline Progress Bar */}
                  <div className="grid grid-cols-5 gap-2 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                    {[
                      { key: 'matched', label: '1. Matched' },
                      { key: 'pickup_scheduled', label: '2. Courier Assigned' },
                      { key: 'picked_up', label: '3. In Transit' },
                      { key: 'delivered_or_recycled', label: '4. Arrived' },
                      { key: 'completed', label: '5. Confirmed' }
                    ].map((step, idx) => {
                      const stages = ['matched', 'pickup_scheduled', 'picked_up', 'delivered_or_recycled', 'completed'];
                      const currentIdx = stages.indexOf(pipelineStage);
                      const isComplete = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div key={step.key} className="text-center">
                          <div 
                            className={`h-1.5 rounded-full mb-1.5 transition-colors ${
                              isComplete ? 'bg-emerald-600' : 'bg-slate-200'
                            }`}
                          />
                          <span className={`text-2xs sm:text-xs font-semibold block truncate ${
                            isCurrent ? 'text-emerald-700 font-extrabold' : isComplete ? 'text-slate-700' : 'text-slate-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Two-Party Confirmation Card when Arrived */}
                  {isDeliveredAwaitingConfirmation && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                          <FileCheck size={18} className="text-emerald-700" />
                          <span>Volunteer has delivered the surplus food!</span>
                        </div>
                        <p className="text-xs text-emerald-800">
                          Please inspect the cargo condition. Confirming receipt closes the pickup workflow and officially credits platform diversion impact.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setReceiptModalPickup(claim)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check size={14} /> Confirm Receipt
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('State rejection reason (e.g. food spoiled, temperature compromised):');
                            if (reason) {
                              setReceiptNote(reason);
                              handleConfirmReceipt(claim._id, false);
                            }
                          }}
                          className="px-3 py-2 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Reject Cargo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Volunteer Courier Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <Truck size={15} className={volunteer ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>
                        {volunteer ? (
                          <>Volunteer Courier: <strong className="text-slate-800">{volunteer.name}</strong> ({volunteer.contactNumber})</>
                        ) : (
                          <span className="text-amber-600 font-medium">Awaiting community volunteer assignment</span>
                        )}
                      </span>
                    </div>

                    {donation.pickupDeadline && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        <span>Pickup Window: {new Date(donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Completed Rescues Archive */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 animate-pulse">
              <RotateCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Loading rescue archive...</p>
            </div>
          ) : claims.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No completed rescue missions yet
              </h3>
              <p className="text-sm text-slate-500">
                When active rescue missions are delivered and confirmed, they will be archived here with official receipt timestamps.
              </p>
            </div>
          ) : (
            claims.map((claim) => (
              <div 
                key={claim._id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {claim.donation?.foodType || 'Completed Food Rescue'}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-emerald-100 text-emerald-800">
                      Delivered & Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Donor: {claim.donation?.donor?.name || 'Commercial Donor'} • District: {claim.donation?.district}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    {claim.donation?.quantity}
                  </div>
                  <span className="text-2xs text-slate-400">
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

      {/* Recipient Receipt Confirmation Dialog */}
      <AnimatePresence>
        {receiptModalPickup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <FileCheck size={20} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Confirm Pickup Delivery Receipt
                  </h3>
                </div>
                <button
                  onClick={() => setReceiptModalPickup(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    <strong className="text-slate-900">Food Item:</strong> {receiptModalPickup.donation?.foodType} ({receiptModalPickup.donation?.quantity})
                  </p>
                  <p>
                    <strong className="text-slate-900">Delivered By:</strong> {receiptModalPickup.volunteer?.name || 'Volunteer Courier'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Physical Inspection & Acceptance Note
                  </label>
                  <textarea
                    rows={3}
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    placeholder="e.g. Received intact, packaging sealed, temperature compliant. Distributed to shelter kitchen."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setReceiptModalPickup(null)}
                    disabled={receiptSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmReceipt(receiptModalPickup._id, true)}
                    disabled={receiptSubmitting}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {receiptSubmitting ? <RotateCw size={13} className="animate-spin" /> : <Check size={14} />}
                    Confirm & Complete Rescue
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
