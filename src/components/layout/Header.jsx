import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Moon,
  Sun,
  Bell,
  Menu,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  User,
  LogOut,
  Settings as SettingsIcon,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { api } from '../../services/api';
import { INDICES, ALL_STOCKS } from '../../mockData/marketData';

export const Header = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // User menu dropdown state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Notifications dropdown state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api('/api/notifications?limit=20');
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        const unread = res.meta?.unreadCount ?? res.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Silently ignore or use fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleReadNotification = async (notif) => {
    if (!notif.isRead) {
      try {
        await api(`/api/notifications/${notif._id}/read`, { method: 'PUT' });
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {}
    }
    setIsNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      await api('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
      addToast('Notifications cleared', 'info');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Filter search
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const filtered = ALL_STOCKS.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
      ).slice(0, 5);
      setSearchResults(filtered);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (symbol) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(`/stock/${symbol}`);
  };

  const handleLogout = () => {
    logout();
    addToast('Logged out of StockWise session', 'info');
    navigate('/login');
  };

  return (
    <header className="header">
      {/* Left: Mobile hamburger & Market Tickers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            display: 'flex',
            padding: '6px',
            borderRadius: '6px',
          }}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>

        {/* Live Index Tickers (NIFTY 50 & SENSEX) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {INDICES.slice(0, 2).map((idx) => (
            <div
              key={idx.symbol}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{idx.symbol}</span>
              <span className="mono-num" style={{ fontWeight: 700 }}>
                {idx.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: idx.isPositive ? 'var(--color-profit)' : 'var(--color-loss)',
                }}
              >
                {idx.isPositive ? <TrendingUp size={11} style={{ marginRight: 2 }} /> : <TrendingDown size={11} style={{ marginRight: 2 }} />}
                {idx.isPositive ? `+${idx.changePercent}%` : `${idx.changePercent}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Center: Search Bar */}
      <div ref={searchRef} style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '8px 12px',
          }}
        >
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search stocks (e.g. Reliance, TCS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              width: '100%',
            }}
          />
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
              zIndex: 100,
            }}
          >
            {searchResults.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => handleSelectStock(stock.symbol)}
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s ease',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{stock.symbol}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stock.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono-num" style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    ₹{stock.price.toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: stock.change >= 0 ? 'var(--color-profit)' : 'var(--color-loss)',
                    }}
                  >
                    {stock.change >= 0 ? `+${stock.changePercent}%` : `${stock.changePercent}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Actions, Theme Toggle, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#3B82F6" />}
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen) fetchNotifications();
            }}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--color-profit)',
                  color: '#FFFFFF',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '340px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'slideUp 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  Notifications {unreadCount > 0 && <span style={{ color: 'var(--color-profit)' }}>({unreadCount})</span>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-primary-blue)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <CheckCheck size={13} /> Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    All caught up! No notifications.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.isRead;
                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleReadNotification(notif)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: isUnread ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = isUnread ? 'rgba(37, 99, 235, 0.05)' : 'transparent')
                        }
                      >
                        <div style={{ marginTop: '2px', flexShrink: 0 }}>
                          {notif.type === 'SUCCESS' ? (
                            <CheckCircle2 size={16} color="var(--color-profit)" />
                          ) : notif.type === 'ALERT' || notif.type === 'WARNING' ? (
                            <AlertTriangle size={16} color="var(--color-loss)" />
                          ) : (
                            <Bell size={16} color="var(--color-primary-blue)" />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: isUnread ? 700 : 500,
                              color: 'var(--text-primary)',
                              marginBottom: '2px',
                            }}
                          >
                            {notif.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.4,
                            }}
                          >
                            {notif.message}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {new Date(notif.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>

                        {isUnread && (
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-primary-blue)',
                              marginTop: '6px',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div
                  style={{
                    padding: '8px 14px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <button
                    onClick={handleClearAllNotifications}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-loss)')}
                    onMouseOut={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={12} /> Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Chip & Dropdown */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '24px',
              padding: '4px 12px 4px 6px',
              color: 'var(--text-primary)',
            }}
          >
            <img
              src={user ? user.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt="Avatar"
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {user ? (user.fullName || user.name || user.username || 'Trader').split(' ')[0] : 'Trader'}
            </span>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '120%',
                right: 0,
                width: '210px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-card)',
                padding: '6px',
                zIndex: 100,
              }}
            >
              <Link
                to="/profile"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <User size={16} /> Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <SettingsIcon size={16} /> Settings
              </Link>
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: 'var(--color-loss)',
                  background: 'transparent',
                  textAlign: 'left',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
