import React, { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { fetchAllUsers, updateUserStatus, deleteUser } from '../../api/client';

export default function UsersTab({ currentAdminId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers({
        role: roleFilter,
        status: statusFilter,
        district: districtFilter,
        search
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
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

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = prompt(
      `Enter reason for marking ${user.name} as ${newStatus}:`,
      newStatus === 'suspended' ? 'Suspicious activity or community guidelines violation.' : 'Account review completed.'
    );

    if (reason === null) return; // cancelled

    try {
      await updateUserStatus(user._id, newStatus, reason);
      loadUsers();
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to permanently remove user account "${user.name}" (${user.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteUser(user._id);
      loadUsers();
    } catch (err) {
      alert(`Failed to delete user: ${err.message}`);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
          User & Fake Account Management
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Maintain platform trust by monitoring user profiles, handling fake accounts, and enforcing community safety rules.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-group">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="select-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Stakeholder Roles</option>
            <option value="donor">Food Donor</option>
            <option value="recipient">Food Recipient (NGO)</option>
            <option value="volunteer">Volunteer</option>
            <option value="recycler">Recycler</option>
            <option value="admin">Administrator</option>
          </select>

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <select
            className="select-filter"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="all">All Districts</option>
            <option value="Colombo">Colombo</option>
            <option value="Gampaha">Gampaha</option>
            <option value="Kandy">Kandy</option>
            <option value="Batticaloa">Batticaloa</option>
            <option value="Galle">Galle</option>
            <option value="Jaffna">Jaffna</option>
          </select>

          <button onClick={loadUsers} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name & Email</th>
              <th>Role</th>
              <th>District</th>
              <th>Contact Phone</th>
              <th>Linked Org</th>
              <th>Account Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>Loading registered users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No users match the criteria.</td></tr>
            ) : (
              users.map((u) => {
                const isCurrentAdmin = u._id === currentAdminId;
                const isSuspended = u.status === 'suspended';

                return (
                  <tr key={u._id} style={{ background: isSuspended ? '#fff5f5' : 'inherit' }}>
                    <td>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${u.role}`}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                        <MapPin size={13} color="#64748b" />
                        <span>{u.district}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px', color: '#334155' }}>{u.contactNumber}</div>
                    </td>

                    <td>
                      {u.organization ? (
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ fontWeight: '600' }}>{u.organization.name}</div>
                          <span className={`badge ${u.organization.verificationStatus}`} style={{ fontSize: '10px' }}>
                            {u.organization.verificationStatus}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Personal</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${u.status || 'active'}`}>
                        {u.status || 'active'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {!isCurrentAdmin ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`btn btn-sm ${isSuspended ? 'btn-success' : 'btn-secondary'}`}
                            title={isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                          >
                            {isSuspended ? <UserCheck size={13} /> : <UserX size={13} />}
                            <span>{isSuspended ? 'Reactivate' : 'Suspend'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-sm btn-outline-danger"
                            title="Delete fake or violating account"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                          Current Session
                        </span>
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
  );
}
