import React from 'react';
import { Badge } from './Badge';

export const MetricCard = ({
  title,
  value,
  subtitle,
  change,
  changePercent,
  icon: Icon,
  accentColor,
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: accentColor ? `${accentColor}18` : 'var(--bg-secondary)',
              color: accentColor || 'var(--color-primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <h2 className="mono-num" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
          {value}
        </h2>
      </div>

      {(changePercent !== undefined || subtitle) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          {changePercent !== undefined && (
            <Badge value={changePercent} />
          )}
          {subtitle && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
