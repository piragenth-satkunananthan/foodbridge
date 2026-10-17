import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Recycle,
  Truck,
  Search,
  Filter,
  Clock,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { fetchAllDonations, fetchAllWasteRequests, fetchAllPickups } from '../api';

export default function MonitoringTab() {
  const [subTab, setSubTab] = useState('donations'); // 'donations' | 'waste' | 'pickups'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (subTab === 'donations') {
        const res = await fetchAllDonations({
          status: statusFilter,
          district: districtFilter,
          search
        });
        setData(res);
      } else if (subTab === 'waste') {
        const res = await fetchAllWasteRequests({
          category: categoryFilter,
          status: statusFilter,
          district: districtFilter,
          search
        });
        setData(res);
      } else if (subTab === 'pickups') {
        const res = await fetchAllPickups({
          status: statusFilter
        });
        setData(res);
      }
    } catch (err) {
      console.error('Failed to load monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setStatusFilter('all');
    setDistrictFilter('all');
    setCategoryFilter('all');
    setSearch('');
  }, [subTab]);

  useEffect(() => {
    loadData();
  }, [subTab, statusFilter, districtFilter, categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div>
      {/* Sub navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            Platform Operations & Live Monitoring
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Inspect active postings, waste routing, and volunteer deliveries across all modules.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div style={{ background: '#e2e8f0', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setSubTab('donations')}
            className={`btn btn-sm ${subTab === 'donations' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <Utensils size={14} /> Food Donations
          </button>
          <button
            onClick={() => setSubTab('waste')}
            className={`btn btn-sm ${subTab === 'waste' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <Recycle size={14} /> Waste Requests
          </button>
          <button
            onClick={() => setSubTab('pickups')}
            className={`btn btn-sm ${subTab === 'pickups' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
          >
            <Truck size={14} /> Pickups & Routes
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} className="search-input-group">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder={
              subTab === 'donations'
                ? 'Search food type or special instructions...'
                : subTab === 'waste'
                ? 'Search quantity or details...'
                : 'Search pickups...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div style={{ display: 'flex', gap: '10px' }}>
          {subTab === 'waste' && (
            <select
              className="select-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Waste Streams</option>
              <option value="organic">Organic</option>
              <option value="plastic">Plastic</option>
              <option value="glass">Glass</option>
              <option value="paper">Paper / Cardboard</option>
              <option value="metal">Metal</option>
              <option value="non_recyclable">Non-Recyclable</option>
            </select>
          )}

          <select
            className="select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="posted">Posted</option>
            <option value="matched">Matched</option>
            <option value="pickup_scheduled">Pickup Scheduled</option>
            <option value="picked_up">Picked Up</option>
            {subTab === 'waste' ? (
              <option value="recycled">Recycled</option>
            ) : (
              <option value="delivered">Delivered</option>
            )}
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>

          {subTab !== 'pickups' && (
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
          )}

          <button onClick={loadData} className="btn btn-secondary btn-sm">
            Refresh
          </button>
        </div>
      </div>

      {/* Render SubTab Table */}
      <div className="table-wrapper">
        {subTab === 'donations' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Food Item</th>
                <th>Quantity</th>
                <th>Storage Condition</th>
                <th>District</th>
                <th>Pickup Deadline</th>
                <th>Donor Info</th>
                <th>Matched Recipient</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>Loading donations...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No donations found.</td></tr>
              ) : (
                data.map((d) => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{d.foodType}</div>
                      {d.specialInstructions && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{d.specialInstructions}</div>
                      )}
                    </td>
                    <td><strong style={{ color: '#059669' }}>{d.quantity}</strong></td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>
                        {d.storageCondition?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{d.district}</td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {new Date(d.pickupDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(d.pickupDeadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: '600' }}>{d.donor?.name || 'Unknown Donor'}</div>
                        <div style={{ color: '#64748b' }}>{d.donor?.contactNumber}</div>
                      </div>
                    </td>
                    <td>
                      {d.matchedRecipient ? (
                        <span className="badge verified" style={{ fontSize: '11px' }}>
                          {d.matchedRecipient.name}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Unmatched</span>
                      )}
                    </td>
                    <td><span className={`badge ${d.status}`}>{d.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {subTab === 'waste' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Estimated Weight</th>
                <th>District</th>
                <th>Pickup Deadline</th>
                <th>Donor</th>
                <th>Matched Facility</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>Loading waste requests...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No waste requests found.</td></tr>
              ) : (
                data.map((w) => (
                  <tr key={w._id}>
                    <td>
                      <span className={`badge ${w.wasteCategory}`}>
                        {w.wasteCategory}
                      </span>
                    </td>
                    <td><strong>{w.quantity}</strong></td>
                    <td>{w.district}</td>
                    <td>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {new Date(w.pickupDeadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: '600' }}>{w.donor?.name || 'Unknown Donor'}</div>
                        <div style={{ color: '#64748b' }}>{w.donor?.contactNumber}</div>
                      </div>
                    </td>
                    <td>
                      {w.matchedCollector ? (
                        <span className="badge verified" style={{ fontSize: '11px' }}>
                          {w.matchedCollector.name}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Awaiting Collector</span>
                      )}
                    </td>
                    <td><span className={`badge ${w.status}`}>{w.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {subTab === 'pickups' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Type</th>
                <th>Assigned Volunteer</th>
                <th>Receiving Destination</th>
                <th>Pipeline Stage</th>
                <th>Route / Location</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>Loading pickups...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No active pickups found.</td></tr>
              ) : (
                data.map((p) => (
                  <tr key={p._id}>
                    <td>
                      {p.donation ? (
                        <div>
                          <span className="badge donor" style={{ fontSize: '10px' }}>Food Donation</span>
                          <div style={{ fontWeight: '600', fontSize: '13px', marginTop: '2px' }}>
                            {p.donation.foodType} ({p.donation.quantity})
                          </div>
                        </div>
                      ) : p.wasteRequest ? (
                        <div>
                          <span className="badge recycler" style={{ fontSize: '10px' }}>Waste Request</span>
                          <div style={{ fontWeight: '600', fontSize: '13px', marginTop: '2px' }}>
                            {p.wasteRequest.wasteCategory} ({p.wasteRequest.quantity})
                          </div>
                        </div>
                      ) : (
                        <span>Standard Job</span>
                      )}
                    </td>
                    <td>
                      {p.volunteer ? (
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: '700' }}>{p.volunteer.name}</div>
                          <div style={{ color: '#64748b', fontSize: '11px' }}>{p.volunteer.contactNumber}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>
                          Open for Volunteer
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>
                        {p.receivingOrganization?.name || 'Pending Match'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {p.receivingOrganization?.district}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${p.statusPipeline}`}>
                        {p.statusPipeline?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      {p.routeLocation?.lat ? (
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0284c7' }}>
                          📍 {p.routeLocation.lat.toFixed(4)}, {p.routeLocation.lng.toFixed(4)}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>Route coordinates N/A</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(p.updatedAt || p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
