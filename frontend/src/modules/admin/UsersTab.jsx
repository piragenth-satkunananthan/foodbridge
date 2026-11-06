import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Trash2,
  Shield,
  Phone,
  Mail,
  MapPin,
  Building2,
  AlertTriangle,
  RotateCw,
  XCircle,
  Check
} from 'lucide-react';
import { fetchAllUsers, updateUserStatus, deleteUser } from '../../api/client';
import { useToast } from '../../components/Toast';

export default function UsersTab({ currentAdminId }) {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Status Change Modal State (replaces prompt)
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [statusModalReason, setStatusModalReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchAllUsers({
        role: roleFilter,
        status: statusFilter,
        district: districtFilter,
        search
      });
      setUsers(data);
    } catch (err) {
      setLoadError('Users could not be loaded.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter, districtFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleOpenStatusModal = (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    setStatusModalUser({ ...user, targetStatus: nextStatus });
    setStatusModalReason(
      nextStatus === 'suspended'
        ? 'Suspicious activity or community guidelines violation.'
        : 'Account identity verification and review completed.'
    );
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalUser) return;
    setStatusSubmitting(true);
    try {
      await updateUserStatus(statusModalUser._id, statusModalUser.targetStatus, statusModalReason);
      addToast(`Account for ${statusModalUser.name} is now ${statusModalUser.targetStatus}.`, 'success');
      setStatusModalUser(null);
      loadUsers();
    } catch (err) {
      addToast(`Failed to update status: ${err.message}`, 'error');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to permanently remove user account "${user.name}" (${user.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(user._id);
      addToast(`User account "${user.name}" successfully removed.`, 'info');
      loadUsers();
    } catch (err) {
      addToast(`Failed to delete user: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {loadError && (
        <div role="alert" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <span>{loadError}</span>
          <button className="underline font-bold" onClick={loadUsers}>Try again</button>
        </div>
      )}

      <div>
        <h2 className="text-xl font-extrabold text-slate-900">
          User & Stakeholder Directory
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Review stakeholder roles, verification statuses, and manage account governance.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Stakeholder Roles</option>
            <option value="donor">Food Donor</option>
            <option value="recipient">Food Recipient (NGO)</option>
            <option value="volunteer">Volunteer</option>
            <option value="recycler">Recycler</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Districts</option>
            <option value="Colombo">Colombo</option>
            <option value="Gampaha">Gampaha</option>
            <option value="Kandy">Kandy</option>
            <option value="Batticaloa">Batticaloa</option>
            <option value="Galle">Galle</option>
            <option value="Jaffna">Jaffna</option>
          </select>

          <button
            onClick={loadUsers}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-2xs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50">
              <tr>
                <th className="py-3 px-4">User & Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Linked Org</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RotateCw size={20} className="animate-spin mx-auto mb-2" />
                    Loading registered users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No users match the search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentAdmin = u._id === currentAdminId;
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSuspended ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-2xs font-extrabold shadow-2xs shrink-0 ${
                            u.role === 'admin'
                              ? 'bg-purple-600'
                              : u.role === 'donor'
                              ? 'bg-emerald-600'
                              : u.role === 'recipient'
                              ? 'bg-blue-600'
                              : 'bg-slate-600'
                          }`}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-2xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-slate-800">
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{u.district}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {u.contactNumber || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.organization ? (
                          <div>
                            <div className="font-semibold text-slate-800">{u.organization.name}</div>
                            <span className="inline-block px-1.5 py-0.5 rounded text-3xs font-bold uppercase bg-slate-100 text-slate-600">
                              {u.organization.verificationStatus}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-2xs">Personal</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                          isSuspended ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.status || 'active'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {!isCurrentAdmin ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenStatusModal(u)}
                              className={`px-2.5 py-1 rounded-lg text-2xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                                isSuspended
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              }`}
                              title={isSuspended ? 'Reactivate account' : 'Suspend account'}
                            >
                              {isSuspended ? <UserCheck size={12} /> : <UserX size={12} />}
                              <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete user"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-2xs text-slate-400 italic">Current Session</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accessible Status Change Modal (replaces browser prompt) */}
      <AnimatePresence>
        {statusModalUser && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    Update Account Status: {statusModalUser.targetStatus}
                  </h3>
                </div>
                <button
                  onClick={() => setStatusModalUser(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-600">
                  You are changing the account status for <strong className="text-slate-900">{statusModalUser.name}</strong> ({statusModalUser.email}) to <strong className="capitalize text-slate-900">{statusModalUser.targetStatus}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Administrative Reason / Audit Note
                  </label>
                  <textarea
                    rows={3}
                    value={statusModalReason}
                    onChange={(e) => setStatusModalReason(e.target.value)}
                    placeholder="Enter explicit reason for audit log..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => setStatusModalUser(null)}
                    disabled={statusSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmStatusChange}
                    disabled={statusSubmitting || !statusModalReason.trim()}
                    className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {statusSubmitting ? <RotateCw size={13} className="animate-spin" /> : <Check size={14} />}
                    <span>Confirm Status Update</span>
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
