import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  fetchOpenPickups,
  fetchMyActivePickups,
  fetchPickupHistory,
  fetchVolunteerStats,
  acceptPickupJob,
  updatePickupStatus,
  cancelPickupJob
} from '../../api/client';
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  Phone,
  ShieldCheck,
  AlertCircle,
  Calendar,
  ArrowRight,
  Package,
  RefreshCw,
  Check,
  X,
  Route as RouteIcon,
  ChevronRight,
  Sparkles,
  Award,
  Thermometer,
  FileText
} from 'lucide-react';
import AnimatedCounter from '../../components/AnimatedCounter';

const SRI_LANKA_DISTRICTS = [
  'all',
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function VolunteerDashboard() {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'available' | 'route' | 'history'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState('all');

  const [openJobs, setOpenJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [historyJobs, setHistoryJobs] = useState([]);
  const [stats, setStats] = useState({
    completedMissions: 0,
    activeMissions: 0,
    totalMealsTransported: 0,
    totalKgDiverted: 0,
    totalKmTraveled: 0
  });

  // Modals & User Feedback
  const [selectedJobToAccept, setSelectedJobToAccept] = useState(null);
  const [handoverModalJob, setHandoverModalJob] = useState(null);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [targetNextStatus, setTargetNextStatus] = useState('');
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Load All Dashboard Data
  const loadDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setLoadError(null);
    try {
      const [openRes, activeRes, histRes, statsRes] = await Promise.all([
        fetchOpenPickups({ district: selectedDistrict }),
        fetchMyActivePickups(),
        fetchPickupHistory(),
        fetchVolunteerStats()
      ]);

      if (openRes.success) setOpenJobs(openRes.jobs || []);
      if (activeRes.success) setActiveJobs(activeRes.activeJobs || []);
      if (histRes.success) setHistoryJobs(histRes.history || []);
      if (statsRes.success) setStats(statsRes.stats || {});
    } catch (err) {
      console.error('Failed to load volunteer data:', err);
      setLoadError(err.message || 'Could not load pickups.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDistrict]);

  // Handle Accepting a Job
  const handleConfirmAccept = async () => {
    if (!selectedJobToAccept) return;
    setActionLoading(true);
    try {
      const res = await acceptPickupJob(selectedJobToAccept._id);
      if (res.success) {
        showToast('Delivery accepted. The donor has been notified.');
        setSelectedJobToAccept(null);
        setActiveTab('active');
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to accept job', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Advancing Milestone Status
  const handleAdvanceStatus = async (jobId, nextStatus, notes = '') => {
    setActionLoading(true);
    try {
      const res = await updatePickupStatus(jobId, {
        status: nextStatus,
        proofNotes: notes,
        note: notes
      });
      if (res.success) {
        showToast(`Delivery status advanced to: ${nextStatus.replace(/_/g, ' ').toUpperCase()}`);
        setHandoverModalJob(null);
        setHandoverNotes('');
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Status update failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Releasing / Cancelling Accepted Job
  const handleCancelAssignment = async (jobId) => {
    if (!window.confirm('Release this pickup so another volunteer can accept it?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await cancelPickupJob(jobId, 'Released by volunteer');
      if (res.success) {
        showToast('Pickup released. Another volunteer can now accept it.');
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to release job', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const currentActiveJob = activeJobs.length > 0 ? activeJobs[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold text-white ${
              toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
              <Truck size={13} /> Module 4 • Volunteer Logistics
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Community Food Rescue & Transport Network
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Logistics & Deliveries — {user?.name || 'Volunteer Courier'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5">
            <MapPin size={15} className="text-emerald-600 shrink-0" />
            <span>Assigned District: <strong className="text-slate-800">{user?.district || 'Colombo'}</strong></span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {loadError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-sm text-rose-800 shadow-2xs">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex items-center justify-between">
            <span>{loadError}</span>
            <button
              onClick={() => loadDashboardData()}
              className="text-xs font-bold underline hover:text-rose-900 cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Missions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.completedMissions || 0} />
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            Verified Handover Receipts
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Pickups</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Package size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={openJobs.length} />
          </div>
          <p className="mt-1 text-xs font-semibold text-blue-600">
            Awaiting Volunteer Acceptance
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Cargo</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Truck size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={activeJobs.length} />
          </div>
          <p className="mt-1 text-xs font-semibold text-indigo-600">
            {activeJobs.length > 0 ? 'Delivery in Progress' : 'Queue Empty'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Transit Distance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <RouteIcon size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.totalKmTraveled || 0} suffix=" km" />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Estimated Route Travel
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'active'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Truck size={17} />
          <span>Active Deliveries ({activeJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('available')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'available'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Navigation size={17} />
          <span>Available Pickups ({openJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'route'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <MapPin size={17} />
          <span>Route & GPS Estimate</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Calendar size={17} />
          <span>Delivery History ({historyJobs.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE MISSION */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 animate-pulse">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
              <p className="text-sm">Loading active delivery queue...</p>
            </div>
          ) : currentActiveJob ? (
            <div className="space-y-6">
              {/* Mission Progress Pipeline Card */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-800 mb-1.5">
                      Mission #{currentActiveJob._id.slice(-6).toUpperCase()}
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Transport: {currentActiveJob.donation?.foodType || currentActiveJob.wasteRequest?.wasteCategory}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-medium block">Route Estimate</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      ~{currentActiveJob.routeDetails?.transitTimeMinutes ?? '—'} mins ({currentActiveJob.routeDetails?.routeDistanceKm ?? '—'} km)
                    </span>
                  </div>
                </div>

                {/* Status Pipeline Step Indicator */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      key: 'pickup_scheduled',
                      label: '1. Scheduled',
                      sub: 'Assigned to You',
                      icon: Clock,
                      isDone: true,
                      isCurrent: currentActiveJob.statusPipeline === 'pickup_scheduled'
                    },
                    {
                      key: 'picked_up',
                      label: '2. Picked Up',
                      sub: 'Cargo In-Transit',
                      icon: Package,
                      isDone: ['picked_up', 'delivered_or_recycled', 'completed'].includes(currentActiveJob.statusPipeline),
                      isCurrent: currentActiveJob.statusPipeline === 'picked_up'
                    },
                    {
                      key: 'delivered_or_recycled',
                      label: '3. At Facility',
                      sub: 'Handover Completed',
                      icon: Navigation,
                      isDone: ['delivered_or_recycled', 'completed'].includes(currentActiveJob.statusPipeline),
                      isCurrent: currentActiveJob.statusPipeline === 'delivered_or_recycled'
                    },
                    {
                      key: 'completed',
                      label: '4. Confirmed',
                      sub: 'Recipient Closed',
                      icon: CheckCircle,
                      isDone: currentActiveJob.statusPipeline === 'completed',
                      isCurrent: currentActiveJob.statusPipeline === 'completed'
                    }
                  ].map((step) => {
                    const StepIcon = step.icon;
                    return (
                      <div
                        key={step.key}
                        className={`rounded-xl p-3.5 flex flex-col items-center text-center gap-1.5 border transition-all ${
                          step.isCurrent
                            ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/10'
                            : step.isDone
                            ? 'bg-slate-50 border-slate-200'
                            : 'bg-white border-slate-100 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            step.isDone ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        >
                          <StepIcon size={16} />
                        </div>
                        <span className={`text-xs font-bold ${step.isCurrent ? 'text-emerald-950 font-extrabold' : 'text-slate-800'}`}>
                          {step.label}
                        </span>
                        <span className="text-2xs text-slate-500">{step.sub}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Milestone Action Callout */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      Next Step Action
                    </h4>
                    <p className="text-xs text-slate-600">
                      {currentActiveJob.statusPipeline === 'pickup_scheduled' &&
                        'Arrive at donor address, verify cargo packaging, and confirm surplus has been loaded into your vehicle.'}
                      {currentActiveJob.statusPipeline === 'picked_up' &&
                        'Transport cargo to receiving shelter/organization and record delivery handover.'}
                      {currentActiveJob.statusPipeline === 'delivered_or_recycled' &&
                        'Waiting for receiving organization two-party receipt confirmation.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {currentActiveJob.statusPipeline === 'pickup_scheduled' && (
                      <>
                        <button
                          onClick={() => handleCancelAssignment(currentActiveJob._id)}
                          disabled={actionLoading}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Release Job
                        </button>
                        <button
                          onClick={() => handleAdvanceStatus(currentActiveJob._id, 'picked_up', 'Surplus collected from donor')}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Package size={14} />
                          <span>Confirm Surplus Picked Up</span>
                        </button>
                      </>
                    )}

                    {currentActiveJob.statusPipeline === 'picked_up' && (
                      <button
                        onClick={() => {
                          setHandoverModalJob(currentActiveJob);
                          setTargetNextStatus('delivered_or_recycled');
                        }}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Navigation size={14} />
                        <span>Confirm Arrival & Delivery</span>
                      </button>
                    )}

                    {currentActiveJob.statusPipeline === 'delivered_or_recycled' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={13} /> Awaiting Recipient Confirmation
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Waypoint Routing Details (Donor <-> Recipient) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Pick-Up Origin (Donor) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Collect From
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {currentActiveJob.donation?.donor?.name || 'Donor'}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="text-amber-500" />
                      <span>District: {currentActiveJob.routeDetails?.originDistrict}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cargo:</span>
                      <strong className="text-slate-900">{currentActiveJob.donation?.foodType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quantity:</span>
                      <strong className="text-slate-900">{currentActiveJob.donation?.quantity}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Storage:</span>
                      <span className="capitalize font-semibold text-emerald-700">
                        {currentActiveJob.donation?.storageCondition || 'Ambient'}
                      </span>
                    </div>
                  </div>

                  {currentActiveJob.donation?.donor?.contactNumber && (
                    <a
                      href={`tel:${currentActiveJob.donation.donor.contactNumber}`}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Phone size={13} />
                      <span>Call Donor: {currentActiveJob.donation.donor.contactNumber}</span>
                    </a>
                  )}
                </div>

                {/* Deliver To */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Deliver To
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {currentActiveJob.receivingOrganization?.name || 'Receiving Organization'}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="text-emerald-500" />
                      <span>District: {currentActiveJob.routeDetails?.destinationDistrict}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Organization Type:</span>
                      <span className="capitalize font-semibold text-slate-900">
                        {currentActiveJob.receivingOrganization?.type || 'Shelter'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Coordinator:</span>
                      <strong className="text-slate-900">{currentActiveJob.receivingOrganization?.linkedUser?.name || 'Shelter Manager'}</strong>
                    </div>
                  </div>

                  {currentActiveJob.receivingOrganization?.linkedUser?.contactNumber && (
                    <a
                      href={`tel:${currentActiveJob.receivingOrganization.linkedUser.contactNumber}`}
                      className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Phone size={13} />
                      <span>Call Recipient: {currentActiveJob.receivingOrganization.linkedUser.contactNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Truck size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                No active delivery in progress
              </h3>
              <p className="text-sm text-slate-500">
                Browse available pickups to find a food rescue or material collection delivery you can assist with.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
              >
                Browse Available Pickups ({openJobs.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AVAILABLE PICKUPS */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Available Volunteer Pickups
              </h3>
              <p className="text-xs text-slate-500">
                Donations and collections awaiting courier transportation
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d === 'all' ? 'All Districts' : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {openJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {openJobs.map((job) => {
                const isLocal = job.routeDetails?.originDistrict === (user?.district || 'Colombo');
                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden"
                  >
                    <div className="p-5 pb-4 border-b border-slate-100 bg-slate-50/40">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-block px-2.5 py-0.5 rounded text-2xs font-extrabold uppercase mb-1.5 ${
                            isLocal ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {job.routeDetails?.originDistrict}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 leading-snug">
                            {job.donation?.foodType || `${job.wasteRequest?.wasteCategory} Recyclables`}
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-emerald-700 block">
                            {job.routeDetails?.routeDistanceKm} km
                          </span>
                          <span className="text-2xs text-slate-400">
                            ~{job.routeDetails?.transitTimeMinutes} mins
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3 flex-1">
                      <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Portions / Cargo:</span>
                          <strong className="text-slate-900">
                            {job.donation?.quantity || job.wasteRequest?.quantity}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pickup Window:</span>
                          <span className="font-semibold text-amber-700 flex items-center gap-1">
                            <Clock size={12} />
                            {job.donation?.pickupDeadline
                              ? new Date(job.donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Immediate'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Storage:</span>
                          <span className="capitalize font-semibold text-emerald-700">
                            {job.donation?.storageCondition || 'Ambient'}
                          </span>
                        </div>
                      </div>

                      <div className="text-2xs text-slate-500 flex items-center justify-between gap-1 pt-1">
                        <span className="truncate"><strong>From:</strong> {job.donation?.donor?.name || 'Donor'}</span>
                        <ArrowRight size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate"><strong>To:</strong> {job.receivingOrganization?.name || 'Shelter'}</span>
                      </div>
                    </div>

                    <div className="p-4 px-5 border-t border-slate-100 bg-slate-50/30">
                      <button
                        onClick={() => setSelectedJobToAccept(job)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Truck size={14} />
                        <span>Accept Delivery Mission</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <Navigation size={32} className="text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                No pickups available for this filter
              </h3>
              <p className="text-xs text-slate-500">
                Try selecting "All Districts" or check back shortly for new dispatch jobs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROUTE & GPS VIEW */}
      {activeTab === 'route' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs max-w-2xl mx-auto space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Route & Proximity Estimation
            </h3>
            <p className="text-xs text-slate-500">
              Geo-distances and travel times calculated using district logistics centroids.
            </p>
          </div>

          {currentActiveJob ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-2xs font-bold uppercase text-slate-400">Step 1 • Collect</span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {currentActiveJob.donation?.donor?.name || 'Donor'}
                    </h4>
                    <p className="text-xs text-slate-500">District: {currentActiveJob.routeDetails?.originDistrict}</p>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-slate-300 ml-1.5 h-6" />

                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-2xs font-bold uppercase text-slate-400">Step 2 • Deliver</span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {currentActiveJob.receivingOrganization?.name || 'Receiving Organization'}
                    </h4>
                    <p className="text-xs text-slate-500">District: {currentActiveJob.routeDetails?.destinationDistrict}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl bg-emerald-50/70 p-3 border border-emerald-100">
                  <span className="text-2xs font-bold uppercase text-emerald-800">Estimated Distance</span>
                  <div className="text-lg font-extrabold text-emerald-950">
                    {currentActiveJob.routeDetails?.routeDistanceKm ?? '—'} km
                  </div>
                </div>
                <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-100">
                  <span className="text-2xs font-bold uppercase text-blue-800">Estimated Drive</span>
                  <div className="text-lg font-extrabold text-blue-950">
                    {currentActiveJob.routeDetails?.transitTimeMinutes ?? '—'} mins
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              Accept a pickup mission to calculate active route details.
            </p>
          )}
        </div>
      )}

      {/* TAB 4: DELIVERY HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {historyJobs.length > 0 ? (
            historyJobs.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.donation?.foodType || item.wasteRequest?.wasteCategory}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-2xs font-extrabold bg-emerald-100 text-emerald-800">
                      Completed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    From <strong>{item.donation?.donor?.name || 'Donor'}</strong> ({item.routeDetails?.originDistrict}) ──▶ To <strong>{item.receivingOrganization?.name || 'Recipient'}</strong> ({item.routeDetails?.destinationDistrict})
                  </p>
                  {item.proofNotes && (
                    <p className="text-xs text-emerald-700 italic">
                      Handover note: "{item.proofNotes}"
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold text-slate-900">
                    {item.donation?.quantity || item.wasteRequest?.quantity}
                  </div>
                  <span className="text-2xs text-slate-400">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto space-y-4">
              <Calendar size={32} className="text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500">
                Completed delivery missions will be archived here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ACCEPT MISSION CONFIRMATION */}
      <AnimatePresence>
        {selectedJobToAccept && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Truck size={18} className="text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Accept Delivery Mission
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedJobToAccept(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  Accepting this mission assigns the cargo exclusively to you and notifies both donor and recipient shelter.
                </p>

                <div className="bg-slate-50 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cargo:</span>
                    <strong className="text-slate-900">{selectedJobToAccept.donation?.foodType || selectedJobToAccept.wasteRequest?.wasteCategory}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantity:</span>
                    <strong className="text-slate-900">{selectedJobToAccept.donation?.quantity || selectedJobToAccept.wasteRequest?.quantity}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pickup Origin:</span>
                    <strong className="text-slate-900">{selectedJobToAccept.donation?.donor?.name || 'Donor'} ({selectedJobToAccept.routeDetails?.originDistrict})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <strong className="text-slate-900">{selectedJobToAccept.receivingOrganization?.name || 'Shelter'} ({selectedJobToAccept.routeDetails?.destinationDistrict})</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setSelectedJobToAccept(null)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmAccept}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw size={13} className="animate-spin" /> : <Truck size={14} />}
                    <span>Confirm Acceptance</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELIVERY HANDOVER CONFIRMATION */}
      <AnimatePresence>
        {handoverModalJob && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Navigation size={18} className="text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Confirm Delivery Arrival
                  </h3>
                </div>
                <button
                  onClick={() => setHandoverModalJob(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  Delivered cargo to <strong>{handoverModalJob.receivingOrganization?.name}</strong>. Add proof / receiver notes below.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Handover Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Received by coordinator at front desk. Food temperature intact."
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setHandoverModalJob(null)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAdvanceStatus(handoverModalJob._id, targetNextStatus, handoverNotes)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {actionLoading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={14} />}
                    <span>Confirm Handover</span>
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
