import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Bookmark,
  ArrowLeftRight,
  Newspaper,
  User,
  Settings,
  Shield,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { wallet } = useWallet();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Markets', path: '/markets', icon: TrendingUp },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'News', path: '/news', icon: Newspaper },
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em' }}>
              Stock<span style={{ color: 'var(--color-profit)' }}>Wise</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.04em' }}>
              Learn. Trade. Grow.
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            display: 'none',
            padding: '4px',
          }}
          className="mobile-close-btn"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: 'var(--border-radius-sm)',
                fontSize: '0.88rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--color-primary-blue)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Virtual Account Balance Pill */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--border-radius-md)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Wallet size={14} color="var(--color-profit)" /> Virtual Cash
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: 'var(--color-profit-bg)',
                color: 'var(--color-profit)',
                fontWeight: 700,
              }}
            >
              ACTIVE
            </span>
          </div>
          <div className="mono-num" style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            ₹{(wallet.availableBalance || user?.availableBalance || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <Shield size={12} color="var(--color-primary-blue)" />
            <span>Virtual Demo Capital</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
