import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info, Lightbulb, X } from 'lucide-react';

/**
 * Beginner-friendly educational tooltip component.
 * Allows users to hover or click on any financial term to see a plain-English explanation.
 */
export const InfoTooltip = ({
  title,
  text,
  tip,
  children,
  size = 14,
  position = 'top',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const toggleTooltip = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <span
      ref={tooltipRef}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        cursor: 'pointer',
        verticalAlign: 'middle',
      }}
      onClick={toggleTooltip}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsOpen(!isOpen);
        } else if (e.key === 'Escape') {
          setIsOpen(false);
        }
      }}
      aria-expanded={isOpen}
      aria-label={`Info: ${title || 'Explanation'}`}
    >
      {children}
      <HelpCircle
        size={size}
        style={{
          marginLeft: children ? '4px' : '0',
          color: isOpen ? 'var(--color-primary-blue)' : 'var(--text-muted)',
          opacity: 0.8,
          transition: 'color 0.15s ease, transform 0.15s ease',
          transform: isOpen ? 'scale(1.15)' : 'scale(1)',
          flexShrink: 0,
        }}
      />

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            zIndex: 9999,
            width: '260px',
            maxWidth: '85vw',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
            fontSize: '0.8rem',
            lineHeight: 1.45,
            textAlign: 'left',
            cursor: 'default',
            ...(position === 'top'
              ? {
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }
              : {
                  top: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                }),
          }}
        >
          {/* Header */}
          {title && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '0.84rem',
                color: 'var(--color-primary-blue)',
                marginBottom: '6px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '4px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={14} /> {title}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                aria-label="Close"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Body text */}
          <div style={{ color: 'var(--text-secondary)', marginBottom: tip ? '8px' : 0 }}>
            {text}
          </div>

          {/* Beginner tip / rule of thumb */}
          {tip && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                padding: '6px 8px',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                borderRadius: '6px',
                fontSize: '0.74rem',
                color: 'var(--text-primary)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              <Lightbulb size={13} color="var(--color-primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: 'var(--color-primary-blue)' }}>Beginner Tip: </strong>
                {tip}
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
};
