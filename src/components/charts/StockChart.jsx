import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const StockChart = ({ chartData, isPositive = true, onTimeframeChange }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');

  // Exact 6 historical intervals required: 1D, 1W, 1M, 3M, 6M, 1Y
  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y'];

  const handleSelectTimeframe = (tf) => {
    setSelectedTimeframe(tf);
    if (onTimeframeChange) {
      onTimeframeChange(tf);
    }
  };

  // Safely extract data for selected timeframe
  const availableData = chartData
    ? chartData[selectedTimeframe] || chartData['1D'] || []
    : [];

  // Determine trend for the current timeframe if data is available
  let trendPositive = isPositive;
  if (availableData.length >= 2) {
    const firstPrice = availableData[0].price;
    const lastPrice = availableData[availableData.length - 1].price;
    trendPositive = lastPrice >= firstPrice;
  }

  const strokeColor = trendPositive ? '#10B981' : '#EF4444';
  const gradId = `stockGrad-${trendPositive ? 'pos' : 'neg'}-${selectedTimeframe}`;

  return (
    <div>
      {/* Timeframe Selector Pill Bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '3px',
            gap: '3px',
          }}
        >
          {timeframes.map((tf) => {
            const isSelected = selectedTimeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => handleSelectTimeframe(tf)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  backgroundColor: isSelected ? 'var(--color-primary-blue)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {tf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: '100%', height: 320 }}>
        {availableData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={availableData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              />
              <YAxis
                domain={['dataMin - (dataMin * 0.005)', 'dataMax + (dataMax * 0.005)']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={(val) => `₹${Math.round(val)}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const priceVal = Number(payload[0].value);
                    const volVal = payload[0].payload.volume;
                    return (
                      <div
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {label} • {selectedTimeframe} Interval
                        </div>
                        <div
                          className="mono-num"
                          style={{ fontWeight: 800, fontSize: '1.05rem', color: strokeColor }}
                        >
                          ₹{priceVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {volVal && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Volume: {Number(volVal).toLocaleString('en-IN')} shares
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${gradId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            No price chart data available for this timeframe
          </div>
        )}
      </div>
    </div>
  );
};
