import React from 'react';

export const Skeleton = ({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  style = {},
  className = '',
}) => {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--bg-secondary)',
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0) 100%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
};

export const SkeletonCard = ({ style = {} }) => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', ...style }}>
    <Skeleton width="40%" height="16px" />
    <Skeleton width="70%" height="28px" />
    <Skeleton width="50%" height="14px" />
  </div>
);

export const SkeletonNewsCard = () => (
  <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    <Skeleton width="100%" height="170px" borderRadius="0" />
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <Skeleton width="30%" height="14px" />
      <Skeleton width="85%" height="20px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="90%" height="14px" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <Skeleton width="25%" height="14px" />
        <Skeleton width="15%" height="14px" />
      </div>
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 6 }) => (
  <div className="card" style={{ padding: '16px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Skeleton width="25%" height="20px" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton key={cIdx} width={`${100 / cols}%`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  </div>
);
