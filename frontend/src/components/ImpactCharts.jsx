import React, { useState } from 'react';
import { TrendingUp, PieChart, BarChart2, ShieldAlert, Sparkles, Award } from 'lucide-react';

export default function ImpactCharts({ summary, ecosystem }) {
  const [activeMetric, setActiveMetric] = useState('monthly');

  // Month-over-month historical trajectory data (projected and verified)
  const monthlyData = [
    { month: 'May', meals: 680, wasteKg: 190 },
    { month: 'Jun', meals: 1120, wasteKg: 280 },
    { month: 'Jul', meals: 1650, wasteKg: 410 },
    { month: 'Aug', meals: 2100, wasteKg: 620 },
    { month: 'Sep', meals: 2540, wasteKg: 890 },
    { month: 'Oct', meals: summary?.mealsRescued || 2910, wasteKg: summary?.totalKgRecycled || 570.5 }
  ];

  const maxMeals = Math.max(...monthlyData.map((d) => d.meals), 3000);

  // Recycled material proportions
  const r = summary?.kgRecycled || { plastic: 150, glass: 120, paper: 210, metal: 90.5 };
  const totalKg = (r.plastic + r.glass + r.paper + r.metal) || 570.5;

  const materials = [
    { name: 'Plastic', kg: r.plastic, color: '#3b82f6' },
    { name: 'Glass', kg: r.glass, color: '#10b981' },
    { name: 'Paper', kg: r.paper, color: '#f59e0b' },
    { name: 'Metal', kg: r.metal, color: '#8b5cf6' }
  ];

  // District distribution
  const districts = [
    { name: 'Colombo', pct: 45, volume: '1,310 meals' },
    { name: 'Gampaha', pct: 28, volume: '815 meals' },
    { name: 'Kandy', pct: 17, volume: '495 meals' },
    { name: 'Batticaloa', pct: 10, volume: '290 meals' }
  ];

  return (
    <div style={{ marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="#059669" />
            <span>Ecological & Diversion Analytics</span>
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Historical rescue momentum and circular materials lifecycle breakdown.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setActiveMetric('monthly')}
            className={`btn btn-sm ${activeMetric === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12.5px', padding: '6px 14px' }}
          >
            Growth Trajectory
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('materials')}
            className={`btn btn-sm ${activeMetric === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12.5px', padding: '6px 14px' }}
          >
            Material Streams
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('districts')}
            className={`btn btn-sm ${activeMetric === 'districts' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '12.5px', padding: '6px 14px' }}
          >
            Regional Spread
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTHLY MOMENTUM (Interactive SVG Line & Area Chart) */}
      {activeMetric === 'monthly' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Monthly Rescued Meals (6-Month Cumulative Growth)
            </span>
            <span className="badge verified" style={{ fontSize: '11.5px' }}>
              +328% Since Launch
            </span>
          </div>

          <div style={{ width: '100%', height: '180px', position: 'relative' }}>
            <svg viewBox="0 0 600 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="30" x2="580" y2="30" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="80" x2="580" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="40" y1="130" x2="580" y2="130" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area fill */}
              <path
                d={`M 60,${160 - (monthlyData[0].meals / maxMeals) * 130} 
                   L 160,${160 - (monthlyData[1].meals / maxMeals) * 130} 
                   L 260,${160 - (monthlyData[2].meals / maxMeals) * 130} 
                   L 360,${160 - (monthlyData[3].meals / maxMeals) * 130} 
                   L 460,${160 - (monthlyData[4].meals / maxMeals) * 130} 
                   L 560,${160 - (monthlyData[5].meals / maxMeals) * 130} 
                   L 560,160 L 60,160 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line path */}
              <path
                d={`M 60,${160 - (monthlyData[0].meals / maxMeals) * 130} 
                   L 160,${160 - (monthlyData[1].meals / maxMeals) * 130} 
                   L 260,${160 - (monthlyData[2].meals / maxMeals) * 130} 
                   L 360,${160 - (monthlyData[3].meals / maxMeals) * 130} 
                   L 460,${160 - (monthlyData[4].meals / maxMeals) * 130} 
                   L 560,${160 - (monthlyData[5].meals / maxMeals) * 130}`}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Data points */}
              {monthlyData.map((d, idx) => {
                const cx = 60 + idx * 100;
                const cy = 160 - (d.meals / maxMeals) * 130;
                return (
                  <g key={d.month}>
                    <circle cx={cx} cy={cy} r="5" fill="#047857" stroke="#ffffff" strokeWidth="2.5" />
                    <text x={cx} y="175" textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="600">
                      {d.month}
                    </text>
                    <text x={cx} y={cy - 10} textAnchor="middle" fill="#0f172a" fontSize="11" fontWeight="700">
                      {d.meals}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* VIEW 2: MATERIALS BREAKDOWN */}
      {activeMetric === 'materials' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                Industrial Material Recovery Streams
              </span>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                Non-perishable packaging and organic solid by-products are classified and distributed to licensed industrial recycling facilities.
              </p>
              <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span className="badge verified" style={{ fontSize: '12px' }}>
                  Zero-Landfill Policy
                </span>
                <span className="badge blue" style={{ fontSize: '12px' }}>
                  Total: {totalKg} kg
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {materials.map((m) => {
                const pct = Math.round((m.kg / totalKg) * 100) || 0;
                return (
                  <div key={m.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', color: '#1e293b' }}>{m.name}</span>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>{m.kg} kg ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: m.color,
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: REGIONAL SPREAD */}
      {activeMetric === 'districts' && (
        <div className="card" style={{ padding: '24px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '16px' }}>
            District Rescue Volume Share
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {districts.map((dist) => (
              <div
                key={dist.name}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>{dist.name}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', margin: '6px 0' }}>{dist.pct}%</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{dist.volume} diverted</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
