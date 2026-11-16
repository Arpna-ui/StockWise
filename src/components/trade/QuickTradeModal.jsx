import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { useWallet } from '../../context/WalletContext';
import { api } from '../../services/api';
import { OrderReceiptModal } from './OrderReceiptModal';
import { ShieldCheck, Info, RefreshCw, AlertCircle } from 'lucide-react';

export const QuickTradeModal = ({ isOpen, onClose, stock, defaultType = 'BUY' }) => {
  const [tradeType, setTradeType] = useState(defaultType); // BUY or SELL
  const [orderType, setOrderType] = useState('MARKET'); // MARKET or LIMIT
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState(stock ? stock.price : 0);

  // User's owned holding for this stock
  const [userHolding, setUserHolding] = useState(null);
  const [loadingHolding, setLoadingHolding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Receipt modal state
  const [receipt, setReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const { addToast } = useToast();
  const { wallet, refreshWallet } = useWallet();

  // Reset trade type when defaultType changes
  useEffect(() => {
    if (defaultType) {
      setTradeType(defaultType);
    }
  }, [defaultType, isOpen]);

  // Reset limit price when stock changes
  useEffect(() => {
    if (stock) {
      setLimitPrice(stock.price);
    }
  }, [stock]);

  // Fetch user holding for this stock when modal opens
  useEffect(() => {
    if (!isOpen || !stock) return;

    let isMounted = true;
    const fetchHolding = async () => {
      try {
        setLoadingHolding(true);
        const res = await api(`/api/trade/holding/${stock.symbol}`);
        if (res.success && isMounted) {
          setUserHolding(res.data);
        }
      } catch (err) {
        if (isMounted) setUserHolding(null);
      } finally {
        if (isMounted) setLoadingHolding(false);
      }
    };

    fetchHolding();
    return () => {
      isMounted = false;
    };
  }, [isOpen, stock]);

  if (!stock) return null;

  const currentPrice = orderType === 'MARKET' ? Number(stock.price) : Number(limitPrice) || Number(stock.price);
  const totalAmount = currentPrice * (Number(quantity) || 1);
  const virtualCashAvailable = Number(wallet.availableBalance || 100000.0);
  const ownedShares = userHolding ? Number(userHolding.shares || 0) : 0;

  // Validation checks
  const isInsufficientFunds = tradeType === 'BUY' && totalAmount > virtualCashAvailable;
  const isInsufficientShares = tradeType === 'SELL' && (ownedShares === 0 || quantity > ownedShares);

  // Quick quantity selectors for sell
  const handleQuickPercent = (percent) => {
    if (ownedShares <= 0) return;
    const qty = Math.max(1, Math.floor((ownedShares * percent) / 100));
    setQuantity(qty);
  };

  const handleExecute = async (e) => {
    e.preventDefault();

    if (quantity <= 0 || !Number.isInteger(Number(quantity))) {
      addToast('Please enter a valid whole number of shares (minimum 1).', 'error');
      return;
    }

    if (tradeType === 'BUY' && isInsufficientFunds) {
      addToast(
        `Insufficient virtual balance! Required ₹${totalAmount.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
        })}, but available is ₹${virtualCashAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
        'error'
      );
      return;
    }

    if (tradeType === 'SELL' && isInsufficientShares) {
      addToast(
        `Insufficient shares! You only own ${ownedShares} shares of ${stock.symbol}.`,
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = tradeType === 'BUY' ? '/api/trade/buy' : '/api/trade/sell';
      const payload = {
        symbol: stock.symbol,
        quantity: Number(quantity),
        orderType,
        limitPrice: orderType === 'LIMIT' ? Number(limitPrice) : undefined,
      };

      const response = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.success && response.data) {
        // Refresh wallet balances
        await refreshWallet();

        // Show confirmation receipt modal
        setReceipt(response.data);
        setIsReceiptOpen(true);

        addToast(
          `${tradeType} order executed: ${quantity} shares of ${stock.symbol} @ ₹${currentPrice.toFixed(2)}`,
          'success'
        );

        onClose();
      } else {
        throw new Error(response.message || 'Trade execution failed.');
      }
    } catch (err) {
      addToast(err.message || 'Could not execute trade.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Virtual Trade: ${stock.symbol}`}>
        <form onSubmit={handleExecute} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Trade Type Switcher */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              backgroundColor: 'var(--bg-secondary)',
              padding: '4px',
              borderRadius: 'var(--border-radius-sm)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setTradeType('BUY');
                setQuantity(1);
              }}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                backgroundColor: tradeType === 'BUY' ? 'var(--color-profit)' : 'transparent',
                color: tradeType === 'BUY' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeType('SELL');
                if (ownedShares > 0) setQuantity(Math.min(quantity, ownedShares));
              }}
              style={{
                padding: '10px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.85rem',
                backgroundColor: tradeType === 'SELL' ? 'var(--color-loss)' : 'transparent',
                color: tradeType === 'SELL' ? '#FFFFFF' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              SELL
            </button>
          </div>

          {/* Stock price display */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              backgroundColor: 'var(--bg-input)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{stock.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {stock.exchange || 'NSE'}: {stock.symbol} • {stock.sector}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono-num" style={{ fontWeight: 800, fontSize: '1.2rem' }}>
                ₹{Number(stock.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div
                style={{ fontSize: '0.78rem' }}
                className={stock.change >= 0 ? 'profit-text mono-num' : 'loss-text mono-num'}
              >
                {stock.change >= 0 ? `+${stock.change}` : stock.change} ({stock.changePercent}%)
              </div>
            </div>
          </div>

          {/* Owned Shares Badge if in SELL mode */}
          {tradeType === 'SELL' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: ownedShares > 0 ? 'rgba(37, 99, 235, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1px solid ${ownedShares > 0 ? 'rgba(37, 99, 235, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>Owned Portfolio Position:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="mono-num" style={{ fontWeight: 800, color: ownedShares > 0 ? 'var(--text-primary)' : 'var(--color-loss)' }}>
                  {ownedShares} {ownedShares === 1 ? 'Share' : 'Shares'}
                </span>
                {ownedShares > 0 && userHolding && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    (Avg: ₹{userHolding.averageBuyPrice.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Order Type Toggle */}
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="orderType"
                value="MARKET"
                checked={orderType === 'MARKET'}
                onChange={() => setOrderType('MARKET')}
              />
              Market Order
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="orderType"
                value="LIMIT"
                checked={orderType === 'LIMIT'}
                onChange={() => setOrderType('LIMIT')}
              />
              Limit Order
            </label>
          </div>

          {/* Input fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
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
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Price (₹)
              </label>
              <input
                type="number"
                step="0.05"
                disabled={orderType === 'MARKET'}
                value={orderType === 'MARKET' ? stock.price : limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: orderType === 'MARKET' ? 'var(--bg-secondary)' : 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                }}
              />
            </div>
          </div>

          {/* Quick sell percentage pills */}
          {tradeType === 'SELL' && ownedShares > 0 && (
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
                  {pct === 100 ? '100% (ALL)' : `${pct}%`}
                </button>
              ))}
            </div>
          )}

          {/* Financial Breakdown Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '12px 14px',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Available Virtual Cash:</span>
              <span className="mono-num" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{virtualCashAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Brokerage & Exchange Taxes:</span>
              <span style={{ color: 'var(--color-profit)', fontWeight: 600 }}>₹0.00 (Zero virtual fees)</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '6px',
                marginTop: '4px',
              }}
            >
              <span>Total Order Value:</span>
              <span
                className="mono-num"
                style={{
                  fontSize: '1.05rem',
                  color: tradeType === 'BUY' ? 'var(--color-profit)' : 'var(--color-loss)',
                }}
              >
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Warning Banner if insufficient funds or holdings */}
          {tradeType === 'BUY' && isInsufficientFunds && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-loss)',
                fontSize: '0.78rem',
              }}
            >
              <AlertCircle size={15} />
              <span>Insufficient virtual balance. Please reduce order quantity.</span>
            </div>
          )}

          {tradeType === 'SELL' && isInsufficientShares && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-loss)',
                fontSize: '0.78rem',
              }}
            >
              <AlertCircle size={15} />
              <span>
                {ownedShares === 0
                  ? 'You do not own any shares of this stock.'
                  : `Cannot sell more than ${ownedShares} owned shares.`}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="var(--color-profit)" />
            <span>Risk-Free Simulated Trade: Executed with virtual portfolio balance.</span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || (tradeType === 'BUY' && isInsufficientFunds) || (tradeType === 'SELL' && isInsufficientShares)}
            className={tradeType === 'BUY' ? 'btn-buy' : 'btn-sell'}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.95rem',
              opacity: isSubmitting || (tradeType === 'BUY' && isInsufficientFunds) || (tradeType === 'SELL' && isInsufficientShares) ? 0.6 : 1,
              cursor: isSubmitting || (tradeType === 'BUY' && isInsufficientFunds) || (tradeType === 'SELL' && isInsufficientShares) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="spin-icon" />
                <span>Validating & Executing...</span>
              </>
            ) : (
              <span>
                Confirm Virtual {tradeType} ({quantity} {quantity === 1 ? 'Share' : 'Shares'})
              </span>
            )}
          </button>
        </form>
      </Modal>

      {/* Order Confirmation Receipt Modal */}
      <OrderReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receipt}
      />
    </>
  );
};
