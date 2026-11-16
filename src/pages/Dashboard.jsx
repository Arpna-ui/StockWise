import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Zap,
  Activity,
  Layers,
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { Badge } from '../components/common/Badge';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { QuickTradeModal } from '../components/trade/QuickTradeModal';
import { INDICES as MOCK_INDICES, TOP_GAINERS as MOCK_GAINERS, TOP_LOSERS as MOCK_LOSERS, ALL_STOCKS } from '../mockData/marketData';
import { PORTFOLIO_SUMMARY } from '../mockData/portfolioData';
import { INITIAL_TRANSACTIONS } from '../mockData/transactionsData';
import { useWallet } from '../context/WalletContext';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // Dynamic Market Sections from backend
  const [marketIndices, setMarketIndices] = useState(MOCK_INDICES);
  const [topGainers, setTopGainers] = useState(MOCK_GAINERS);
  const [topLosers, setTopLosers] = useState(MOCK_LOSERS);
  const [recentTransactions, setRecentTransactions] = useState(INITIAL_TRANSACTIONS);

  useEffect(() => {
    let isMounted = true;
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/stocks/sections');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            if (json.data.indices?.length) setMarketIndices(json.data.indices);
            if (json.data.topGainers?.length) setTopGainers(json.data.topGainers);
            if (json.data.topLosers?.length) setTopLosers(json.data.topLosers);
          }
        }
      } catch (err) {
        // Silently use defaults
      }
    };

    const fetchRecentTx = async () => {
      try {
        const token = localStorage.getItem('stockwise_token');
        if (!token) return;
        const res = await fetch('/api/transactions?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0 && isMounted) {
            setRecentTransactions(json.data);
          }
        }
      } catch (err) {
        // Silently fallback to initial transactions
      }
    };

    fetchSections();
    fetchRecentTx();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenTrade = (stock, type = 'BUY') => {
    setSelectedStock(stock);
    setTradeType(type);
    setIsTradeModalOpen(true);
  };

  const isProfit = (wallet.totalPnL || 0) >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Virtual Money Educational Disclaimer Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.84rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--color-primary-blue)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
            }}
          >
            SIMULATION
          </div>
          <span style={{ color: 'var(--text-secondary)' }}>
            <b>Virtual Trading Environment:</b> Every account is credited with exactly ₹1,00,000 virtual starting capital. All transactions are paper money for educational learning with zero real financial risk.
          </span>
        </div>
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-profit)',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          ✓ Initial Grant: ₹1,00,000.00
        </span>
      </div>

      {/* Page Title & Quick Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Market Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Live overview of your virtual portfolio and Indian market benchmarks.
          </p>
        </div>
        <button
          onClick={() => handleOpenTrade(ALL_STOCKS[0], 'BUY')}
          className="btn-primary"
          style={{ padding: '10px 18px', fontSize: '0.88rem' }}
        >
          <Zap size={16} /> Quick Virtual Trade
        </button>
      </div>

      {/* Top 4 Wallet Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        <MetricCard
          title="Total Account Value"
          value={`₹${(wallet.totalAccountValue || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          changePercent={wallet.pnlPercentage || 0}
          subtitle="Cash + Active Holdings"
          icon={Activity}
          accentColor="#2563EB"
        />
        <MetricCard
          title="Available Virtual Cash"
          value={`₹${(wallet.availableBalance || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Uninvested Trading Balance"
          icon={Wallet}
          accentColor="#10B981"
        />
        <MetricCard
          title="Total Invested Capital"
          value={`₹${(wallet.totalInvested || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Cost basis of active holdings"
          icon={Layers}
          accentColor="#8B5CF6"
        />
        <MetricCard
          title="Total Profit / Loss"
          value={`${isProfit ? '+' : ''}₹${(wallet.totalPnL || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          changePercent={wallet.pnlPercentage || 0}
          subtitle="Realized + Unrealized returns"
          icon={TrendingUp}
          accentColor={isProfit ? '#10B981' : '#EF4444'}
        />
      </div>

      {/* Market Overview: NIFTY 50 & SENSEX Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Major Market Indices</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NSE / BSE Real-time Feed</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
          }}
        >
          {marketIndices.map((index) => {
            const indexVal = index.value || index.price || 0;
            const isPos = index.change >= 0;
            return (
              <div
                key={index.symbol}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/markets')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{index.symbol}</span>
                  <Badge value={index.changePercent} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="mono-num" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                    {indexVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={isPos ? 'profit-text' : 'loss-text'} style={{ fontSize: '0.82rem' }}>
                    {isPos ? `+${index.change}` : index.change}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '8px',
                  }}
                >
                  <span>H: ₹{(index.dayHigh || indexVal).toLocaleString('en-IN')}</span>
                  <span>L: ₹{(index.dayLow || indexVal).toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Chart & Top Gainers/Losers Split */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: '24px',
        }}
      >
        {/* Left: Portfolio Performance Chart */}
        <div>
          <PerformanceChart />
        </div>

        {/* Right: Top Movers (Gainers & Losers Tabs) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Market Movers</h3>
            <button
              onClick={() => navigate('/markets')}
              style={{
                background: 'transparent',
                color: 'var(--color-primary-blue)',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Top Gainers Column */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-profit)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingUp size={14} /> Top Gainers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topGainers.slice(0, 3).map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{Number(stock.price).toFixed(2)}</div>
                    </div>
                    <span className="profit-text mono-num" style={{ fontSize: '0.8rem' }}>
                      +{stock.changePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Losers Column */}
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-loss)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <TrendingDown size={14} /> Top Losers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topLosers.slice(0, 3).map((stock) => (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{stock.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{Number(stock.price).toFixed(2)}</div>
                    </div>
                    <span className="loss-text mono-num" style={{ fontSize: '0.8rem' }}>
                      {stock.changePercent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-input)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)',
              border: '1px dashed var(--border-subtle)',
            }}
          >
            💡 Tip: Click on any stock row to view historical candle charts, fundamentals, and place simulated orders.
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Recent Activity</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest paper trades and capital allocations</span>
          </div>
          <button
            onClick={() => navigate('/transactions')}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            Full Transaction History <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="trade-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Action</th>
                <th>Shares</th>
                <th>Execution Price</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.slice(0, 5).map((txn) => {
                const txnId = txn._id || txn.id;
                const companyName = txn.companyName || txn.name;
                const dateVal = txn.executionDate || txn.createdAt || txn.date || new Date();
                return (
                  <tr key={txnId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{txn.symbol}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{companyName}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: txn.type === 'BUY' ? 'rgba(16, 185, 129, 0.12)' : txn.type === 'SELL' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                          color: txn.type === 'BUY' ? 'var(--color-profit)' : txn.type === 'SELL' ? 'var(--color-loss)' : 'var(--color-primary-blue)',
                        }}
                      >
                        {txn.type}
                      </span>
                    </td>
                    <td className="mono-num">{txn.quantity}</td>
                    <td className="mono-num">₹{Number(txn.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="mono-num" style={{ fontWeight: 700 }}>
                      ₹{Number(txn.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-profit)', fontWeight: 600 }}>
                        ● {txn.status || 'COMPLETED'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(dateVal).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade Modal */}
      <QuickTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        stock={selectedStock}
        defaultType={tradeType}
      />
    </div>
  );
};
