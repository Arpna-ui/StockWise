import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const Badge = ({ type = 'neutral', value, children, showIcon = true }) => {
  if (type === 'profit' || (typeof value === 'number' && value > 0)) {
    return (
      <span className="badge-profit">
        {showIcon && <TrendingUp size={13} />}
        {children || (value ? `+${value.toFixed(2)}%` : '')}
      </span>
    );
  }

  if (type === 'loss' || (typeof value === 'number' && value < 0)) {
    return (
      <span className="badge-loss">
        {showIcon && <TrendingDown size={13} />}
        {children || (value ? `${value.toFixed(2)}%` : '')}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem',
        fontWeight: '600',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {showIcon && <Minus size={12} />}
      {children || '0.00%'}
    </span>
  );
};
