import React, { useState, useEffect } from 'react';
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

export default function VolunteerDashboard() {
  const { user } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'available' | 'route' | 'history'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
      console.error('Failed to load courier data:', err);
      showToast(err.message || 'Error updating courier dispatch feeds', 'error');
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
        showToast('Mission accepted! Route assigned and donor notified.');
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
    if (!window.confirm('Are you sure you want to release this assignment back to the open dispatch board?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await cancelPickupJob(jobId, 'Courier emergency re-allocation');
      if (res.success) {
        showToast('Mission assignment released. Job returned to open board.');
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to release job', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Primary active job (first in queue)
  const currentActiveJob = activeJobs.length > 0 ? activeJobs[0] : null;

  // Sri Lanka Districts
  const districts = [
    'all',
    'Colombo',
    'Gampaha',
    'Kalutara',
    'Kandy',
    'Matale',
    'Nuwara Eliya',
    'Galle',
    'Matara',
    'Hambantota',
    'Jaffna',
    'Kilinochchi',
    'Mannar',
    'Vavuniya',
    'Mullaitivu',
    'Batticaloa',
    'Ampara',
    'Trincomalee',
    'Kurunegala',
    'Puttalam',
    'Anuradhapura',
    'Polonnaruwa',
    'Badulla',
    'Monaragala',
    'Ratnapura',
    'Kegalle'
  ];

  return (
    <div className="main-content">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'error' ? '#ef4444' : '#059669',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            fontWeight: '600',
            animation: 'slideIn 0.2s ease-out'
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Courier Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge volunteer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Truck size={13} /> Community Courier & Last-Mile Fleet
            </span>
            <span className="badge verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} /> Active Cold-Chain Courier
            </span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Courier Hub — {user?.name || 'Volunteer Courier'}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b' }}>
            Assigned Operating District: <strong style={{ color: '#0f172a' }}>{user?.district || 'Colombo'}</strong> • Status: Available for Immediate Dispatch
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh Dispatches'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
              Completed Missions
            </span>
            <Award size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            {stats.completedMissions || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={12} /> 100% On-Time Delivery Record
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #059669' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
              Meals Transported
            </span>
            <Package size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            {stats.totalMealsTransported || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Safe cold-chain transfers to shelters
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
              Active Runs
            </span>
            <Truck size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            {activeJobs.length}
          </div>
          <div style={{ fontSize: '12px', color: activeJobs.length > 0 ? '#0284c7' : '#64748b', marginTop: '4px' }}>
            {activeJobs.length > 0 ? 'Live in-progress rescue active' : 'Ready for next mission'}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
              Transit Distance
            </span>
            <RouteIcon size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            {stats.totalKmTraveled || 0} <span style={{ fontSize: '16px', fontWeight: '600', color: '#64748b' }}>km</span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {stats.totalKgDiverted || 0} kg materials diverted
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e2e8f0',
          gap: '8px',
          marginBottom: '24px',
          overflowX: 'auto'
        }}
      >
        <button
          onClick={() => setActiveTab('active')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'active' ? '#7c3aed' : '#64748b',
            borderBottom: activeTab === 'active' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Truck size={16} />
          <span>Active Mission ({activeJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('available')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'available' ? '#7c3aed' : '#64748b',
            borderBottom: activeTab === 'available' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Navigation size={16} />
          <span>Available Missions ({openJobs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('route')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'route' ? '#7c3aed' : '#64748b',
            borderBottom: activeTab === 'route' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <MapPin size={16} />
          <span>Route & GPS Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '10px 18px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: activeTab === 'history' ? '#7c3aed' : '#64748b',
            borderBottom: activeTab === 'history' ? '2.5px solid #7c3aed' : '2.5px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          <Calendar size={16} />
          <span>Mission History ({historyJobs.length})</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: ACTIVE MISSION                                        */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'active' && (
        <div>
          {currentActiveJob ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Mission Progress Pipeline Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <span className="badge volunteer" style={{ marginBottom: '4px' }}>
                      Mission #{currentActiveJob._id.slice(-6).toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                      Active Rescue: {currentActiveJob.donation?.foodType || currentActiveJob.wasteRequest?.wasteCategory}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Estimated Transit</span>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#7c3aed' }}>
                      ~{currentActiveJob.routeDetails?.transitTimeMinutes || 20} mins ({currentActiveJob.routeDetails?.routeDistanceKm || 3.5} km)
                    </div>
                  </div>
                </div>

                {/* Status Pipeline Step Indicator */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    position: 'relative',
                    marginBottom: '28px',
                    marginTop: '12px'
                  }}
                >
                  {[
                    {
                      key: 'pickup_scheduled',
                      label: '1. Scheduled',
                      sub: 'Courier Dispatched',
                      icon: Clock,
                      isDone: true,
                      isCurrent: currentActiveJob.statusPipeline === 'pickup_scheduled'
                    },
                    {
                      key: 'picked_up',
                      label: '2. Picked Up',
                      sub: 'Food Collected',
                      icon: Package,
                      isDone: ['picked_up', 'delivered_or_recycled', 'completed'].includes(currentActiveJob.statusPipeline),
                      isCurrent: currentActiveJob.statusPipeline === 'picked_up'
                    },
                    {
                      key: 'delivered_or_recycled',
                      label: '3. At Facility',
                      sub: 'Delivered to Shelter',
                      icon: Navigation,
                      isDone: ['delivered_or_recycled', 'completed'].includes(currentActiveJob.statusPipeline),
                      isCurrent: currentActiveJob.statusPipeline === 'delivered_or_recycled'
                    },
                    {
                      key: 'completed',
                      label: '4. Verified',
                      sub: 'Custody Closed',
                      icon: CheckCircle,
                      isDone: currentActiveJob.statusPipeline === 'completed',
                      isCurrent: currentActiveJob.statusPipeline === 'completed'
                    }
                  ].map((step, idx) => {
                    const StepIcon = step.icon;
                    const activeColor = step.isDone ? '#059669' : '#cbd5e1';
                    return (
                      <div
                        key={step.key}
                        style={{
                          backgroundColor: step.isCurrent ? '#f5f3ff' : '#f8fafc',
                          border: step.isCurrent ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '14px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          textAlign: 'center',
                          gap: '6px'
                        }}
                      >
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: step.isDone ? '#10b981' : '#e2e8f0',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <StepIcon size={16} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: step.isCurrent ? '#7c3aed' : '#0f172a' }}>
                          {step.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{step.sub}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Milestone Action Buttons */}
                <div
                  style={{
                    backgroundColor: '#faf5ff',
                    border: '1px dashed #d8b4fe',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#581c87' }}>
                      Milestone Action Required:
                    </h4>
                    <p style={{ fontSize: '13px', color: '#6b21a8' }}>
                      {currentActiveJob.statusPipeline === 'pickup_scheduled' &&
                        'Arrive at donor location, verify packaging integrity, and confirm collection.'}
                      {currentActiveJob.statusPipeline === 'picked_up' &&
                        'Navigate to recipient destination and handover surplus batch.'}
                      {currentActiveJob.statusPipeline === 'delivered_or_recycled' &&
                        'Sign-off on delivery receipt and officially complete rescue mission.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {currentActiveJob.statusPipeline === 'pickup_scheduled' && (
                      <>
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleCancelAssignment(currentActiveJob._id)}
                          disabled={actionLoading}
                          style={{ fontSize: '13px' }}
                        >
                          Release Job
                        </button>
                        <button
                          className="btn btn-primary"
                          style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                          onClick={() => handleAdvanceStatus(currentActiveJob._id, 'picked_up', 'Surplus collected from kitchen')}
                          disabled={actionLoading}
                        >
                          <Package size={15} />
                          <span>Confirm Surplus Picked Up</span>
                        </button>
                      </>
                    )}

                    {currentActiveJob.statusPipeline === 'picked_up' && (
                      <button
                        className="btn btn-primary"
                        style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                        onClick={() => {
                          setHandoverModalJob(currentActiveJob);
                          setTargetNextStatus('delivered_or_recycled');
                        }}
                        disabled={actionLoading}
                      >
                        <Navigation size={15} />
                        <span>Confirm Arrival & Delivery</span>
                      </button>
                    )}

                    {currentActiveJob.statusPipeline === 'delivered_or_recycled' && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleAdvanceStatus(currentActiveJob._id, 'completed', 'Final handover confirmed')}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={15} />
                        <span>Complete Mission & Verify Handover</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Waypoint Routing Details (Donor <-> Recipient) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Pick-Up Origin (Donor) */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
                      Pick-Up Point (Donor Premises)
                    </span>
                  </div>

                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    {currentActiveJob.donation?.donor?.name || 'Commercial Donor'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                    <MapPin size={14} color="#f59e0b" />
                    <span>District: {currentActiveJob.routeDetails?.originDistrict}</span>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', fontSize: '13px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Cargo:</span>
                      <strong style={{ color: '#0f172a' }}>{currentActiveJob.donation?.foodType}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Quantity:</span>
                      <strong style={{ color: '#0f172a' }}>{currentActiveJob.donation?.quantity}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Storage Condition:</span>
                      <span className="badge verified" style={{ textTransform: 'capitalize' }}>
                        <Thermometer size={11} /> {currentActiveJob.donation?.storageCondition || 'refrigerated'}
                      </span>
                    </div>
                  </div>

                  {currentActiveJob.donation?.specialInstructions && (
                    <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '10px', fontSize: '12.5px', color: '#92400e', marginBottom: '16px' }}>
                      <strong>Driver Note:</strong> {currentActiveJob.donation.specialInstructions}
                    </div>
                  )}

                  {currentActiveJob.donation?.donor?.contactNumber && (
                    <a
                      href={`tel:${currentActiveJob.donation.donor.contactNumber}`}
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Phone size={14} />
                      <span>Call Donor: {currentActiveJob.donation.donor.contactNumber}</span>
                    </a>
                  )}
                </div>

                {/* Drop-Off Destination (Recipient Shelter) */}
                <div className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#059669' }} />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857', textTransform: 'uppercase' }}>
                      Drop-Off Destination (Recipient Shelter)
                    </span>
                  </div>

                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>
                    {currentActiveJob.receivingOrganization?.name || 'Verified Shelter'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#64748b', marginBottom: '14px' }}>
                    <MapPin size={14} color="#059669" />
                    <span>District: {currentActiveJob.routeDetails?.destinationDistrict}</span>
                  </div>

                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', fontSize: '13px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Organization Type:</span>
                      <span className="badge recipient" style={{ textTransform: 'capitalize' }}>
                        {currentActiveJob.receivingOrganization?.type || 'Shelter'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: '#64748b' }}>Registration Number:</span>
                      <strong style={{ color: '#0f172a' }}>{currentActiveJob.receivingOrganization?.registrationInfo || 'NGO-VERIFIED'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Contact Coordinator:</span>
                      <strong style={{ color: '#0f172a' }}>{currentActiveJob.receivingOrganization?.linkedUser?.name || 'Shelter Manager'}</strong>
                    </div>
                  </div>

                  {currentActiveJob.receivingOrganization?.linkedUser?.contactNumber && (
                    <a
                      href={`tel:${currentActiveJob.receivingOrganization.linkedUser.contactNumber}`}
                      className="btn btn-secondary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <Phone size={14} />
                      <span>Call Shelter: {currentActiveJob.receivingOrganization.linkedUser.contactNumber}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <Truck size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                No Active Delivery in Progress
              </h3>
              <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '460px', margin: '0 auto 20px' }}>
                You are currently free and available for courier dispatch. Browse the open rescue missions board and accept a nearby delivery.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('available')}>
                <Navigation size={16} />
                <span>Browse Available Missions ({openJobs.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: AVAILABLE MISSIONS FEED                               */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'available' && (
        <div>
          {/* Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}
          >
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Open Dispatch Missions
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b' }}>
                Claimed surplus batches awaiting volunteer transportation
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Filter District:</span>
              <select
                className="input-select"
                style={{ width: '180px', padding: '6px 12px', fontSize: '13px' }}
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'all' ? 'All Districts' : d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {openJobs.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {openJobs.map((job) => {
                const isLocal = job.routeDetails?.originDistrict === (user?.district || 'Colombo');
                return (
                  <div
                    key={job._id}
                    className="card"
                    style={{
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isLocal ? '2px solid #ddd6fe' : '1px solid #e2e8f0',
                      boxShadow: isLocal ? '0 4px 15px -2px rgba(124, 58, 237, 0.08)' : 'none'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          {isLocal ? (
                            <span className="badge volunteer" style={{ marginBottom: '6px' }}>
                              ⚡ Nearby in {job.routeDetails?.originDistrict}
                            </span>
                          ) : (
                            <span className="badge pending" style={{ marginBottom: '6px' }}>
                              {job.routeDetails?.originDistrict}
                            </span>
                          )}
                          <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                            {job.donation?.foodType || `${job.wasteRequest?.wasteCategory} Recyclables`}
                          </h4>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed' }}>
                            {job.routeDetails?.routeDistanceKm} km
                          </span>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            ~{job.routeDetails?.transitTimeMinutes} mins
                          </div>
                        </div>
                      </div>

                      {/* Cargo Quantities */}
                      <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '12px', marginBottom: '14px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Portion / Weight:</span>
                          <strong style={{ color: '#0f172a' }}>
                            {job.donation?.quantity || job.wasteRequest?.quantity} ({job.metrics?.meals} meals)
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Pick-up Deadline:</span>
                          <span style={{ color: '#b45309', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            {job.donation?.pickupDeadline
                              ? new Date(job.donation.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Immediate'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Storage:</span>
                          <span style={{ textTransform: 'capitalize', color: '#059669', fontWeight: '600' }}>
                            {job.donation?.storageCondition || 'ambient'}
                          </span>
                        </div>
                      </div>

                      {/* Route Path Indicator */}
                      <div style={{ fontSize: '12.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#64748b' }}>From: </span>
                          <strong style={{ color: '#0f172a' }}>{job.donation?.donor?.name || 'Commercial Donor'}</strong>
                        </div>
                        <ArrowRight size={14} color="#94a3b8" />
                        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: '#64748b' }}>To: </span>
                          <strong style={{ color: '#0f172a' }}>{job.receivingOrganization?.name || 'Recipient Shelter'}</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', justifyContent: 'center', backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                      onClick={() => setSelectedJobToAccept(job)}
                    >
                      <Truck size={15} />
                      <span>Accept Delivery Mission</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Navigation size={40} color="#cbd5e1" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '6px' }}>
                No Open Missions in This Filter
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b', maxWidth: '420px', margin: '0 auto' }}>
                All claimed surplus food batches in this district currently have couriers assigned. Try selecting "All Districts" or check back shortly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: ROUTE & GPS VIEW                                      */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'route' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
                Interactive Route & GPS Telemetry
              </h3>
              <p style={{ fontSize: '13.5px', color: '#64748b' }}>
                Live waypoint navigation connecting donor kitchens, in-transit couriers, and recipient shelters.
              </p>
            </div>

            {currentActiveJob && (
              <span className="badge verified" style={{ padding: '6px 12px' }}>
                <Navigation size={13} /> Active GPS Stream Active
              </span>
            )}
          </div>

          {currentActiveJob ? (
            <div>
              {/* Modern Visual Map Schematic Component */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '16px',
                  padding: '36px 24px',
                  color: '#ffffff',
                  marginBottom: '24px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Visual Route SVG Path */}
                <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    {/* Waypoint 1: Donor */}
                    <div style={{ textAlign: 'center', width: '180px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#f59e0b',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                          boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)'
                        }}
                      >
                        <MapPin size={24} />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>
                        {currentActiveJob.routeDetails?.originDistrict}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {currentActiveJob.donation?.donor?.name || 'Donor Location'}
                      </div>
                    </div>

                    {/* Midpoint: Courier Truck */}
                    <div style={{ textAlign: 'center', width: '180px' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          backgroundColor: '#7c3aed',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                          boxShadow: '0 0 25px rgba(124, 58, 237, 0.7)',
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        <Truck size={26} />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#a78bfa' }}>
                        {currentActiveJob.statusPipeline.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        ~{currentActiveJob.routeDetails?.transitTimeMinutes} mins remaining
                      </div>
                    </div>

                    {/* Waypoint 3: Shelter */}
                    <div style={{ textAlign: 'center', width: '180px' }}>
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                          boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
                        }}
                      >
                        <CheckCircle size={24} />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700' }}>
                        {currentActiveJob.routeDetails?.destinationDistrict}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {currentActiveJob.receivingOrganization?.name || 'Recipient Shelter'}
                      </div>
                    </div>
                  </div>

                  {/* Connecting Line */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '24px',
                      left: '90px',
                      right: '90px',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      zIndex: 1
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: '#7c3aed',
                        width: currentActiveJob.statusPipeline === 'pickup_scheduled' ? '25%' : currentActiveJob.statusPipeline === 'picked_up' ? '65%' : '100%',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Waypoint Coordinates & Distance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Origin Coordinates</span>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    {currentActiveJob.routeDetails?.originCoords?.lat}° N, {currentActiveJob.routeDetails?.originCoords?.lng}° E
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {currentActiveJob.routeDetails?.originDistrict} District Center
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Destination Coordinates</span>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                    {currentActiveJob.routeDetails?.destinationCoords?.lat}° N, {currentActiveJob.routeDetails?.destinationCoords?.lng}° E
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {currentActiveJob.routeDetails?.destinationDistrict} District Center
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Route Length</span>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#7c3aed' }}>
                    {currentActiveJob.routeDetails?.routeDistanceKm} km
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Road Curvature Factor: 1.25x applied
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RouteIcon size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                No active delivery in progress to map. Accept a mission from the "Available Missions" tab to view real-time turn-by-turn routing.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: MISSION HISTORY                                       */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'history' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#0f172a' }}>
              Verified Rescue Mission History
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Audit-ready log of completed transfers, timestamps, and recipient receipts.
            </p>
          </div>

          {historyJobs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {historyJobs.map((item) => (
                <div
                  key={item._id}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge verified" style={{ fontSize: '11px' }}>
                        <CheckCircle size={11} /> Completed
                      </span>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                        {item.donation?.foodType || item.wasteRequest?.wasteCategory}
                      </strong>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                      From <strong>{item.donation?.donor?.name || 'Donor'}</strong> ({item.routeDetails?.originDistrict}) ──▶ To <strong>{item.receivingOrganization?.name || 'Recipient'}</strong> ({item.routeDetails?.destinationDistrict})
                    </div>

                    {item.proofNotes && (
                      <div style={{ fontSize: '12px', color: '#047857', marginTop: '4px', fontStyle: 'italic' }}>
                        Handover Note: "{item.proofNotes}"
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                      {item.donation?.quantity || item.wasteRequest?.quantity}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {new Date(item.updatedAt).toLocaleDateString()} at {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <Calendar size={36} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                No completed missions recorded yet. Accept and complete delivery runs to build your certified rescue portfolio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ACCEPT MISSION CONFIRMATION                            */}
      {/* ------------------------------------------------------------- */}
      {selectedJobToAccept && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              borderRadius: '16px',
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Accept Delivery Mission
                </h3>
              </div>
              <button
                onClick={() => setSelectedJobToAccept(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
              You are about to accept the following food rescue route. Once confirmed, the donor and recipient will be notified of your dispatch.
            </p>

            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Cargo:</span>
                <strong style={{ color: '#0f172a' }}>{selectedJobToAccept.donation?.foodType || selectedJobToAccept.wasteRequest?.wasteCategory}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Quantity:</span>
                <strong style={{ color: '#0f172a' }}>{selectedJobToAccept.donation?.quantity || selectedJobToAccept.wasteRequest?.quantity}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748b' }}>Pickup From:</span>
                <strong style={{ color: '#0f172a' }}>{selectedJobToAccept.donation?.donor?.name || 'Donor'} ({selectedJobToAccept.routeDetails?.originDistrict})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Deliver To:</span>
                <strong style={{ color: '#0f172a' }}>{selectedJobToAccept.receivingOrganization?.name || 'Shelter'} ({selectedJobToAccept.routeDetails?.destinationDistrict})</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedJobToAccept(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
                onClick={handleConfirmAccept}
                disabled={actionLoading}
              >
                {actionLoading ? 'Assigning...' : 'Confirm & Start Mission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DELIVERY HANDOVER & RECEIPT CONFIRMATION                */}
      {/* ------------------------------------------------------------- */}
      {handoverModalJob && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              borderRadius: '16px',
              animation: 'scaleIn 0.2s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Navigation size={20} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Confirm Shelter Delivery Handover
                </h3>
              </div>
              <button
                onClick={() => setHandoverModalJob(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px' }}>
              Deliver surplus batch to <strong>{handoverModalJob.receivingOrganization?.name}</strong>. Add any receiver remarks or custody notes below.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                Handover / Receiver Notes:
              </label>
              <textarea
                className="input-textarea"
                rows={3}
                placeholder="e.g. Received by Sister Nirmala at front gate, food warm and packaging verified intact."
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                style={{ width: '100%', padding: '10px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setHandoverModalJob(null)} disabled={actionLoading}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleAdvanceStatus(handoverModalJob._id, targetNextStatus, handoverNotes)}
                disabled={actionLoading}
              >
                {actionLoading ? 'Recording...' : 'Confirm Delivery Handover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
