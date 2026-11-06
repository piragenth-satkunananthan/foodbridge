import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import {
  Utensils, PlusCircle, History, Clock, MapPin, Package,
  Search, Filter, Eye, Edit3, Trash2, CheckCircle2,
  AlertCircle, Recycle, Sparkles, RefreshCw, XCircle, ArrowRight
} from 'lucide-react';
import {
  fetchDonorStats, fetchDonations, fetchWasteRequests,
  cancelDonation, cancelWasteRequest
} from '../../api/client';
import NewSurplusModal from './NewSurplusModal';
import DonationDetailsModal from './DonationDetailsModal';
import EditDonationModal from './EditDonationModal';
import AnimatedCounter from '../../components/AnimatedCounter';

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
        fetchDonorStats(),
        fetchDonations({
          status: statusFilter,
          search: search || ''
        }),
        fetchWasteRequests()
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

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'posted':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-amber-100 text-amber-800">Posted</span>;
      case 'matched':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-blue-100 text-blue-800">Matched</span>;
      case 'pickup_scheduled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-indigo-100 text-indigo-800">Courier Assigned</span>;
      case 'picked_up':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-purple-100 text-purple-800">In Transit</span>;
      case 'delivered':
      case 'completed':
      case 'recycled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold uppercase bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const historyDonations = donations.filter(d => ['delivered', 'completed', 'cancelled', 'expired'].includes(d.status));
  const activeDonationsList = statusFilter === 'all'
    ? donations.filter(d => ['posted', 'matched', 'pickup_scheduled', 'picked_up'].includes(d.status))
    : donations;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800">
              <Utensils size={13} /> Module 1 • Donor Surplus Portal
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <MapPin size={13} className="text-emerald-600" /> {user?.district || 'Colombo'}, Sri Lanka
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {user?.name || 'Commercial Donor Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Publish edible food surplus or organic waste batches and track automated redistribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadAllData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>Post Surplus</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-sm text-rose-800 shadow-2xs">
          <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadAllData}
              className="text-xs font-bold underline hover:text-rose-900 cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Food Donations</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Utensils size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.activeDonations} />
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            Live in matching engine
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Waste Requests</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Recycle size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.activeWasteRequests || wasteRequests.filter(w => w.status === 'posted').length} />
          </div>
          <p className="mt-1 text-xs font-semibold text-sky-600">
            Recyclable & organic streams
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Portions Rescued</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <History size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.estimatedMeals} />
          </div>
          <p className="mt-1 text-xs font-semibold text-amber-600">
            Beneficiary meals delivered
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Rescues</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            <AnimatedCounter value={stats.completedDonations} />
          </div>
          <p className="mt-1 text-xs font-semibold text-purple-600">
            Fully delivered & closed
          </p>
        </div>
      </div>

      {/* Main Tabbed Navigation Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('postings')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'postings'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Active Food Donations ({activeDonationsList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('waste')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'waste'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Waste Requests ({wasteRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Donation History ({historyDonations.length})
            </button>
          </div>

          {/* Search & Status Filter */}
          {activeTab === 'postings' && (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search food type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-44 sm:w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Active</option>
                <option value="posted">Posted</option>
                <option value="matched">Matched</option>
                <option value="pickup_scheduled">Scheduled</option>
                <option value="picked_up">In Transit</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: ACTIVE FOOD DONATIONS */}
        {activeTab === 'postings' && (
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">
                <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-slate-400" />
                <p className="text-sm">Loading your food surplus postings...</p>
              </div>
            ) : activeDonationsList.length === 0 ? (
              <div className="p-12 text-center max-w-md mx-auto space-y-4">
                <Utensils size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  No active surplus postings
                </h3>
                <p className="text-xs text-slate-500">
                  You have no pending surplus items in the matching pool. Create a new posting when extra food becomes available.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Post Surplus</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-2xs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
                    <tr>
                      <th className="py-3 px-4">Food Surplus</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Storage</th>
                      <th className="py-3 px-4">Pickup Deadline</th>
                      <th className="py-3 px-4">Lifecycle Status</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeDonationsList.map((d) => (
                      <tr 
                        key={d._id} 
                        onClick={() => handleOpenDetails(d._id)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{d.foodType}</div>
                          <div className="text-2xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock size={11} /> Prepared {new Date(d.preparedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {d.district}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {d.quantity}
                        </td>
                        <td className="py-3.5 px-4 capitalize text-slate-600 font-medium">
                          {d.storageCondition?.replace('_', ' ')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-rose-700">
                            {new Date(d.pickupDeadline).toLocaleDateString()} {new Date(d.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(d.status)}
                        </td>
                        <td className="py-3.5 px-4">
                          {d.matchedRecipient ? (
                            <span className="inline-block px-2 py-0.5 rounded text-2xs font-bold bg-emerald-100 text-emerald-800">
                              {d.matchedRecipient.name}
                            </span>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">Matching engine searching...</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenDetails(d._id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                              title="View details"
                            >
                              <Eye size={13} />
                            </button>
                            {d.status === 'posted' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(d)}
                                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-sky-600 transition-colors"
                                  title="Edit posting"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCancelDonation(d._id, e)}
                                  className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                                  title="Cancel posting"
                                >
                                  <Trash2 size={13} />
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
          <div className="p-4 sm:p-6">
            {wasteRequests.length === 0 ? (
              <div className="p-12 text-center max-w-md mx-auto space-y-4">
                <Recycle size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-900">
                  No waste collection requests
                </h3>
                <p className="text-xs text-slate-500">
                  Post inedible organic scraps or packaging recyclables to route them to certified facilities.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle size={14} />
                  <span>Post Waste Batch</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-2xs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
                    <tr>
                      <th className="py-3 px-4">Material Stream</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">District</th>
                      <th className="py-3 px-4">Pickup Deadline</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Matched Collector</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wasteRequests.map((w) => (
                      <tr key={w._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900 capitalize">
                          {w.wasteCategory} Waste
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {w.quantity}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {w.district}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-rose-700">
                          {new Date(w.pickupDeadline).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(w.status)}
                        </td>
                        <td className="py-3.5 px-4">
                          {w.matchedCollector ? (
                            <span className="inline-block px-2 py-0.5 rounded text-2xs font-bold bg-sky-100 text-sky-800">
                              {w.matchedCollector.name}
                            </span>
                          ) : (
                            <span className="text-2xs text-slate-400 italic">Awaiting recycler match...</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {w.status === 'posted' && (
                            <button
                              type="button"
                              onClick={(e) => handleCancelWaste(w._id, e)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Cancel waste request"
                            >
                              <Trash2 size={13} />
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

        {/* TAB 3: DONATION HISTORY */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-6">
            {historyDonations.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No past donations in historical archive.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 text-2xs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
                    <tr>
                      <th className="py-3 px-4">Food Surplus</th>
                      <th className="py-3 px-4">Quantity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyDonations.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {d.foodType}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {d.quantity}
                        </td>
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(d.status)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(d.updatedAt || d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(d._id)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <Eye size={13} />
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

      {/* Modals */}
      <NewSurplusModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={loadAllData}
      />

      {selectedDonationId && (
        <DonationDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedDonationId(null);
          }}
          donationId={selectedDonationId}
        />
      )}

      {editingDonation && (
        <EditDonationModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingDonation(null);
          }}
          donation={editingDonation}
          onUpdated={loadAllData}
        />
      )}
    </div>
  );
}
