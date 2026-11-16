import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart as PieIcon,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Info,
  Award,
  AlertTriangle,
  ShieldCheck,
  Wallet,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { ALL_STOCKS } from '../mockData/marketData';
import { AllocationChart } from '../components/charts/AllocationChart';
import { PerformanceChart } from '../components/charts/PerformanceChart';
import { QuickTradeModal } from '../components/trade/QuickTradeModal';
import { Badge } from '../components/common/Badge';
import { InfoTooltip } from '../components/common/InfoTooltip';
import { BeginnerGlossaryModal } from '../components/common/BeginnerGlossaryModal';
import { useWallet } from '../context/WalletContext';
import { api } from '../services/api';

export const Portfolio = () => {
  const navigate = useNavigate();
  const { wallet, refreshWallet } = useWallet();

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Quick Trade Modal State
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const fetchPortfolioAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api('/api/portfolio/analytics');
      if (res.success && res.data) {
        setAnalyticsData(res.data);
      }
    } catch (err) {
      console.warn('[Portfolio fetch warning]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioAnalytics();
  }, []);

  const handleOpenTrade = (symbol, type) => {
    const stock = ALL_STOCKS.find((s) => s.symbol === symbol) || {
      symbol,
      name: symbol,
      price: 1000,
    };
    setSelectedStock(stock);
    setTradeType(type);
    setIsTradeModalOpen(true);
  };

  const handleModalClose = () => {
    setIsTradeModalOpen(false);
    fetchPortfolioAnalytics();
    refreshWallet();
    setRefreshKey((prev) => prev + 1);
  };

  const summary = analyticsData?.metrics || {};
  const holdings = analyticsData?.holdings || [];
  const bestPerformer = analyticsData?.bestPerformer;
  const worstPerformer = analyticsData?.worstPerformer;
  const sectorAllocation = analyticsData?.sectorAllocation || [];
  const investmentDistribution = analyticsData?.investmentDistribution || [];
  const concentration = analyticsData?.concentration || {};

  // Core metrics required by Stage 7
  const totalPortfolioValue = summary.totalPortfolioValue ?? (wallet.totalAccountValue || 100000);
  const totalInvestment = summary.totalInvestment ?? (wallet.totalInvested || 0);
  const availableCash = summary.availableCash ?? (wallet.availableBalance || 100000);
  const currentMarketValue = summary.currentMarketValue ?? (wallet.currentHoldingsValue || 0);
  const realizedPnL = summary.realizedPnL ?? 0;
  const unrealizedPnL = summary.unrealizedPnL ?? (wallet.unrealizedPnL || 0);
  const overallReturnsPercent = summary.pnlPercentage ?? (wallet.pnlPercentage || 0);
  const dayChange = summary.dayChange ?? 0;
  const dayChangePercent = summary.dayChangePercent ?? 0;

  const isRealizedProfit = realizedPnL >= 0;
  const isUnrealizedProfit = unrealizedPnL >= 0;
  const isOverallProfit = (totalPortfolioValue - 100000) >= 0;
  const isDayPositive = dayChange >= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Title & Actions Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Portfolio Management & Analytics
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Authoritative breakdown of active equity holdings, cost-basis, realized vs unrealized returns, and asset distribution.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsGlossaryOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={14} color="var(--color-primary-blue)" /> 🎓 Beginner Guide
          </button>
          <button
            onClick={() => {
              fetchPortfolioAnalytics();
              refreshWallet();
              setRefreshKey((k) => k + 1);
            }}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Refresh Portfolio"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Refresh Data
          </button>
          <button
            onClick={() => navigate('/markets')}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={16} /> Explore Equities
          </button>
        </div>
      </div>

      {/* Educational P&L Separation Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        <Sparkles size={20} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>Beginner Note on Profit / Loss: </strong>
          <span style={{ color: 'var(--color-profit)', fontWeight: 700 }}>Realized P&L</span> represents cash in the bank already locked in from sold stocks.
          <span style={{ color: 'var(--color-primary-blue)', fontWeight: 700, marginLeft: '8px' }}>Unrealized P&L</span> represents paper fluctuations in stocks you still own that will fluctuate with live market prices until you sell.
        </div>
      </div>

      {/* 7 Core Portfolio Summary Metrics Cards with InfoTooltips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        {/* 1. Total Portfolio Value */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              1. Total Portfolio Value
            </span>
            <InfoTooltip
              title="Total Portfolio Value"
              text="Your overall simulated wealth: Available virtual cash + the current live worth of all stocks you own."
              tip="Starts at ₹1,00,000. Any amount above that is your total net gain!"
            />
          </div>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{Number(totalPortfolioValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.78rem' }}>
            <span className={isDayPositive ? 'profit-text' : 'loss-text'} style={{ fontWeight: 600 }}>
              {isDayPositive ? '+' : ''}₹{Number(dayChange).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({isDayPositive ? '+' : ''}{dayChangePercent}%) Today
            </span>
          </div>
        </div>

        {/* 2. Total Investment Cost */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              2. Total Investment
            </span>
            <InfoTooltip
              title="Total Investment"
              text="The original cash amount you paid to buy all the shares currently in your portfolio."
              tip="Compare this with Current Market Value to see if your current holdings are in profit."
            />
          </div>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{Number(totalInvestment).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Cost Basis of Active Shares
          </span>
        </div>

        {/* 3. Available Cash */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              3. Available Virtual Cash
            </span>
            <InfoTooltip
              title="Available Virtual Cash"
              text="Uninvested money ready to spend on new trades. Not locked into any stocks."
              tip="Keep cash in reserve so you can buy stocks when good buying opportunities appear."
            />
          </div>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px', color: 'var(--color-profit)' }}>
            ₹{Number(availableCash).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Liquid Margin for Trading
          </span>
        </div>

        {/* 4. Current Market Value */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              4. Current Market Value
            </span>
            <InfoTooltip
              title="Current Market Value"
              text="What all your active shares are worth right now at current live stock market prices."
              tip="If this is higher than your Total Investment, you are in unrealized profit!"
            />
          </div>
          <div className="mono-num" style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            ₹{Number(currentMarketValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Across {holdings.length} {holdings.length === 1 ? 'Equity' : 'Equities'}
          </span>
        </div>

        {/* 5. Realised Profit / Loss */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              5. Realised Profit / Loss
            </span>
            <InfoTooltip
              title="Realised Profit / Loss"
              text="Permanent cash gained or lost from stocks you already sold. This money is already safely in your wallet."
              tip="You only realize profit or loss when you click SELL."
            />
          </div>
          <div
            className={`mono-num ${isRealizedProfit ? 'profit-text' : 'loss-text'}`}
            style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}
          >
            {isRealizedProfit ? '+' : ''}₹{Number(realizedPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Settled Gains on Completed Sells
          </span>
        </div>

        {/* 6. Unrealised Profit / Loss */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              6. Unrealised Profit / Loss
            </span>
            <InfoTooltip
              title="Unrealised Profit / Loss"
              text="Paper gains or losses on shares you still hold. It changes every second with market prices and only locks in when you sell."
              tip="Don't panic if this turns temporarily red. The market moves up and down!"
            />
          </div>
          <div
            className={`mono-num ${isUnrealizedProfit ? 'profit-text' : 'loss-text'}`}
            style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}
          >
            {isUnrealizedProfit ? '+' : ''}₹{Number(unrealizedPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Paper Gain/Loss on Open Holdings
          </span>
        </div>

        {/* 7. Overall Returns */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              7. Overall Net Returns
            </span>
            <InfoTooltip
              title="Overall Net Returns"
              text="The net percentage growth of your account against your original ₹1,00,000 starting cash."
            />
          </div>
          <div
            className={`mono-num ${isOverallProfit ? 'profit-text' : 'loss-text'}`}
            style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}
          >
            {isOverallProfit ? '+' : ''}{Number(overallReturnsPercent).toFixed(2)}%
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
            Against ₹1,00,000 Starting Capital
          </span>
        </div>
      </div>

      {/* Performance Curve & Allocation Split */}
      <div className="portfolio-charts-grid">
        {/* Performance Chart with all 7 Timeframe Filters */}
        <div>
          <PerformanceChart refreshTrigger={refreshKey} />
        </div>

        {/* Asset & Sector Allocation Chart */}
        <div>
          <AllocationChart
            sectorData={sectorAllocation}
            distributionData={investmentDistribution}
          />
        </div>
      </div>

      {/* Analytics Insights: Best & Worst Performers + Concentration Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Best Performer */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Award size={24} color="var(--color-profit)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Top Outperformer
            </span>
            {bestPerformer ? (
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {bestPerformer.symbol} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>({bestPerformer.companyName})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span className="mono-num profit-text" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    +{bestPerformer.pnlPercent}%
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    (+₹{Number(bestPerformer.pnl).toLocaleString('en-IN')})
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>No active holdings yet</p>
            )}
          </div>
        </div>

        {/* Worst Performer */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} color="var(--color-loss)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Lagging Position
            </span>
            {worstPerformer ? (
              <div style={{ marginTop: '2px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {worstPerformer.symbol} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>({worstPerformer.companyName})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span
                    className={`mono-num ${worstPerformer.pnlPercent >= 0 ? 'profit-text' : 'loss-text'}`}
                    style={{ fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    {worstPerformer.pnlPercent >= 0 ? '+' : ''}{worstPerformer.pnlPercent}%
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    ({worstPerformer.pnl >= 0 ? '+' : ''}₹{Number(worstPerformer.pnl).toLocaleString('en-IN')})
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>No active holdings yet</p>
            )}
          </div>
        </div>

        {/* Diversification Status */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} color="var(--color-primary-blue)" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Portfolio Health & Diversification
              </span>
              <InfoTooltip
                title="What is Diversification?"
                text="Spreading your investments across different sectors (IT, Banking, Energy) prevents a bad day in one industry from damaging your whole portfolio."
                tip="Aim to hold stocks in at least 3 distinct sectors."
              />
            </div>
            <div style={{ marginTop: '2px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {concentration.diversificationStatus || 'Evaluating'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {concentration.top3Percent > 0 ? `Top 3 holdings comprise ${concentration.top3Percent}% of equities` : 'Hold at least 3 stocks across sectors for optimal risk distribution'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Complete Holdings Table Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Holdings Ledger ({holdings.length})</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Itemized list of all currently held stocks, buy averages, valuation, and return percentages.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', color: 'var(--color-primary-blue)' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading portfolio holdings...</p>
          </div>
        ) : holdings.length === 0 ? (
          <div style={{ padding: '54px 24px', textAlign: 'center' }}>
            <ShoppingBag size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>No Active Stock Holdings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', maxWidth: '440px', margin: '0 auto 20px' }}>
              You haven't bought any shares yet. Use your ₹1,00,000 risk-free virtual cash to buy top Indian equities on the Market Explorer!
            </p>
            <button
              onClick={() => navigate('/markets')}
              className="btn-primary"
              style={{ padding: '9px 20px', fontSize: '0.88rem' }}
            >
              Go to Stock Market Explorer
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Company Name & Symbol</th>
                  <th>Sector</th>
                  <th style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Quantity
                      <InfoTooltip title="Quantity" text="Total number of shares you currently own." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Avg. Purchase Price
                      <InfoTooltip title="Average Purchase Price" text="The average cost per share when you purchased this stock." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Current Price
                      <InfoTooltip title="Current Price" text="The latest market price per share on the NSE/BSE." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Invested Amount
                      <InfoTooltip title="Invested Amount" text="Total virtual money you paid to acquire these shares (Quantity × Avg Price)." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Current Value
                      <InfoTooltip title="Current Value" text="What your shares are worth right now (Quantity × Current Price)." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Profit / Loss
                      <InfoTooltip title="Profit / Loss" text="The cash difference between what you paid and current market value." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>Percentage Return</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const isHoldingProfit = Number(h.pnl) >= 0;
                  return (
                    <tr key={h.symbol}>
                      {/* 1. Company Name & 2. Symbol */}
                      <td>
                        <div
                          onClick={() => navigate(`/stock/${h.symbol}`)}
                          style={{ cursor: 'pointer' }}
                          title="View Stock Details"
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {h.symbol}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {h.companyName}
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                          }}
                        >
                          {h.sector || 'Equities'}
                        </span>
                      </td>

                      {/* 3. Quantity */}
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                        {h.shares}
                      </td>

                      {/* 4. Average Purchase Price */}
                      <td className="mono-num" style={{ textAlign: 'right' }}>
                        ₹{Number(h.averageBuyPrice).toFixed(2)}
                      </td>

                      {/* 5. Current Price */}
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{Number(h.currentPrice).toFixed(2)}
                      </td>

                      {/* 6. Invested Amount */}
                      <td className="mono-num" style={{ textAlign: 'right' }}>
                        ₹{Number(h.investedAmount || h.investedValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 7. Current Value */}
                      <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700 }}>
                        ₹{Number(h.currentValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* 8. Profit / Loss */}
                      <td style={{ textAlign: 'right' }}>
                        <span
                          className={`mono-num ${isHoldingProfit ? 'profit-text' : 'loss-text'}`}
                          style={{ fontWeight: 700, fontSize: '0.9rem' }}
                        >
                          {isHoldingProfit ? '+' : ''}₹{Number(h.pnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* 9. Percentage Return */}
                      <td style={{ textAlign: 'right' }}>
                        <Badge value={h.pnlPercent} />
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenTrade(h.symbol, 'BUY')}
                            className="btn-buy"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            title={`Buy more shares of ${h.symbol}`}
                          >
                            Buy More
                          </button>
                          <button
                            onClick={() => handleOpenTrade(h.symbol, 'SELL')}
                            className="btn-sell"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            title={`Sell or exit position in ${h.symbol}`}
                          >
                            Sell / Exit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Trade Modal */}
      <QuickTradeModal
        isOpen={isTradeModalOpen}
        onClose={handleModalClose}
        stock={selectedStock}
        defaultType={tradeType}
      />

      {/* Beginner Glossary Modal */}
      <BeginnerGlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
};
