import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../services/api';
import { PORTFOLIO_HISTORY } from '../../mockData/portfolioData';

export const PerformanceChart = ({ refreshTrigger }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [chartData, setChartData] = useState([]);
  const [meta, setMeta] = useState({
    currentValue: 100000.00,
    totalProfitLoss: 0.00,
    pnlPercentage: 0.00,
  });
  const [loading, setLoading] = useState(false);

  // All 7 required timeframe filters
  const timeframes = ['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'];

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api(`/api/portfolio/history?timeframe=${timeframe}`);
        if (res.success && res.data && isMounted) {
          setChartData(res.data.points || []);
          setMeta({
            currentValue: res.data.currentValue ?? 100000.00,
            totalProfitLoss: res.data.totalProfitLoss ?? 0.00,
            pnlPercentage: res.data.pnlPercentage ?? 0.00,
          });
          return;
        }
      } catch (err) {
        // Fallback to local mock data if offline or unauthorized
        if (isMounted) {
          const fallbackData = PORTFOLIO_HISTORY[timeframe] || PORTFOLIO_HISTORY['1D'] || [];
          setChartData(fallbackData);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [timeframe, refreshTrigger]);

  const isProfit = (meta.totalProfitLoss || 0) >= 0;
  const strokeColor = isProfit ? '#10B981' : '#EF4444';
  const gradientId = `perfGrad-${isProfit ? 'profit' : 'loss'}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const ptPnl = dataPoint.pnl;
      const ptIsProfit = (ptPnl ?? 0) >= 0;

      return (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 14px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {label}
          </div>
          <div
            className="mono-num"
            style={{ fontWeight: 800, fontSize: '1rem', color: strokeColor }}
          >
            ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          {ptPnl !== undefined && (
            <div
              style={{
                fontSize: '0.75rem',
                marginTop: '4px',
                color: ptIsProfit ? 'var(--color-profit)' : 'var(--color-loss)',
                fontWeight: 600,
              }}
            >
              {ptIsProfit ? '+' : ''}₹{Number(ptPnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })} vs Base
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Portfolio Valuation Trajectory
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span className="mono-num" style={{ fontSize: '1.45rem', fontWeight: 800 }}>
              ₹{Number(meta.currentValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={isProfit ? 'profit-text' : 'loss-text'}
              style={{ fontSize: '0.85rem', fontWeight: 600 }}
            >
              {isProfit ? '+' : ''}₹{Number(meta.totalProfitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({isProfit ? '+' : ''}{meta.pnlPercentage}%)
            </span>
          </div>
        </div>

        {/* 7 Timeframe pill buttons */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '3px',
            gap: '3px',
            flexWrap: 'wrap',
          }}
        >
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              style={{
                padding: '6px 11px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                backgroundColor: timeframe === tf ? 'var(--color-primary-blue)' : 'transparent',
                color: timeframe === tf ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height: 260, marginTop: '8px', position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          >
            Updating curve...
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData.length > 0 ? chartData : [{ time: 'Start', value: 100000 }]}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
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
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
