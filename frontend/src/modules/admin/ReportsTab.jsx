import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { fetchReports } from '../../api/client';
import { useToast } from '../../components/Toast';

export default function ReportsTab() {
  const { addToast } = useToast();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [district, setDistrict] = useState('all');

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await fetchReports({
        fromDate,
        toDate,
        district
      });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [district]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadReports();
  };

  const handleExportJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodbridge-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Audit report downloaded successfully (JSON).', 'success');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            Platform Performance & Impact Reporting
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Audit metrics, completion success rates, and regional food rescue statistics.
          </p>
        </div>

        <button onClick={handleExportJSON} className="btn btn-secondary" disabled={!reportData}>
          <Download size={15} /> Export Audit Report (JSON)
        </button>
      </div>

      {/* Date & Filter Bar */}
      <form onSubmit={handleFilterSubmit} className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <Calendar size={15} color="#64748b" />
            <span>From:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '12.5px', width: 'auto' }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span>To:</span>
            <input
              type="date"
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '12.5px', width: 'auto' }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <select
            className="select-filter"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="all">All Districts</option>
            <option value="Colombo">Colombo</option>
            <option value="Gampaha">Gampaha</option>
            <option value="Kandy">Kandy</option>
            <option value="Batticaloa">Batticaloa</option>
            <option value="Galle">Galle</option>
          </select>

          <button type="submit" className="btn btn-primary btn-sm">
            Apply Date Filter
          </button>
        </div>
      </form>

      {/* Metric Cards Summary */}
      {reportData && (
        <div className="kpi-grid">
          <div className="kpi-card green">
            <div className="kpi-icon green">
              <CheckCircle size={22} />
            </div>
            <div className="kpi-details">
              <h3>Donation Success Rate</h3>
              <div className="kpi-value">{reportData.summary.donationSuccessRate}</div>
              <div className="kpi-sub">
                {reportData.summary.completedDonations} of {reportData.summary.totalDonations} completed
              </div>
            </div>
          </div>

          <div className="kpi-card blue">
            <div className="kpi-icon blue">
              <TrendingUp size={22} />
            </div>
            <div className="kpi-details">
              <h3>Waste Recovery Rate</h3>
              <div className="kpi-value">{reportData.summary.wasteSuccessRate}</div>
              <div className="kpi-sub">
                {reportData.summary.completedWasteRequests} of {reportData.summary.totalWasteRequests} recycled
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional District Distribution Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Regional Distribution by District</h2>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Total Food Posts</th>
                <th>Rescued & Delivered</th>
                <th>Total Waste Posts</th>
                <th>Recycled to Facilities</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px' }}>Loading reports...</td></tr>
              ) : reportData?.donationsByDistrict?.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>No regional activity recorded for selected period.</td></tr>
              ) : (
                reportData?.donationsByDistrict?.map((d) => {
                  const matchingWaste = reportData.wasteByDistrict?.find((w) => w._id === d._id);
                  return (
                    <tr key={d._id}>
                      <td style={{ fontWeight: '700' }}>{d._id || 'Unspecified'}</td>
                      <td>{d.total}</td>
                      <td>
                        <strong style={{ color: '#059669' }}>{d.completed}</strong>
                      </td>
                      <td>{matchingWaste?.total || 0}</td>
                      <td>
                        <strong style={{ color: '#0284c7' }}>{matchingWaste?.recycled || 0}</strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
