import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  Bookmark,
  User,
} from 'lucide-react';

export const MobileNav = () => {
  const items = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Markets', path: '/markets', icon: TrendingUp },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Watchlist', path: '/watchlist', icon: Bookmark },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--bg-card)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 45,
      }}
      className="mobile-bottom-nav"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: isActive ? 'var(--color-primary-blue)' : 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: isActive ? 700 : 500,
              flex: 1,
              height: '100%',
            })}
          >
            <Icon size={18} />
            <span>{item.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
};
