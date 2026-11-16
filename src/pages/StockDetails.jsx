import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Info,
  ShieldCheck,
  CheckCircle,
  Share2,
  RefreshCw,
  Clock,
  Layers,
  BarChart2,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { StockChart } from '../components/charts/StockChart';
import { Badge } from '../components/common/Badge';
import { InfoTooltip } from '../components/common/InfoTooltip';
import { useToast } from '../components/common/Toast';
import { useWallet } from '../context/WalletContext';
import { OrderReceiptModal } from '../components/trade/OrderReceiptModal';
import { api } from '../services/api';
import { ALL_STOCKS } from '../mockData/marketData';

export const StockDetails = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { wallet, refreshWallet } = useWallet();

  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User holding state
  const [userHolding, setUserHolding] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watchlist bookmark state
  const [userWatchlists, setUserWatchlists] = useState([]);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const res = await api('/api/watchlists');
        if (res.success && Array.isArray(res.data)) {
          setUserWatchlists(res.data);
          const cleanSym = (symbol || '').toUpperCase();
          const inList = res.data.some((wl) =>
            (wl.stocks || []).some((s) => (s.symbol || s).toUpperCase() === cleanSym)
          );
          setIsBookmarked(inList);
        }
      } catch (err) {}
    };
    checkBookmarkStatus();
  }, [symbol]);

  // Receipt modal state
  const [receipt, setReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Order state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'depth' | 'financials'
  const [orderType, setOrderType] = useState('BUY'); // BUY or SELL
  const [tradeExecutionType, setTradeExecutionType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(0);

  // Fetch real stock details from backend
  const fetchStock = async () => {
    try {
      const res = await fetch(`/api/stocks/${symbol}`);
      if (!res.ok) {
        throw new Error(`Stock ticker ${symbol?.toUpperCase()} not found`);
      }
      const result = await res.json();
      if (result.success && result.data) {
        setStock(result.data);
        setLimitPrice(result.data.price);
      } else {
        throw new Error(result.message || 'Failed to retrieve stock');
      }
    } catch (err) {
      console.warn('[StockDetails API fallback]', err.message);
      const local = ALL_STOCKS.find((s) => s.symbol === symbol?.toUpperCase()) || ALL_STOCKS[0];
      setStock(local);
      setLimitPrice(local.price);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user holding for this stock
  const fetchHolding = async () => {
    if (!symbol) return;
    try {
      const res = await api(`/api/trade/holding/${symbol.toUpperCase()}`);
      if (res.success) {
        setUserHolding(res.data);
      }
    } catch (err) {
      setUserHolding(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchStock();
    fetchHolding();
  }, [symbol]);

  if (loading) {
    return (
      <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
        <RefreshCw size={32} className="spin-icon" style={{ margin: '0 auto 16px', color: 'var(--color-primary-blue)' }} />
        <h2 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>Loading Stock Information</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Retrieving live quotes and historical price charts...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <AlertCircle size={40} color="var(--color-loss)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Stock Ticker Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Could not locate symbol "{symbol}". It may be delisted or invalid.
        </p>
        <button onClick={() => navigate('/markets')} className="btn-primary" style={{ padding: '8px 18px' }}>
          Back to Markets
        </button>
      </div>
    );
  }

  const priceToUse =
    tradeExecutionType === 'MARKET' ? stock.price : Number(limitPrice) || stock.price;
  const orderTotal = priceToUse * (Number(quantity) || 1);
  const availableBalance = Number(wallet.availableBalance || 100000.0);
  const ownedShares = userHolding ? Number(userHolding.shares || 0) : 0;

  // Validation
  const isInsufficientFunds = orderType === 'BUY' && orderTotal > availableBalance;
  const isInsufficientShares = orderType === 'SELL' && (ownedShares === 0 || quantity > ownedShares);

  // Beginner calculations
  const remainingCashAfterOrder = Math.max(0, availableBalance - orderTotal);
  const avgBuyPrice = userHolding ? Number(userHolding.averageBuyPrice || 0) : 0;
  const sellDiffPerShare = priceToUse - avgBuyPrice;
  const totalSellDiff = sellDiffPerShare * (Number(quantity) || 1);
  const sellDiffPercent = avgBuyPrice > 0 ? ((priceToUse - avgBuyPrice) / avgBuyPrice) * 100 : 0;

  const handleQuickPercent = (pct) => {
    if (ownedShares <= 0) return;
    const qty = Math.max(1, Math.floor((ownedShares * pct) / 100));
    setQuantity(qty);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();

    if (quantity <= 0 || !Number.isInteger(Number(quantity))) {
      addToast('Please enter a valid whole number of shares (minimum 1).', 'error');
      return;
    }

    if (orderType === 'BUY' && isInsufficientFunds) {
      addToast(
        `Insufficient virtual balance! Required ₹${orderTotal.toLocaleString('en-IN')}, available ₹${availableBalance.toLocaleString('en-IN')}`,
        'error'
      );
      return;
    }

    if (orderType === 'SELL' && isInsufficientShares) {
      addToast(
        `Insufficient shares! You only own ${ownedShares} shares of ${stock.symbol}.`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = orderType === 'BUY' ? '/api/trade/buy' : '/api/trade/sell';
      const payload = {
        symbol: stock.symbol,
        quantity: Number(quantity),
        orderType: tradeExecutionType,
        limitPrice: tradeExecutionType === 'LIMIT' ? Number(limitPrice) : undefined,
      };

      const res = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success && res.data) {
        // Refresh global wallet state & local holding
        await refreshWallet();
        await fetchHolding();

        setReceipt(res.data);
        setIsReceiptOpen(true);

        addToast(
          `${orderType} order executed successfully for ${quantity} shares of ${stock.symbol}!`,
          'success'
        );
      } else {
        throw new Error(res.message || 'Trade execution failed.');
      }
    } catch (err) {
      addToast(err.message || 'Could not execute trade.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWatchlist = async () => {
    const cleanSym = (stock?.symbol || symbol || '').toUpperCase();
    const primaryWl = userWatchlists[0];
    if (!primaryWl) {
      addToast('Watchlist initialized. Please try again.', 'info');
      try {
        const res = await api('/api/watchlists');
        if (res.success) setUserWatchlists(res.data);
      } catch (err) {}
      return;
    }

    if (isBookmarked) {
      try {
        const res = await api(`/api/watchlists/${primaryWl.id}/stocks/${cleanSym}`, { method: 'DELETE' });
        if (res.success) {
          setIsBookmarked(false);
          addToast(`${cleanSym} removed from Watchlist`, 'info');
        }
      } catch (err) {
        addToast(err.message, 'error');
      }
    } else {
      try {
        const res = await api(`/api/watchlists/${primaryWl.id}/stocks`, {
          method: 'POST',
          body: JSON.stringify({ symbol: cleanSym }),
        });
        if (res.success) {
          setIsBookmarked(true);
          addToast(`${cleanSym} added to Watchlist`, 'success');
        }
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  // Calculate day range percentage for progress bar
  const dayRangeSpread = (stock.dayHigh || stock.price) - (stock.dayLow || stock.price);
  const dayPos = dayRangeSpread > 0 ? ((stock.price - stock.dayLow) / dayRangeSpread) * 100 : 50;

  // Calculate 52-week range percentage
  const high52 = stock.high52 || stock.dayHigh || stock.price * 1.2;
  const low52 = stock.low52 || stock.dayLow || stock.price * 0.8;
  const yearSpread = high52 - low52;
  const yearPos = yearSpread > 0 ? ((stock.price - low52) / yearSpread) * 100 : 50;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Navigation Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate('/markets')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} /> Back to Market Explorer
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleWatchlist}
            className="btn-secondary"
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: isBookmarked ? 'var(--color-primary-blue)' : 'var(--border-subtle)',
              color: isBookmarked ? 'var(--color-primary-blue)' : 'var(--text-secondary)',
            }}
          >
            <Bookmark size={15} fill={isBookmarked ? 'var(--color-primary-blue)' : 'none'} />
            {isBookmarked ? 'In Watchlist' : 'Add to Watchlist'}
          </button>
          <button
            onClick={() => addToast('Stock ticker link copied', 'info')}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
          >
            <Share2 size={15} />
          </button>
        </div>
      </div>

      {/* Stock Quote Header */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.8rem', margin: 0, letterSpacing: '-0.02em' }}>{stock.symbol}</h1>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                fontWeight: 700,
              }}
            >
              {stock.exchange || 'NSE'} Equity
            </span>

            {/* Data Source Badge */}
            <span
              style={{
                fontSize: '0.72rem',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: stock.dataSource === 'LIVE' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                color: stock.dataSource === 'LIVE' ? 'var(--color-primary-blue)' : 'var(--color-warning)',
                fontWeight: 600,
              }}
              title="Data provenance indicator"
            >
              {stock.dataSource === 'LIVE' ? '● Live Market Feed' : 'Verified Educational Data'}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            {stock.name} • <span style={{ color: 'var(--color-primary-blue)', fontWeight: 600 }}>{stock.sector}</span>
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono-num" style={{ fontSize: '2.1rem', fontWeight: 800 }}>
            ₹{Number(stock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <Badge value={stock.changePercent} />
            <span
              className={stock.change >= 0 ? 'profit-text mono-num' : 'loss-text mono-num'}
              style={{ fontSize: '0.9rem', fontWeight: 600 }}
            >
              {stock.change >= 0 ? `+₹${stock.change.toFixed(2)}` : `-₹${Math.abs(stock.change).toFixed(2)}`} Today
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Analysis & Interactive Chart (Left) vs Order Execution Box (Right) */}
      <div className="stock-details-grid">
        {/* Left Column: Interactive Price Chart & Analysis Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Subtabs for Overview vs Market Depth */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '8px',
            }}
          >
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 14px',
                fontSize: '0.88rem',
                fontWeight: activeTab === 'overview' ? 700 : 500,
                color: activeTab === 'overview' ? 'var(--color-primary-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'overview' ? '2px solid var(--color-primary-blue)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Interactive Price Chart
            </button>
            <button
              onClick={() => setActiveTab('depth')}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '6px 14px',
                fontSize: '0.88rem',
                fontWeight: activeTab === 'depth' ? 700 : 500,
                color: activeTab === 'depth' ? 'var(--color-primary-blue)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'depth' ? '2px solid var(--color-primary-blue)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              Market Depth (Order Book)
            </button>
          </div>

          {activeTab === 'overview' ? (
            /* Interactive Historical Price Chart (Supports 1D, 1W, 1M, 3M, 6M, 1Y) */
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Historical Price Action</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Filters: 1D, 1W, 1M, 3M, 6M, 1Y
                </span>
              </div>
              <StockChart chartData={stock.chartData} isPositive={stock.changePercent >= 0} />
            </div>
          ) : (
            /* Market Depth / Order Book View */
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '14px' }}>Market Depth (L2 Bid / Ask Levels)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Bids Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-profit)', fontWeight: 700, marginBottom: '6px' }}>
                    <span>BUY ORDERS</span>
                    <span>QTY</span>
                    <span>BID PRICE</span>
                  </div>
                  {stock.marketDepth?.bids?.map((bid, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>{bid.orders}</span>
                      <span className="mono-num">{bid.quantity.toLocaleString('en-IN')}</span>
                      <span className="mono-num profit-text" style={{ fontWeight: 700 }}>₹{bid.price.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginTop: '8px' }}>
                    <span>Total Bid Qty:</span>
                    <span className="mono-num">{stock.marketDepth?.totalBidQty?.toLocaleString('en-IN') || '25,400'}</span>
                  </div>
                </div>

                {/* Asks Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--color-loss)', fontWeight: 700, marginBottom: '6px' }}>
                    <span>ASK PRICE</span>
                    <span>QTY</span>
                    <span>SELL ORDERS</span>
                  </div>
                  {stock.marketDepth?.asks?.map((ask, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.82rem',
                        padding: '5px 0',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span className="mono-num loss-text" style={{ fontWeight: 700 }}>₹{ask.price.toFixed(2)}</span>
                      <span className="mono-num">{ask.quantity.toLocaleString('en-IN')}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{ask.orders}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginTop: '8px' }}>
                    <span>Total Ask Qty:</span>
                    <span className="mono-num">{stock.marketDepth?.totalAskQty?.toLocaleString('en-IN') || '23,250'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Range Sliders: Day Range & 52-Week Range */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Performance Ranges</h3>
              <InfoTooltip
                title="What are Price Ranges?"
                text="The low and high boundaries this stock traded between. Shows if the current price is near its day/year low or high."
                tip="Buying near a 52-week low might mean a bargain, but check why the price fell!"
              />
            </div>

            {/* Day Low / High Range */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Today's Low: <b className="mono-num">₹{stock.dayLow || stock.price}</b></span>
                <span style={{ color: 'var(--text-secondary)' }}>Today's High: <b className="mono-num">₹{stock.dayHigh || stock.price}</b></span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: `${Math.max(2, Math.min(98, dayPos))}%`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-blue)',
                    boxShadow: '0 0 6px var(--color-primary-blue)',
                  }}
                  title={`Current Price: ₹${stock.price}`}
                />
              </div>
            </div>

            {/* 52-Week Low / High Range */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>52W Low: <b className="mono-num">₹{low52}</b></span>
                <span style={{ color: 'var(--text-secondary)' }}>52W High: <b className="mono-num">₹{high52}</b></span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: `${Math.max(2, Math.min(98, yearPos))}%`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-profit)',
                    boxShadow: '0 0 6px var(--color-profit)',
                  }}
                  title={`Current Price: ₹${stock.price}`}
                />
              </div>
            </div>
          </div>

          {/* Fundamentals & Key Ratios */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Fundamentals & Key Ratios</h3>
              <InfoTooltip
                title="Beginner Fundamental Guide"
                text="These metrics show company size (Market Cap), valuation (P/E), and trading activity (Volume)."
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Market Cap</span>
                  <InfoTooltip
                    title="Market Capitalization"
                    text="Total market worth of all company shares. Large Cap (>₹20,000 Cr) are stable giants like Reliance, TCS, and Infosys."
                  />
                </div>
                <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stock.marketCap}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>P/E Ratio</span>
                  <InfoTooltip
                    title="Price-to-Earnings (P/E)"
                    text="How much you pay for ₹1 of annual company profit. Lower P/E can mean good value, while higher P/E reflects high growth expectations."
                  />
                </div>
                <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stock.pe}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Trading Volume</span>
                  <InfoTooltip
                    title="Trading Volume"
                    text="Number of shares traded today. Higher volume means high liquidity — easy to buy or sell without delay."
                  />
                </div>
                <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stock.volume}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Open Price</span>
                  <InfoTooltip
                    title="Opening Price"
                    text="The share price when the market opened at 9:15 AM today."
                  />
                </div>
                <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{stock.openPrice || stock.price}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Previous Close</span>
                  <InfoTooltip
                    title="Previous Close"
                    text="The final price this stock traded at when the market closed yesterday at 3:30 PM."
                  />
                </div>
                <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>₹{stock.prevClose || stock.price}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Exchange</span>
                  <InfoTooltip
                    title="Stock Exchange"
                    text="The official marketplace where this stock is traded (NSE = National Stock Exchange, BSE = Bombay Stock Exchange)."
                  />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stock.exchange || 'NSE'}</div>
              </div>
            </div>
          </div>

          {/* About Company */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>About {stock.name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
              {stock.about || 'Leading publicly traded Indian corporation listed on the National Stock Exchange of India and Bombay Stock Exchange.'}
            </p>
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '6px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>💡 <b>Beginner Tip:</b> Investing in established sector leaders like {stock.name} helps build a steady, lower-volatility foundation in your portfolio.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Live Order Execution Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '90px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Order Execution</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time virtual stock order routing</p>
          </div>

          {/* Buy/Sell Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: 'var(--border-radius-sm)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setOrderType('BUY');
                setQuantity(1);
              }}
              style={{
                padding: '8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                backgroundColor: orderType === 'BUY' ? 'var(--color-profit)' : 'transparent',
                color: orderType === 'BUY' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderType('SELL');
                if (ownedShares > 0) setQuantity(Math.min(quantity, ownedShares));
              }}
              style={{
                padding: '8px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                backgroundColor: orderType === 'SELL' ? 'var(--color-loss)' : 'transparent',
                color: orderType === 'SELL' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              SELL
            </button>
          </div>

          {/* Position details if in SELL mode */}
          {orderType === 'SELL' && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: ownedShares > 0 ? 'rgba(37, 99, 235, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${ownedShares > 0 ? 'rgba(37, 99, 235, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                fontSize: '0.82rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Owned Shares:</span>
              <div style={{ textAlign: 'right' }}>
                <span className="mono-num" style={{ fontWeight: 800, color: ownedShares > 0 ? 'var(--text-primary)' : 'var(--color-loss)' }}>
                  {ownedShares} {ownedShares === 1 ? 'Share' : 'Shares'}
                </span>
                {ownedShares > 0 && userHolding && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Avg: ₹{userHolding.averageBuyPrice.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Market vs Limit Selector */}
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="orderExecution"
                checked={tradeExecutionType === 'MARKET'}
                onChange={() => setTradeExecutionType('MARKET')}
              />
              Market Order
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="orderExecution"
                checked={tradeExecutionType === 'LIMIT'}
                onChange={() => setTradeExecutionType('LIMIT')}
              />
              Limit Order
            </label>
          </div>

          <form onSubmit={handleOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Quantity */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Quantity (Shares)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                }}
              />
            </div>

            {/* Quick sell buttons */}
            {orderType === 'SELL' && ownedShares > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sell:</span>
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className="btn-secondary"
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-secondary)',
                    }}
                  >
                    {pct === 100 ? '100%' : `${pct}%`}
                  </button>
                ))}
              </div>
            )}

            {/* Limit Price if Limit order */}
            {tradeExecutionType === 'LIMIT' && (
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Limit Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
            )}

            {/* Calculation summary & Beginner Breakdown */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary)',
                padding: '12px 14px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderLeft: `4px solid ${orderType === 'BUY' ? 'var(--color-profit)' : 'var(--color-loss)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Price per Share:</span>
                <span className="mono-num">₹{priceToUse.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px' }}>
                <span style={{ fontWeight: 600 }}>Total Order Value:</span>
                <span className="mono-num" style={{ fontWeight: 800, color: orderType === 'BUY' ? 'var(--color-profit)' : 'var(--color-loss)' }}>
                  ₹{orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Wallet After Trade:</span>
                <span className="mono-num" style={{ color: 'var(--color-profit)', fontWeight: 700 }}>
                  ₹{orderType === 'BUY' ? remainingCashAfterOrder.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : (availableBalance + orderTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Beginner outcome note */}
              {orderType === 'BUY' ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px' }}>
                  💡 <i>Buying {quantity} {quantity === 1 ? 'share' : 'shares'} with virtual cash. When {stock.symbol} rises above ₹{priceToUse.toFixed(2)}, you will make a profit!</i>
                </div>
              ) : ownedShares > 0 ? (
                <div style={{ fontSize: '0.74rem', marginTop: '4px', borderTop: '1px dashed var(--border-subtle)', paddingTop: '6px' }}>
                  <span className={totalSellDiff >= 0 ? 'profit-text' : 'loss-text'} style={{ fontWeight: 700 }}>
                    {totalSellDiff >= 0 ? `🎉 Estimated Profit: +₹${totalSellDiff.toFixed(2)} (+${sellDiffPercent.toFixed(2)}%)` : `⚠️ Estimated Loss: -₹${Math.abs(totalSellDiff).toFixed(2)} (${sellDiffPercent.toFixed(2)}%)`}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Validation alerts */}
            {orderType === 'BUY' && isInsufficientFunds && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-loss)',
                  fontSize: '0.78rem',
                }}
              >
                <AlertCircle size={14} />
                <span>Insufficient virtual cash. Reduce order quantity.</span>
              </div>
            )}

            {orderType === 'SELL' && isInsufficientShares && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-loss)',
                  fontSize: '0.78rem',
                }}
              >
                <AlertCircle size={14} />
                <span>
                  {ownedShares === 0 ? 'No shares owned in portfolio.' : `Cannot sell more than ${ownedShares} shares.`}
                </span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || (orderType === 'BUY' && isInsufficientFunds) || (orderType === 'SELL' && isInsufficientShares)}
              className={orderType === 'BUY' ? 'btn-buy' : 'btn-sell'}
              style={{
                padding: '12px',
                fontSize: '0.9rem',
                width: '100%',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isSubmitting || (orderType === 'BUY' && isInsufficientFunds) || (orderType === 'SELL' && isInsufficientShares) ? 0.6 : 1,
                cursor: isSubmitting || (orderType === 'BUY' && isInsufficientFunds) || (orderType === 'SELL' && isInsufficientShares) ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin-icon" />
                  <span>Executing Order...</span>
                </>
              ) : (
                <span>
                  Confirm {orderType} ({quantity} {quantity === 1 ? 'Share' : 'Shares'})
                </span>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
              <ShieldCheck size={14} color="var(--color-profit)" />
              <span>Simulated execution with instant portfolio & ledger sync</span>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Receipt Modal */}
      <OrderReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />
    </div>
  );
};
