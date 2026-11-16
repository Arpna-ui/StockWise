import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Bookmark,
  Zap,
  Grid,
  List,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
  Building2,
  Cpu,
  Car,
  HeartPulse,
  Flame,
  ShoppingBag,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { InfoTooltip } from '../components/common/InfoTooltip';
import { BeginnerGlossaryModal } from '../components/common/BeginnerGlossaryModal';
import { QuickTradeModal } from '../components/trade/QuickTradeModal';
import { useToast } from '../components/common/Toast';
import { ALL_STOCKS } from '../mockData/marketData';
import { api } from '../services/api';

export const Markets = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // State
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters, Search, and Tabs
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState('all'); // 'all', 'gainers', 'losers', 'active', 'banking', 'it', 'automobile', 'healthcare', 'energy', 'fmcg'
  const [exchangeFilter, setExchangeFilter] = useState('ALL'); // 'ALL', 'NSE', 'BSE'
  const [sortBy, setSortBy] = useState('marketCap'); // 'marketCap', 'price', 'changePercent', 'volume', 'symbol'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginationInfo, setPaginationInfo] = useState({
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  // Market status & data provenance metadata
  const [marketStatus, setMarketStatus] = useState(null);
  const [dataSource, setDataSource] = useState('SAMPLE_DATA');
  const [dataSourceLabel, setDataSourceLabel] = useState('Sample Market Data (NSE/BSE Reference)');

  // Quick Trade Modal
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Sections configuration as required
  const SECTIONS = [
    { id: 'all', label: 'All Stocks', icon: null },
    { id: 'gainers', label: 'Top Gainers', icon: TrendingUp, color: 'var(--color-profit)' },
    { id: 'losers', label: 'Top Losers', icon: TrendingDown, color: 'var(--color-loss)' },
    { id: 'active', label: 'Most Active', icon: Zap, color: 'var(--color-warning)' },
    { id: 'banking', label: 'Banking', icon: Building2 },
    { id: 'it', label: 'IT', icon: Cpu },
    { id: 'automobile', label: 'Automobile', icon: Car },
    { id: 'healthcare', label: 'Healthcare', icon: HeartPulse },
    { id: 'energy', label: 'Energy', icon: Flame },
    { id: 'fmcg', label: 'FMCG', icon: ShoppingBag },
  ];

  // Fetch stocks from backend API
  const fetchStocks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        section: activeSection,
        sort: sortBy,
        order: sortOrder,
      });

      if (search.trim()) {
        queryParams.set('search', search.trim());
      }

      if (exchangeFilter !== 'ALL') {
        queryParams.set('exchange', exchangeFilter);
      }

      const res = await fetch(`/api/stocks?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load stocks (Status ${res.status})`);
      }

      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setStocks(result.data);
        if (result.meta?.pagination) {
          setPaginationInfo(result.meta.pagination);
        }
        if (result.meta?.marketStatus) {
          setMarketStatus(result.meta.marketStatus);
        }
        if (result.meta?.dataSource) {
          setDataSource(result.meta.dataSource);
          setDataSourceLabel(result.meta.dataSourceLabel || 'Sample Market Data (NSE/BSE Reference)');
        }
      } else {
        throw new Error(result.message || 'Invalid response structure');
      }
    } catch (err) {
      console.warn('[Markets fetch warning]', err.message, '- falling back gracefully');
      setError(err.message);

      // Graceful offline fallback
      let fallback = ALL_STOCKS.filter((s) => !s.isIndex);
      if (activeSection === 'gainers') {
        fallback = fallback.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
      } else if (activeSection === 'losers') {
        fallback = fallback.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);
      }
      setStocks(fallback.slice((currentPage - 1) * pageSize, currentPage * pageSize));
      setPaginationInfo({
        total: fallback.length,
        totalPages: Math.ceil(fallback.length / pageSize),
        hasNext: currentPage * pageSize < fallback.length,
        hasPrev: currentPage > 1,
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, activeSection, search, exchangeFilter, sortBy, sortOrder]);

  // Refetch when parameters change
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  // Handle section tab switch
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setCurrentPage(1); // Reset to page 1 on section tab change
  };

  const [userWatchlists, setUserWatchlists] = useState([]);

  useEffect(() => {
    const fetchUserWatchlists = async () => {
      try {
        const res = await api('/api/watchlists');
        if (res.success && Array.isArray(res.data)) {
          setUserWatchlists(res.data);
        }
      } catch (err) {}
    };
    fetchUserWatchlists();
  }, []);

  const bookmarkedSymbols = useMemo(() => {
    const set = new Set();
    userWatchlists.forEach((wl) => {
      (wl.stocks || []).forEach((s) => {
        set.add((s.symbol || s).toUpperCase());
      });
    });
    return set;
  }, [userWatchlists]);

  const handleOpenTrade = (e, stock, type) => {
    e.stopPropagation();
    setSelectedStock(stock);
    setTradeType(type);
    setIsTradeModalOpen(true);
  };

  const handleToggleWatchlist = async (e, stock) => {
    e.stopPropagation();
    const sym = stock.symbol.toUpperCase();
    const primaryWl = userWatchlists[0];
    if (!primaryWl) {
      addToast('Watchlist initialized. Please try again.', 'info');
      try {
        const res = await api('/api/watchlists');
        if (res.success) setUserWatchlists(res.data);
      } catch (err) {}
      return;
    }

    const isBookmarked = bookmarkedSymbols.has(sym);
    if (isBookmarked) {
      try {
        const res = await api(`/api/watchlists/${primaryWl.id}/stocks/${sym}`, { method: 'DELETE' });
        if (res.success) {
          addToast(`${sym} removed from Watchlist`, 'info');
          const refresh = await api('/api/watchlists');
          if (refresh.success) setUserWatchlists(refresh.data);
        }
      } catch (err) {
        addToast(err.message, 'error');
      }
    } else {
      try {
        const res = await api(`/api/watchlists/${primaryWl.id}/stocks`, {
          method: 'POST',
          body: JSON.stringify({ symbol: sym }),
        });
        if (res.success) {
          addToast(`${sym} added to Watchlist`, 'success');
          const refresh = await api('/api/watchlists');
          if (refresh.success) setUserWatchlists(refresh.data);
        }
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar with Market Status and Data Provenance Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>Stock Market Explorer</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Real-time NSE and BSE stock quotes, market sectors, volume movers, and valuation analytics.
          </p>
        </div>

        {/* Indicators: Market Hours Status & Data Source Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Market Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: marketStatus?.isOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(156, 163, 175, 0.12)',
              color: marketStatus?.isOpen ? 'var(--color-profit)' : 'var(--text-secondary)',
              border: `1px solid ${marketStatus?.isOpen ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
            }}
            title={marketStatus?.message || 'Indian Stock Markets (NSE/BSE)'}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: marketStatus?.isOpen ? 'var(--color-profit)' : 'var(--text-muted)',
              }}
            />
            <span>{marketStatus?.isOpen ? 'Market Open' : 'Market Closed'}</span>
            {marketStatus?.currentTimeIST && (
              <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>• {marketStatus.currentTimeIST}</span>
            )}
          </div>

          {/* Data Provenance Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 600,
              backgroundColor: dataSource === 'LIVE' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: dataSource === 'LIVE' ? 'var(--color-primary-blue)' : 'var(--color-warning)',
              border: `1px solid ${dataSource === 'LIVE' ? 'rgba(59, 130, 246, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
            }}
            title="Data is clearly distinguished as live, delayed, or educational sample data."
          >
            <Info size={13} />
            <span>{dataSource === 'LIVE' ? 'Live NSE/BSE Feed' : 'Verified Sample Data'}</span>
          </div>

          {/* Beginner Guide Pill */}
          <button
            onClick={() => setIsGlossaryOpen(true)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={14} color="var(--color-primary-blue)" /> 🎓 Beginner Guide
          </button>

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '3px',
              gap: '2px',
            }}
          >
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: viewMode === 'table' ? 'var(--color-primary-blue)' : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <List size={16} /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: viewMode === 'grid' ? 'var(--color-primary-blue)' : 'transparent',
                color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Grid size={16} /> Grid
            </button>
          </div>
        </div>
      </div>

      {/* Beginner Helper Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 18px',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.84rem',
        }}
      >
        <Sparkles size={18} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
        <div style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>Beginner Tip: </strong>
          Filter by industry sectors below (e.g. <b>IT</b>, <b>Banking</b>, or <b>Automobile</b>). For safe first-time practice, start with familiar large companies like <b>TCS</b> or <b>Reliance</b>, click <b>Buy</b>, and test your trading instincts!
        </div>
      </div>
      <div
        className="card"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        {SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => handleSectionChange(sec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                backgroundColor: isActive ? 'var(--color-primary-blue)' : 'var(--bg-secondary)',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                border: `1px solid ${isActive ? 'var(--color-primary-blue)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {Icon && <Icon size={14} color={isActive ? '#FFFFFF' : sec.color || 'currentColor'} />}
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search, Filter, and Sorting Controls */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Keyword Search */}
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '8px 14px',
            }}
          >
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search Indian stocks (e.g., RELIANCE, TCS, Tata Motors)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                width: '100%',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Exchange Filter: ALL, NSE, BSE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Exchange:</span>
            <select
              value={exchangeFilter}
              onChange={(e) => {
                setExchangeFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="ALL">All Exchanges</option>
              <option value="NSE">NSE Only</option>
              <option value="BSE">BSE Only</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <option value="marketCap">Market Capitalization</option>
              <option value="price">Stock Price</option>
              <option value="changePercent">Day Movement (%)</option>
              <option value="volume">Trading Volume</option>
              <option value="symbol">Ticker Symbol (A-Z)</option>
            </select>
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn-secondary"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title={`Sort order: ${sortOrder === 'desc' ? 'Descending' : 'Ascending'}`}
          >
            <ArrowUpDown size={15} />
            <span style={{ fontSize: '0.8rem' }}>{sortOrder === 'desc' ? 'High → Low' : 'Low → High'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={fetchStocks}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Refresh Quotes"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Main Stock Data Display */}
      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={28} className="spin-icon" style={{ margin: '0 auto 12px', color: 'var(--color-primary-blue)' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading market explorer data...</p>
        </div>
      ) : stocks.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Info size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>No stocks matched your query</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 16px' }}>
            Try clearing search filters or switching to the "All Stocks" section.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setActiveSection('all');
              setExchangeFilter('ALL');
            }}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* ===================== TABLE VIEW ===================== */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Company & Ticker</th>
                  <th>Exchange</th>
                  <th>Sector</th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Last Price
                      <InfoTooltip title="Last Price" text="Current live quote per share on the stock exchange." />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Day Change
                      <InfoTooltip title="Day Change" text="Price change today compared to yesterday's closing price. Green is gain; red is drop." />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Volume
                      <InfoTooltip title="Trading Volume" text="Total quantity of shares traded today on the market." />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      Market Cap
                      <InfoTooltip title="Market Capitalization" text="Total company value. Large Cap (>₹20,000 Cr) companies are typically safer for beginners." />
                    </span>
                  </th>
                  <th>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      P/E
                      <InfoTooltip title="P/E Ratio" text="Price-to-Earnings valuation ratio. Lower P/E often indicates good value." />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right' }}>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={(e) => handleToggleWatchlist(e, stock)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: bookmarkedSymbols.has(stock.symbol.toUpperCase())
                              ? 'var(--color-primary-blue)'
                              : 'var(--text-muted)',
                            padding: '4px',
                            cursor: 'pointer',
                          }}
                          title={
                            bookmarkedSymbols.has(stock.symbol.toUpperCase())
                              ? 'Remove from Watchlist'
                              : 'Save to Watchlist'
                          }
                        >
                          <Bookmark
                            size={15}
                            fill={
                              bookmarkedSymbols.has(stock.symbol.toUpperCase())
                                ? 'var(--color-primary-blue)'
                                : 'none'
                            }
                          />
                        </button>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                            {stock.symbol}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {stock.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {stock.exchange || 'NSE'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {stock.sector}
                      </span>
                    </td>
                    <td>
                      <span className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        ₹{Number(stock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Badge value={stock.changePercent} />
                        <span
                          className={stock.change >= 0 ? 'profit-text mono-num' : 'loss-text mono-num'}
                          style={{ fontSize: '0.8rem' }}
                        >
                          {stock.change >= 0 ? `+₹${stock.change.toFixed(2)}` : `-₹${Math.abs(stock.change).toFixed(2)}`}
                        </span>
                      </div>
                    </td>
                    <td className="mono-num" style={{ fontSize: '0.85rem' }}>{stock.volume || '1.0M'}</td>
                    <td className="mono-num" style={{ fontSize: '0.85rem' }}>{stock.marketCap}</td>
                    <td className="mono-num" style={{ fontSize: '0.85rem' }}>{stock.pe || '20.0'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={(e) => handleOpenTrade(e, stock, 'BUY')}
                          className="btn-buy"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Buy
                        </button>
                        <button
                          onClick={(e) => handleOpenTrade(e, stock, 'SELL')}
                          className="btn-sell"
                          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                        >
                          Sell
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ===================== GRID VIEW ===================== */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '16px',
          }}
        >
          {stocks.map((stock) => (
            <div
              key={stock.symbol}
              className="card"
              onClick={() => navigate(`/stock/${stock.symbol}`)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>{stock.symbol}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      {stock.exchange || 'NSE'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {stock.name}
                  </div>
                </div>
                <button
                  onClick={(e) => handleToggleWatchlist(e, stock)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: bookmarkedSymbols.has(stock.symbol.toUpperCase())
                      ? 'var(--color-primary-blue)'
                      : 'var(--text-muted)',
                    padding: '4px',
                    cursor: 'pointer',
                  }}
                  title={
                    bookmarkedSymbols.has(stock.symbol.toUpperCase())
                      ? 'Remove from Watchlist'
                      : 'Save to Watchlist'
                  }
                >
                  <Bookmark
                    size={16}
                    fill={
                      bookmarkedSymbols.has(stock.symbol.toUpperCase())
                        ? 'var(--color-primary-blue)'
                        : 'none'
                    }
                  />
                </button>
              </div>

              <div>
                <div className="mono-num" style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  ₹{Number(stock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <Badge value={stock.changePercent} />
                  <span
                    className={stock.change >= 0 ? 'profit-text mono-num' : 'loss-text mono-num'}
                    style={{ fontSize: '0.8rem' }}
                  >
                    {stock.change >= 0 ? `+₹${stock.change.toFixed(2)}` : `-₹${Math.abs(stock.change).toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '10px',
                  fontSize: '0.74rem',
                  color: 'var(--text-secondary)',
                }}
              >
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>P/E</div>
                  <b className="mono-num">{stock.pe || '20.0'}</b>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Volume</div>
                  <b className="mono-num">{stock.volume}</b>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)' }}>Sector</div>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {stock.sector}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={(e) => handleOpenTrade(e, stock, 'BUY')}
                  className="btn-buy"
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                >
                  Buy
                </button>
                <button
                  onClick={(e) => handleOpenTrade(e, stock, 'SELL')}
                  className="btn-sell"
                  style={{ padding: '8px', fontSize: '0.82rem' }}
                >
                  Sell
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 20px',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing{' '}
          <b style={{ color: 'var(--text-primary)' }}>
            {paginationInfo.total > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </b>{' '}
          to{' '}
          <b style={{ color: 'var(--text-primary)' }}>
            {Math.min(currentPage * pageSize, paginationInfo.total)}
          </b>{' '}
          of <b style={{ color: 'var(--text-primary)' }}>{paginationInfo.total}</b> stocks
        </div>

        {/* Page navigation buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={!paginationInfo.hasPrev || loading}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: paginationInfo.hasPrev ? 1 : 0.4,
              cursor: paginationInfo.hasPrev ? 'pointer' : 'not-allowed',
            }}
          >
            <ChevronLeft size={15} /> Prev
          </button>

          <span style={{ fontSize: '0.82rem', padding: '0 8px', color: 'var(--text-secondary)' }}>
            Page <b style={{ color: 'var(--text-primary)' }}>{currentPage}</b> of {paginationInfo.totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!paginationInfo.hasNext || loading}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: paginationInfo.hasNext ? 1 : 0.4,
              cursor: paginationInfo.hasNext ? 'pointer' : 'not-allowed',
            }}
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Quick Trade Execution Modal */}
      <QuickTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
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
