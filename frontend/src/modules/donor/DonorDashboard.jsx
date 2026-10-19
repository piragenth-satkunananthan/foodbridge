import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Utensils, PlusCircle, History, Clock, MapPin, Package, 
  Search, Filter, Eye, Edit3, Trash2, CheckCircle2, 
  AlertCircle, Recycle, Sparkles, RefreshCw, XCircle 
} from 'lucide-react';
import { 
  fetchDonorStats, fetchDonations, fetchWasteRequests, 
  cancelDonation, cancelWasteRequest 
} from '../../api/client';
import NewSurplusModal from './NewSurplusModal';
import DonationDetailsModal from './DonationDetailsModal';
import EditDonationModal from './EditDonationModal';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('postings'); // 'postings' | 'waste' | 'history'
  
  // Data states
  const [stats, setStats] = useState({
    activeDonations: 0,
    activeWasteRequests: 0,
    completedDonations: 0,
    estimatedMeals: 0,
    totalDonations: 0
  });
  const [donations, setDonations] = useState([]);
  const [wasteRequests, setWasteRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [statusFilter, search]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, donationsRes, wasteRes] = await Promise.all([
        fetchDonorStats().catch(() => ({})),
        fetchDonations({ 
          status: statusFilter, 
          search: search || undefined 
        }).catch(() => ({ donations: [] })),
        fetchWasteRequests().catch(() => ({ wasteRequests: [] }))
      ]);

      if (statsRes && typeof statsRes.activeDonations === 'number') {
        setStats(statsRes);
      }
      setDonations(donationsRes?.donations || []);
      setWasteRequests(wasteRes?.wasteRequests || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading donor dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleOpenDetails = (id) => {
    setSelectedDonationId(id);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (donation) => {
    setEditingDonation(donation);
    setIsEditOpen(true);
  };

  const handleCancelDonation = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this food donation?')) return;
    try {
      await cancelDonation(id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error cancelling donation');
    }
  };

  const handleCancelWaste = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this waste request?')) return;
    try {
      await cancelWasteRequest(id);
      loadAllData();
    } catch (err) {
      alert(err.message || 'Error cancelling waste request');
    }
  };

  // Status badge styling helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'posted':
        return <span className="badge amber" style={{ fontSize: '11.5px' }}>🟡 Posted / Searching NGO</span>;
      case 'matched':
        return <span className="badge blue" style={{ fontSize: '11.5px' }}>🔵 Matched to Recipient</span>;
      case 'pickup_scheduled':
        return <span className="badge blue" style={{ fontSize: '11.5px' }}>🚚 Volunteer Dispatched</span>;
      case 'picked_up':
        return <span className="badge" style={{ background: '#ede9fe', color: '#6d28d9', fontSize: '11.5px' }}>📦 In Transit</span>;
      case 'delivered':
      case 'completed':
      case 'recycled':
        return <span className="badge green" style={{ fontSize: '11.5px' }}>✅ Completed / Delivered</span>;
      case 'cancelled':
        return <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontSize: '11.5px' }}>❌ Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  // Filter donations for History tab (only delivered/completed or cancelled)
  const historyDonations = donations.filter(d => ['delivered', 'completed', 'cancelled'].includes(d.status));
  // Active donations for main tab
  const activeDonationsList = statusFilter === 'all' 
    ? donations.filter(d => ['posted', 'matched', 'pickup_scheduled', 'picked_up'].includes(d.status))
    : donations;

  return (
    <div className="main-content">
      {/* Top Welcome & Action Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '24px', flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge donor">Donor Operations Hub • Commercial & Retail</span>
            <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={13} /> {user?.district || 'Colombo'}, Sri Lanka
            </span>
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a' }}>
            {user?.name || 'Food Donor Portal'}
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Register surplus edible food or recyclable waste for automatic classification and district-based routing.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button" 
            onClick={loadAllData} 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh data"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setIsNewModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.3)' }}
          >
            <PlusCircle size={18} />
            <span style={{ fontWeight: '700' }}>Post New Surplus</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="kpi-grid" style={{ marginBottom: '28px' }}>
        <div className="kpi-card green">
          <div className="kpi-icon green"><Utensils size={22} /></div>
          <div className="kpi-details">
            <h3>Active Food Donations</h3>
            <div className="kpi-value">{stats.activeDonations}</div>
            <div className="kpi-sub">Ready for NGO matching & pickup</div>
          </div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-icon blue"><Recycle size={22} /></div>
          <div className="kpi-details">
            <h3>Waste Collection Requests</h3>
            <div className="kpi-value">{stats.activeWasteRequests || wasteRequests.filter(w => w.status === 'posted').length}</div>
            <div className="kpi-sub">Organic & recyclable streams</div>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-icon amber"><History size={22} /></div>
          <div className="kpi-details">
            <h3>Estimated Meals Rescued</h3>
            <div className="kpi-value">{stats.estimatedMeals}</div>
            <div className="kpi-sub">Diverted to local charities & shelters</div>
          </div>
        </div>

        <div className="kpi-card purple">
          <div className="kpi-icon purple"><CheckCircle2 size={22} /></div>
          <div className="kpi-details">
            <h3>Completed Rescues</h3>
            <div className="kpi-value">{stats.completedDonations}</div>
            <div className="kpi-sub">Verified safe food deliveries</div>
          </div>
        </div>
      </div>

      {/* Main Tabbed Navigation Container */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '14px', background: '#ffffff'
        }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'postings' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('postings')}
              style={{ fontSize: '13.5px', padding: '8px 16px' }}
            >
              🥗 Active Food Donations ({activeDonationsList.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'waste' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('waste')}
              style={{ fontSize: '13.5px', padding: '8px 16px' }}
            >
              ♻️ Waste Collection Requests ({wasteRequests.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('history')}
              style={{ fontSize: '13.5px', padding: '8px 16px' }}
            >
              📜 Donation History & Impact ({historyDonations.length})
            </button>
          </div>

          {/* Search & Filter Controls */}
          {activeTab === 'postings' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Search food type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '13px', width: '200px'
                  }}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '13px', color: '#334155'
                }}
              >
                <option value="all">All Active Statuses</option>
                <option value="posted">Posted (Unmatched)</option>
                <option value="matched">Matched to NGO</option>
                <option value="pickup_scheduled">Pickup Scheduled</option>
                <option value="picked_up">In Transit</option>
              </select>
            </div>
          )}
        </div>


        {/* TAB 1: ACTIVE FOOD DONATIONS */}
        {activeTab === 'postings' && (
          <div style={{ padding: '20px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Loading your food surplus postings...
              </div>
            ) : activeDonationsList.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Utensils size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  No Active Food Donations
                </h3>
                <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto 20px' }}>
                  You have no pending food surplus postings. Create a post whenever your kitchen has extra prepared meals or fresh produce!
                </p>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => setIsNewModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <PlusCircle size={16} />
                  <span>Create First Surplus Post</span>
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Food Surplus Details</th>
                      <th>Quantity</th>
                      <th>Storage Condition</th>
                      <th>Pickup Deadline</th>
                      <th>Lifecycle Status</th>
                      <th>Matched Recipient</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDonationsList.map((d) => (
                      <tr key={d._id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(d._id)}>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '14px' }}>
                            {d.foodType}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> Prepared {new Date(d.preparedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {d.district}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{d.quantity}</span>
                        </td>
                        <td>
                          <span className="badge" style={{ textTransform: 'capitalize', fontSize: '11.5px' }}>
                            {d.storageCondition?.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#dc2626' }}>
                            {new Date(d.pickupDeadline).toLocaleDateString()} {new Date(d.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td>
                          {renderStatusBadge(d.status)}
                        </td>
                        <td>
                          {d.matchedRecipient ? (
                            <span className="badge green" style={{ fontSize: '11.5px' }}>
                              {d.matchedRecipient.name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Matching algorithm searching...
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(d._id)}
                              className="btn-icon"
                              title="View Full Tracking & Timeline"
                              style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}
                            >
                              <Eye size={15} color="#334155" />
                            </button>

                            {d.status === 'posted' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(d)}
                                  className="btn-icon"
                                  title="Edit Posting Details"
                                  style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}
                                >
                                  <Edit3 size={15} color="#0284c7" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCancelDonation(d._id, e)}
                                  className="btn-icon"
                                  title="Cancel Posting"
                                  style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px', borderRadius: '6px' }}
                                >
                                  <Trash2 size={15} color="#dc2626" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WASTE COLLECTION REQUESTS */}
        {activeTab === 'waste' && (
          <div style={{ padding: '20px' }}>
            {wasteRequests.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Recycle size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  No Waste Collection Requests
                </h3>
                <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto 20px' }}>
                  Post recyclable packaging or organic kitchen food scraps to be picked up by certified recycling facilities or composting plants.
                </p>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => setIsNewModalOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0284c7' }}
                >
                  <PlusCircle size={16} />
                  <span>Post Waste for Collection</span>
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Material Stream</th>
                      <th>Quantity</th>
                      <th>District</th>
                      <th>Pickup Deadline</th>
                      <th>Status</th>
                      <th>Matched Collector</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wasteRequests.map((w) => (
                      <tr key={w._id}>
                        <td>
                          <div style={{ fontWeight: '700', textTransform: 'capitalize', color: '#0f172a' }}>
                            {w.wasteCategory} Waste
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                            Created: {new Date(w.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <strong>{w.quantity}</strong>
                        </td>
                        <td>{w.district}</td>
                        <td>
                          <div style={{ fontSize: '12.5px', color: '#dc2626', fontWeight: '600' }}>
                            {new Date(w.pickupDeadline).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          {renderStatusBadge(w.status)}
                        </td>
                        <td>
                          {w.matchedCollector ? (
                            <span className="badge blue">{w.matchedCollector.name}</span>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                              Awaiting recycler match...
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {w.status === 'posted' && (
                            <button
                              type="button"
                              onClick={(e) => handleCancelWaste(w._id, e)}
                              className="btn-icon"
                              title="Cancel Request"
                              style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px', borderRadius: '6px' }}
                            >
                              <Trash2 size={15} color="#dc2626" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DONATION HISTORY & IMPACT */}
        {activeTab === 'history' && (
          <div style={{ padding: '20px' }}>
            {historyDonations.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <History size={44} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                  No Past Donation History Yet
                </h3>
                <p style={{ color: '#64748b', fontSize: '13.5px', maxWidth: '440px', margin: '0 auto' }}>
                  Delivered donations and cancelled postings will be archived here for reporting and audit verification.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Quantity</th>
                      <th>Date Completed</th>
                      <th>Outcome Status</th>
                      <th>Receiving Partner</th>
                      <th style={{ textAlign: 'right' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyDonations.map((d) => (
                      <tr key={d._id} onClick={() => handleOpenDetails(d._id)} style={{ cursor: 'pointer' }}>
                        <td>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{d.foodType}</div>
                          <div style={{ fontSize: '11.5px', color: '#64748b' }}>{d.district}</div>
                        </td>
                        <td><strong>{d.quantity}</strong></td>
                        <td>{new Date(d.updatedAt || d.createdAt).toLocaleDateString()}</td>
                        <td>{renderStatusBadge(d.status)}</td>
                        <td>
                          {d.matchedRecipient ? (
                            <span className="badge green">{d.matchedRecipient.name}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(d._id)}
                            className="btn-icon"
                            style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '6px' }}
                          >
                            <Eye size={15} color="#334155" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guided Multi-Step Surplus Post Modal */}
      <NewSurplusModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={loadAllData}
        userDistrict={user?.district}
      />

      {/* Donation Details & Lifecycle Tracking Modal */}
      <DonationDetailsModal 
        donationId={selectedDonationId}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onUpdated={loadAllData}
        onEdit={(d) => handleOpenEdit(d)}
      />

      {/* Edit Donation Modal */}
      <EditDonationModal 
        donation={editingDonation}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingDonation(null);
        }}
        onUpdated={loadAllData}
      />
    </div>
  );
}
