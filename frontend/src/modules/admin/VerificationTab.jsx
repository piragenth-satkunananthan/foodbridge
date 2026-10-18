import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  AlertCircle
} from 'lucide-react';
import { fetchOrganizations, verifyOrganization } from '../../api/client';
import { useToast } from '../../components/Toast';

export default function VerificationTab({ onVerificationUpdated }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal action state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [actionType, setActionType] = useState(null); // 'verify' | 'reject'
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchOrganizations({
        status: statusFilter,
        type: typeFilter,
        search
      });
      setOrganizations(data);
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenAction = (org, action) => {
    setSelectedOrg(org);
    setActionType(action);
    setRemarks('');
  };

  const { addToast } = useToast();

  const handleConfirmAction = async () => {
    if (!selectedOrg) return;
    setSubmitting(true);
    try {
      const targetStatus = actionType === 'verify' ? 'verified' : 'rejected';
      await verifyOrganization(selectedOrg._id, targetStatus, remarks);
      addToast(
        targetStatus === 'verified'
          ? `Organization "${selectedOrg.name}" successfully verified!`
          : `Organization "${selectedOrg.name}" has been rejected.`,
        targetStatus === 'verified' ? 'success' : 'info'
      );
      setSelectedOrg(null);
      loadData();
      if (onVerificationUpdated) onVerificationUpdated();
    } catch (err) {
      addToast(`Action failed: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Tab Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
          Organization Verification Center
        </h2>
        <p style={{ fontSize: '13px', color: '#64748b' }}>
          Review official registration documents and issue verified credentials to NGOs, shelters, and recycling operators.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-group">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by organization name or registration number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Verification Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="verified">Verified Only</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="select-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Organization Types</option>
            <option value="ngo">NGO</option>
            <option value="charity">Charity</option>
            <option value="shelter">Shelter</option>
            <option value="recycler">Recycler</option>
            <option value="composting_facility">Composting Facility</option>
          </select>

          <button onClick={loadData} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Organization</th>
              <th>Type</th>
              <th>Registration / License</th>
              <th>District</th>
              <th>Contact Person</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px' }}>
                  Loading organizations...
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px' }}>
                  <div className="empty-state">
                    <ShieldCheck size={36} color="#cbd5e1" style={{ margin: '0 auto' }} />
                    <h3>No organizations found</h3>
                    <p>There are no organizations matching the selected filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              organizations.map((org) => {
                const isPending = org.verificationStatus === 'pending';
                const isVerified = org.verificationStatus === 'verified';
                const isRejected = org.verificationStatus === 'rejected';

                return (
                  <tr key={org._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-badge">
                          {org.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{org.name}</div>
                          {org.materialTypesHandled?.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', marginTop: '3px' }}>
                              {org.materialTypesHandled.map((m) => (
                                <span key={m} className={`badge ${m}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge recipient" style={{ textTransform: 'capitalize' }}>
                        {org.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'monospace', fontSize: '13px' }}>
                        <FileText size={14} color="#64748b" />
                        <span>{org.registrationInfo}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={14} color="#64748b" />
                        <span>{org.district}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: '600' }}>{org.linkedUser?.name || 'N/A'}</div>
                        <div style={{ color: '#64748b', fontSize: '12px' }}>{org.linkedUser?.email}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>{org.linkedUser?.contactNumber}</div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${org.verificationStatus}`}>
                        {isVerified && <span className="pulse-dot green" />}
                        {isPending && <span className="pulse-dot amber" />}
                        {isRejected && <XCircle size={12} />}
                        <span>{org.verificationStatus}</span>
                      </span>
                      {org.verificationRemarks && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', maxWidth: '180px' }}>
                          Note: {org.verificationRemarks}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        {!isVerified && (
                          <button
                            onClick={() => handleOpenAction(org, 'verify')}
                            className="btn btn-sm btn-success"
                            title="Verify and grant verified badge"
                          >
                            <CheckCircle size={13} />
                            <span>Verify</span>
                          </button>
                        )}

                        {!isRejected && (
                          <button
                            onClick={() => handleOpenAction(org, 'reject')}
                            className="btn btn-sm btn-outline-danger"
                            title="Reject or revoke verification"
                          >
                            <XCircle size={13} />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Verification Decision Modal */}
      {selectedOrg && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>
                {actionType === 'verify' ? 'Approve Organization Verification' : 'Reject Organization Application'}
              </h2>
              <button onClick={() => setSelectedOrg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                {selectedOrg.name}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                Type: <strong>{selectedOrg.type}</strong> | District: <strong>{selectedOrg.district}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                Govt Reg / License Info: <strong style={{ fontFamily: 'monospace' }}>{selectedOrg.registrationInfo}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Contact: {selectedOrg.linkedUser?.name} ({selectedOrg.linkedUser?.email})
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {actionType === 'verify'
                  ? 'Admin Remarks (Optional Note)'
                  : 'Reason for Rejection (Will be sent to applicant)'}
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={
                  actionType === 'verify'
                    ? 'e.g. License verified against government registry.'
                    : 'e.g. License expired or unable to confirm registry number.'
                }
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setSelectedOrg(null)}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                className={`btn ${actionType === 'verify' ? 'btn-success' : 'btn-danger'}`}
                disabled={submitting}
              >
                {submitting
                  ? 'Processing...'
                  : actionType === 'verify'
                  ? 'Confirm & Issue Verified Badge'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
