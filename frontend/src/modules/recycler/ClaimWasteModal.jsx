import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Recycle, AlertCircle, CheckCircle2, ShieldCheck,
  MapPin, Clock, Package, RotateCw
} from 'lucide-react';
import { claimWasteRequest } from '../../api/client';

export default function ClaimWasteModal({ isOpen, onClose, wasteRequest, onClaimSuccess }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !wasteRequest) return null;

  const handleClaim = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await claimWasteRequest(wasteRequest._id, notes);
      setLoading(false);
      onClaimSuccess();
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to claim waste request');
    }
  };

  const categoryLabels = {
    plastic: '🧴 Plastics & Polymers',
    glass: '🍾 Glass Bottles & Cullet',
    paper: '📦 Paperboard & Cardboard',
    metal: '🥫 Scrap Metals',
    organic: '🥬 Organic Food Scraps',
    non_recyclable: '🗑 Non-Recyclable Residuals'
  };

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
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Recycle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Accept Waste Collection Batch
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Module 3 Circular Sourcing & Material Intake
                </p>
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

          {/* Content */}
          <form onSubmit={handleClaim} className="p-6 space-y-5">
            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Batch Summary Card */}
            <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded text-2xs font-bold uppercase bg-sky-100 text-sky-800 mb-1">
                    {categoryLabels[wasteRequest.wasteCategory] || wasteRequest.wasteCategory}
                  </span>
                  <h4 className="text-lg font-extrabold text-sky-950">
                    {wasteRequest.quantity}
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-xs font-bold text-sky-900 shadow-2xs">
                  {wasteRequest.district || 'Local'} District
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin size={14} className="text-sky-600 shrink-0" />
                  <span className="truncate">{wasteRequest.donor?.name || 'Commercial Donor'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500 shrink-0" />
                  <span>Posted {new Date(wasteRequest.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {wasteRequest.handlingRequirements && (
                <div className="pt-2 border-t border-sky-200/60 text-xs text-slate-600">
                  <strong className="text-slate-800">Handling:</strong> {wasteRequest.handlingRequirements}
                </div>
              )}
            </div>

            {/* Intake Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Facility Intake / Processing Notes (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Pre-allocated to shredder stream 2. Containerized collection truck dispatched."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white text-slate-800"
              />
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 flex gap-2.5 text-xs text-slate-600">
              <ShieldCheck size={16} className="text-sky-600 shrink-0 mt-0.5" />
              <span>
                Claiming locks this batch exclusively to your recycling facility. A volunteer courier or your own logistics team will be routed for collection.
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
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RotateCw size={13} className="animate-spin" />
                    <span>Claiming Batch...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Confirm Claim & Sourcing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
