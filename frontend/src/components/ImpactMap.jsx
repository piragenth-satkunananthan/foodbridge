import React, { useState } from 'react';
import { MapPin, Navigation, Building2, Utensils, HeartHandshake, Truck, CheckCircle2 } from 'lucide-react';

const districtHubs = [
  {
    id: 'colombo',
    name: 'Colombo Hub',
    district: 'Colombo',
    x: 175,
    y: 280,
    donors: 8,
    ngos: 5,
    volunteers: 12,
    mealsRescued: '1,420 meals',
    status: 'High Volume Corridor',
    activeRoute: 'Grand Cinnamon &rarr; Hope Charity Center'
  },
  {
    id: 'gampaha',
    name: 'Gampaha Metro',
    district: 'Gampaha',
    x: 185,
    y: 235,
    donors: 4,
    ngos: 3,
    volunteers: 6,
    mealsRescued: '760 meals',
    status: 'Active Dispatch',
    activeRoute: 'Royal Banquet &rarr; Sunrise Orphanage'
  },
  {
    id: 'kandy',
    name: 'Kandy Central Hub',
    district: 'Kandy',
    x: 275,
    y: 220,
    donors: 5,
    ngos: 4,
    volunteers: 7,
    mealsRescued: '510 meals',
    status: 'Active Dispatch',
    activeRoute: 'Hilltop Bakers &rarr; Community Food Pantry'
  },
  {
    id: 'batticaloa',
    name: 'Batticaloa Coastal',
    district: 'Batticaloa',
    x: 440,
    y: 200,
    donors: 3,
    ngos: 2,
    volunteers: 4,
    mealsRescued: '320 meals',
    status: 'Expanding Network',
    activeRoute: 'Ocean View Rest &rarr; Coastal Relief Network'
  },
  {
    id: 'galle',
    name: 'Galle Southern',
    district: 'Galle',
    x: 200,
    y: 360,
    donors: 2,
    ngos: 2,
    volunteers: 3,
    mealsRescued: '190 meals',
    status: 'Expanding Network',
    activeRoute: 'Southern Spice &rarr; Elder Care Home'
  }
];

export default function ImpactMap() {
  const [selectedHub, setSelectedHub] = useState(districtHubs[0]);

  return (
    <div className="card" style={{ padding: '24px', marginTop: '28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={20} color="#059669" />
            <span>Interactive Food Rescue Corridors & Hub Network</span>
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Select any active regional hub to inspect real-time logistics corridors and community coverage.
          </p>
        </div>

        <span className="badge verified" style={{ fontSize: '12px', padding: '5px 12px' }}>
          <span className="pulse-dot green" /> 5 Active Regional Hubs
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'center' }}>
        {/* SVG Sri Lanka Regional Map Canvas */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%)',
          borderRadius: '16px',
          border: '1px solid #d1fae5',
          padding: '20px',
          position: 'relative',
          minHeight: '360px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg viewBox="100 120 400 300" style={{ width: '100%', maxHeight: '340px', overflow: 'visible' }}>
            {/* Rescue Corridor Connections (Dashed Routes) */}
            <path
              d="M 175,280 Q 220,250 275,220"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="5,5"
              opacity="0.8"
            />
            <path
              d="M 175,280 L 185,235"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4,4"
              opacity="0.7"
            />
            <path
              d="M 275,220 Q 360,205 440,200"
              fill="none"
              stroke="#059669"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              opacity="0.8"
            />
            <path
              d="M 175,280 L 200,360"
              fill="none"
              stroke="#059669"
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity="0.6"
            />

            {/* Hub Nodes */}
            {districtHubs.map((hub) => {
              const isSelected = selectedHub.id === hub.id;
              return (
                <g
                  key={hub.id}
                  onClick={() => setSelectedHub(hub)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Pulse halo for active hub */}
                  <circle
                    cx={hub.x}
                    y={hub.y}
                    r={isSelected ? 18 : 12}
                    fill={isSelected ? '#10b981' : '#059669'}
                    opacity={isSelected ? 0.35 : 0.15}
                  />
                  {/* Core dot */}
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isSelected ? 8 : 6}
                    fill={isSelected ? '#047857' : '#059669'}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Label */}
                  <text
                    x={hub.x}
                    y={hub.y - 12}
                    textAnchor="middle"
                    fill={isSelected ? '#047857' : '#334155'}
                    fontSize={isSelected ? '12.5' : '11'}
                    fontWeight={isSelected ? '800' : '600'}
                  >
                    {hub.district}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Hub Details Panel */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '8px', borderRadius: '10px' }}>
                <MapPin size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedHub.name}</h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>District: {selectedHub.district}</span>
              </div>
            </div>
            <span className="badge verified" style={{ fontSize: '12px' }}>{selectedHub.status}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '18px 0' }}>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <Utensils size={16} color="#059669" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedHub.donors}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Donors</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <HeartHandshake size={16} color="#3b82f6" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedHub.ngos}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Charities</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <Truck size={16} color="#f59e0b" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedHub.volunteers}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Couriers</div>
            </div>
          </div>

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '12.5px',
            color: '#166534',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div><strong>Active Corridor:</strong> {selectedHub.activeRoute}</div>
            <div><strong>Total Rescued:</strong> {selectedHub.mealsRescued} diverted from landfill</div>
          </div>
        </div>
      </div>
    </div>
  );
}
