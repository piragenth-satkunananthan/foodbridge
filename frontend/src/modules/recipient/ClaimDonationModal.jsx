import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle2, AlertTriangle, Clock, MapPin, 
  Package, ShieldCheck, HeartHandshake, Phone, RotateCw 
} from 'lucide-react';

export default function ClaimDonationModal({ 
  isOpen, 
  onClose, 
  donation, 
  onClaim, 
  isVerified = true 
}) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !donation) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isVerified) return;
    
    setLoading(true);
    setError(null);
    try {
      await onClaim(donation._id, notes);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to claim donation');
    } finally {
      setLoading(false);
    }
  };

  const hoursRemaining = donation.hoursRemaining !== undefined 
    ? donation.hoursRemaining 
    : Math.max(0, Math.round(((new Date(donation.pickupDeadline).getTime() - Date.now()) / (1000 * 60 * 60)) * 10) / 10);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Claim Food Surplus
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Proximity Rescue Allocation Engine
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Verification Block Warning */}
            {!isVerified && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex gap-3 text-xs text-amber-800">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-900 mb-0.5">Admin Verification Required</strong>
                  Your charity profile is currently pending review. You can browse surplus, but claims are locked until approval.
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
                <strong className="font-bold">Error:</strong> {error}
              </div>
            )}

            {/* Surplus Summary Card */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-2xs font-extrabold uppercase bg-emerald-600 text-white mb-1.5">
                    {donation.matchScore ? `${donation.matchScore}% Smart Match` : 'Available Surplus'}
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    {donation.foodType}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-extrabold text-slate-800 shadow-2xs shrink-0">
                  {donation.quantity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin size={14} className="text-emerald-600 shrink-0" />
                  <span className="truncate">{donation.district} ({donation.distanceKm ? `${donation.distanceKm} km` : 'Local'})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className={hoursRemaining <= 2 ? 'text-rose-600' : 'text-amber-600'} />
                  <span className={hoursRemaining <= 2 ? 'font-bold text-rose-700' : 'text-slate-700'}>
                    {hoursRemaining}h window
                  </span>
                </div>
                <div className="flex items-center gap-1.5 capitalize">
                  <Package size={14} className="text-indigo-600 shrink-0" />
                  <span>{(donation.storageCondition || 'room_temperature').replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-sky-600 shrink-0" />
                  <span className="truncate">{donation.donor?.contactNumber || 'Contact on File'}</span>
                </div>
              </div>

              {donation.specialInstructions && (
                <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                  <strong className="text-slate-700">Instructions:</strong> {donation.specialInstructions}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Distribution & Recipient Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Feeding 65 shelter residents this evening. Community delivery vehicle available."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white text-slate-800"
                />
              </div>

              <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3 flex gap-2.5 text-xs text-emerald-900">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Once confirmed, this donation is reserved for your shelter. A delivery job is immediately dispatched to volunteer logistics.
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isVerified}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isVerified
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <>
                      <RotateCw size={13} className="animate-spin" />
                      <span>Claiming...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Confirm Allocation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
