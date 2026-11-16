import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  Search,
  RefreshCw,
  FolderPlus,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { QuickTradeModal } from '../components/trade/QuickTradeModal';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';
import { ALL_STOCKS } from '../mockData/marketData';

export const Watchlist = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [watchlists, setWatchlists] = useState([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Trade Modal state
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // New Watchlist Modal state
  const [isNewWlModalOpen, setIsNewWlModalOpen] = useState(false);
  const [newWlName, setNewWlName] = useState('');
  const [creatingWl, setCreatingWl] = useState(false);

  // Add stock search query state
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDropdownRef = useRef(null);

  // Filter within current watchlist
  const [tableSearchFilter, setTableSearchFilter] = useState('');

  // Fetch watchlists from backend API
  const fetchWatchlists = async (keepActiveId = null) => {
    try {
      setLoading(true);
      const res = await api('/api/watchlists');
      if (res.success && Array.isArray(res.data)) {
        setWatchlists(res.data);
        if (res.data.length > 0) {
          if (keepActiveId && res.data.some((w) => w.id === keepActiveId)) {
            setActiveWatchlistId(keepActiveId);
          } else if (!activeWatchlistId || !res.data.some((w) => w.id === activeWatchlistId)) {
            setActiveWatchlistId(res.data[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('[Watchlist fetch warning]', err.message);
      addToast('Failed to load watchlists: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlists();
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentList = watchlists.find((w) => w.id === activeWatchlistId) || watchlists[0] || { stocks: [] };

  // Candidates for adding to watchlist
  const availableCandidates = useMemo(() => {
    if (!stockSearchQuery.trim()) return [];
    const q = stockSearchQuery.trim().toLowerCase();
    const existingSymbols = new Set((currentList.stocks || []).map((s) => s.symbol.toUpperCase()));

    return ALL_STOCKS.filter((s) => !s.isIndex && (s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)))
      .map((s) => ({
        ...s,
        isAlreadyInList: existingSymbols.has(s.symbol.toUpperCase()),
      }))
      .slice(0, 8);
  }, [stockSearchQuery, currentList]);

  // Add stock to active watchlist
  const handleAddStock = async (stock) => {
    if (!activeWatchlistId) return;

    try {
      const res = await api(`/api/watchlists/${activeWatchlistId}/stocks`, {
        method: 'POST',
        body: JSON.stringify({ symbol: stock.symbol }),
      });

      if (res.success) {
        addToast(`${stock.symbol} added to ${currentList.name}`, 'success');
        setStockSearchQuery('');
        setIsSearchOpen(false);
        await fetchWatchlists(activeWatchlistId);
      } else {
        addToast(res.message || 'Failed to add stock', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error adding stock to watchlist', 'error');
    }
  };

  // Remove stock from active watchlist
  const handleRemoveStock = async (e, symbol) => {
    e.stopPropagation();
    if (!activeWatchlistId) return;

    try {
      const res = await api(`/api/watchlists/${activeWatchlistId}/stocks/${symbol}`, {
        method: 'DELETE',
      });

      if (res.success) {
        addToast(`${symbol} removed from ${currentList.name}`, 'info');
        await fetchWatchlists(activeWatchlistId);
      } else {
        addToast(res.message || 'Failed to remove stock', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error removing stock', 'error');
    }
  };

  // Create new custom watchlist
  const handleCreateWatchlist = async (e) => {
    e.preventDefault();
    if (!newWlName.trim()) {
      addToast('Please enter a watchlist name.', 'error');
      return;
    }

    try {
      setCreatingWl(true);
      const res = await api('/api/watchlists', {
        method: 'POST',
        body: JSON.stringify({ name: newWlName.trim(), stocks: [] }),
      });

      if (res.success && res.data) {
        addToast(`Watchlist "${res.data.name}" created!`, 'success');
        setNewWlName('');
        setIsNewWlModalOpen(false);
        await fetchWatchlists(res.data._id);
      } else {
        addToast(res.message || 'Failed to create watchlist', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error creating watchlist', 'error');
    } finally {
      setCreatingWl(false);
    }
  };

  // Delete custom watchlist
  const handleDeleteWatchlist = async (wlId, name) => {
    if (!window.confirm(`Are you sure you want to delete the watchlist "${name}"?`)) {
      return;
    }

    try {
      const res = await api(`/api/watchlists/${wlId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        addToast(`Watchlist "${name}" deleted.`, 'info');
        await fetchWatchlists();
      } else {
        addToast(res.message || 'Failed to delete watchlist', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error deleting watchlist', 'error');
    }
  };

  const handleOpenTrade = (e, stock, type) => {
    e.stopPropagation();
    setSelectedStock(stock);
    setTradeType(type);
    setIsTradeModalOpen(true);
  };

  // Filter stocks displayed in table
  const filteredStocks = useMemo(() => {
    const list = currentList.stocks || [];
    if (!tableSearchFilter.trim()) return list;
    const q = tableSearchFilter.trim().toLowerCase();
    return list.filter(
      (s) => s.symbol.toLowerCase().includes(q) || (s.name && s.name.toLowerCase().includes(q))
    );
  }, [currentList, tableSearchFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title & Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Personal Watchlists
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Curate and monitor your favorite Indian equities, track price movements, and execute trades instantly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fetchWatchlists(activeWatchlistId)}
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            title="Refresh Watchlists & Live Prices"
          >
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
          <button
            onClick={() => setIsNewWlModalOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <FolderPlus size={16} /> New Watchlist
          </button>
          <button
            onClick={() => navigate('/markets')}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Discover Stocks
          </button>
        </div>
      </div>

      {/* Watchlist Tabs & Manage Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Watchlist Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {watchlists.map((wl) => {
            const isActive = activeWatchlistId === wl.id;
            return (
              <div
                key={wl.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isActive ? 'var(--color-primary-blue)' : 'var(--bg-card)',
                  border: `1px solid ${isActive ? 'var(--color-primary-blue)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--border-radius-sm)',
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setActiveWatchlistId(wl.id)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'transparent',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {wl.name} ({wl.stocks ? wl.stocks.length : 0})
                </button>
                {!wl.isDefault && (
                  <button
                    onClick={() => handleDeleteWatchlist(wl.id, wl.name)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                      padding: '8px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={`Delete watchlist "${wl.name}"`}
                    onMouseOver={(e) => (e.currentTarget.style.color = '#EF4444')}
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)')
                    }
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Search & Add to Watchlist Dropdown */}
        <div ref={searchDropdownRef} style={{ position: 'relative', minWidth: '280px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '6px 12px',
            }}
          >
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={`Search & add stock to ${currentList.name || 'watchlist'}...`}
              value={stockSearchQuery}
              onChange={(e) => {
                setStockSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%',
                outline: 'none',
              }}
            />
            {stockSearchQuery && (
              <button
                onClick={() => {
                  setStockSearchQuery('');
                  setIsSearchOpen(false);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchOpen && stockSearchQuery.trim() && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '100%',
                minWidth: '320px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
                zIndex: 100,
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {availableCandidates.length === 0 ? (
                <div style={{ padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  No matching stock found.
                </div>
              ) : (
                availableCandidates.map((candidate) => (
                  <div
                    key={candidate.symbol}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{candidate.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{candidate.name}</div>
                    </div>
                    <div>
                      {candidate.isAlreadyInList ? (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Already Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddStock(candidate)}
                          className="btn-primary"
                          style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                        >
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Search Filter within active watchlist */}
      {(currentList.stocks || []).length > 5 && (
        <div style={{ maxWidth: '320px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '6px 12px',
            }}
          >
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filter current watchlist..."
              value={tableSearchFilter}
              onChange={(e) => setTableSearchFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </div>
      )}

      {/* Stocks Table or Empty State */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <RefreshCw size={24} className="spin-icon" style={{ margin: '0 auto 12px', color: 'var(--color-primary-blue)' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading watchlist stocks...</p>
          </div>
        ) : (currentList.stocks || []).length === 0 ? (
          <div style={{ padding: '54px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bookmark size={40} style={{ margin: '0 auto 12px', opacity: 0.6, color: 'var(--color-primary-blue)' }} />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
              No Stocks in "{currentList.name}"
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto 20px', color: 'var(--text-secondary)' }}>
              Use the search bar above to instantly add stocks, or explore the Market Explorer to bookmark promising opportunities.
            </p>
            <button
              onClick={() => navigate('/markets')}
              className="btn-primary"
              style={{ padding: '9px 20px', fontSize: '0.85rem' }}
            >
              Explore Market Tickers
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="trade-table">
              <thead>
                <tr>
                  <th>Ticker & Name</th>
                  <th>Exchange</th>
                  <th>Sector</th>
                  <th style={{ textAlign: 'right' }}>Current Price</th>
                  <th style={{ textAlign: 'right' }}>Day Change</th>
                  <th style={{ textAlign: 'right' }}>Day Range</th>
                  <th style={{ textAlign: 'right' }}>Volume</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => (
                  <tr
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {stock.symbol}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stock.name}</div>
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
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {stock.sector || 'Equities'}
                      </span>
                    </td>
                    <td className="mono-num" style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.95rem' }}>
                      ₹{Number(stock.price).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Badge value={stock.changePercent} />
                    </td>
                    <td className="mono-num" style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      ₹{Number(stock.dayLow || stock.price).toFixed(2)} - ₹{Number(stock.dayHigh || stock.price).toFixed(2)}
                    </td>
                    <td className="mono-num" style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      {stock.volume || '1.2M'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => handleOpenTrade(e, stock, 'BUY')}
                          className="btn-buy"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          title={`Buy ${stock.symbol}`}
                        >
                          Buy
                        </button>
                        <button
                          onClick={(e) => handleOpenTrade(e, stock, 'SELL')}
                          className="btn-sell"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          title={`Sell ${stock.symbol}`}
                        >
                          Sell
                        </button>
                        <button
                          onClick={(e) => handleRemoveStock(e, stock.symbol)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            padding: '6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          title={`Remove ${stock.symbol} from ${currentList.name}`}
                          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-loss)')}
                          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New Watchlist Modal */}
      {isNewWlModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewWlModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Create New Watchlist</h3>
              <button
                onClick={() => setIsNewWlModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWatchlist} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Watchlist Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., High Dividend Equities, IT Stars"
                  value={newWlName}
                  onChange={(e) => setNewWlName(e.target.value)}
                  autoFocus
                  required
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewWlModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingWl || !newWlName.trim()}
                  className="btn-primary"
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  {creatingWl ? 'Creating...' : 'Create Watchlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
