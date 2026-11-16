import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SECTOR_ALLOCATION } from '../../mockData/portfolioData';

export const AllocationChart = ({
  sectorData = [],
  distributionData = [],
}) => {
  const [activeTab, setActiveTab] = useState('sectors');

  // If sectorData has elements, use it; otherwise fallback to mock or empty
  const defaultSectors = sectorData && sectorData.length > 0 ? sectorData : SECTOR_ALLOCATION;
  
  // Default distribution if none passed: 100% Cash
  const defaultDistribution = distributionData && distributionData.length > 0 ? distributionData : [
    { name: 'Available Cash', value: 100000, percent: 100, color: '#10B981' },
    { name: 'Active Equities', value: 0, percent: 0, color: '#2563EB' },
  ];

  const currentData = activeTab === 'sectors' ? defaultSectors : defaultDistribution;
  const hasData = currentData && currentData.length > 0 && currentData.some(d => d.value > 0);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {activeTab === 'sectors' ? 'Sector Exposure' : 'Asset Allocation'}
        </span>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
            padding: '2px',
            gap: '2px',
          }}
        >
          <button
            onClick={() => setActiveTab('sectors')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'sectors' ? 'var(--color-primary-blue)' : 'transparent',
              color: activeTab === 'sectors' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Sectors
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            style={{
              padding: '4px 10px',
              borderRadius: '5px',
              fontSize: '0.72rem',
              fontWeight: 600,
              backgroundColor: activeTab === 'distribution' ? 'var(--color-primary-blue)' : 'transparent',
              color: activeTab === 'distribution' ? '#FFFFFF' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Cash vs Equities
          </button>
        </div>
      </div>

      {!hasData ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '0.85rem' }}>No active sector investments to display.</p>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentData.filter(d => d.value > 0)}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {currentData.filter(d => d.value > 0).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || '#64748B'}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                          }}
                        >
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</div>
                          <div className="mono-num" style={{ fontWeight: 700, color: item.color || 'var(--text-primary)' }}>
                            ₹{Number(item.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({item.percent}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {currentData.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: item.color || '#64748B',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="mono-num" style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    ₹{Number(item.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="mono-num" style={{ fontWeight: 700 }}>
                    {item.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
