import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import {
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Layers,
  Clock,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';

export const OrderReceiptModal = ({ isOpen, onClose, receipt }) => {
  const navigate = useNavigate();

  if (!receipt) return null;

  const isBuy = receipt.type === 'BUY';
  const isProfit = (receipt.realizedPnL || 0) >= 0;
  const formattedDate = receipt.executionTimestamp
    ? new Date(receipt.executionTimestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Just now';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Confirmation Receipt">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Success Header Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: isBuy ? 'rgba(16, 185, 129, 0.1)' : 'rgba(37, 99, 235, 0.1)',
            border: `1px solid ${isBuy ? 'rgba(16, 185, 129, 0.25)' : 'rgba(37, 99, 235, 0.25)'}`,
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: isBuy ? 'var(--color-profit)' : 'var(--color-primary-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Order Executed Successfully!
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Simulated paper trade filled instantly at current market price
            </div>
          </div>
        </div>

        {/* Stock & Execution Summary Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{receipt.symbol}</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: isBuy ? 'var(--color-profit)' : 'var(--color-loss)',
                    color: '#FFFFFF',
                  }}
                >
                  {receipt.type}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {receipt.orderType || 'MARKET'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {receipt.companyName}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                className="mono-num"
                style={{
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  color: isBuy ? 'var(--color-loss)' : 'var(--color-profit)',
                }}
              >
                {isBuy ? '-' : '+'}₹{receipt.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Total Order Value
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '12px',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Quantity Filled:</span>
              <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {receipt.quantity} {receipt.quantity === 1 ? 'Share' : 'Shares'}
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Execution Price:</span>
              <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                ₹{Number(receipt.executionPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* If SELL, display Realized P&L */}
            {!isBuy && receipt.realizedPnL !== undefined && (
              <>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Cost Basis:</span>
                  <div className="mono-num" style={{ fontWeight: 600 }}>
                    ₹{Number(receipt.costBasis).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Realized Profit/Loss:</span>
                  <div
                    className={`mono-num ${isProfit ? 'profit-text' : 'loss-text'}`}
                    style={{ fontWeight: 800, fontSize: '0.95rem' }}
                  >
                    {isProfit ? '+' : ''}₹{Number(receipt.realizedPnL).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    {' '}({receipt.realizedPnLPercent}%)
                  </div>
                </div>
              </>
            )}

            {/* If BUY, display new holdings & average buy price */}
            {isBuy && receipt.updatedHolding && (
              <>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Total Shares Owned:</span>
                  <div className="mono-num" style={{ fontWeight: 700 }}>
                    {receipt.updatedHolding.shares} Shares
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Avg Purchase Price:</span>
                  <div className="mono-num" style={{ fontWeight: 700 }}>
                    ₹{Number(receipt.updatedHolding.averageBuyPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </>
            )}

            {/* If SELL and shares remain */}
            {!isBuy && receipt.remainingShares !== undefined && (
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)' }}>Remaining Position:</span>
                <div className="mono-num" style={{ fontWeight: 600 }}>
                  {receipt.remainingShares > 0
                    ? `${receipt.remainingShares} shares retained in portfolio`
                    : '100% liquidated (Position fully closed)'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Updated Account Balance & Audit Trail */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 14px',
            backgroundColor: 'var(--bg-input)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={16} color="var(--color-profit)" />
            <span style={{ color: 'var(--text-secondary)' }}>Updated Available Cash:</span>
          </div>
          <span className="mono-num" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
            ₹{Number(receipt.newAvailableBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Metadata: Reference ID & Timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>Order Ref: #{receipt.orderId ? receipt.orderId.toString().slice(-8).toUpperCase() : 'SW-OK'}</span>
          <span>Time: {formattedDate} IST</span>
        </div>

        {/* Disclaimer Notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            padding: '8px 10px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '6px',
          }}
        >
          <ShieldCheck size={14} color="var(--color-profit)" />
          <span>Paper Capital: All transactions use risk-free virtual funds for educational learning.</span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '10px', fontSize: '0.85rem' }}
          >
            Trade More
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/portfolio');
            }}
            className="btn-primary"
            style={{ padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            View Portfolio <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </Modal>
  );
};
