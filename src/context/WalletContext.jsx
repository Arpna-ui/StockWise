import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WalletContext = createContext();

export const DEFAULT_WALLET_METRICS = {
  availableBalance: 100000.00,
  lockedBalance: 0.00,
  totalInvested: 0.00,
  currentHoldingsValue: 0.00,
  totalAccountValue: 100000.00,
  realizedPnL: 0.00,
  unrealizedPnL: 0.00,
  totalPnL: 0.00,
  pnlPercentage: 0.00,
  initialCapitalGrant: 100000.00,
  currency: 'INR',
  currencySymbol: '₹',
  isVirtual: true,
  disclaimer: 'All balances and transactions are simulated virtual paper money for educational purposes. No real currency is involved.',
};

export const WalletProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [wallet, setWallet] = useState(DEFAULT_WALLET_METRICS);
  const [loading, setLoading] = useState(true);

  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) {
      setWallet(DEFAULT_WALLET_METRICS);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api('/api/wallet');
      if (res.success && res.data) {
        setWallet(res.data);
      }
    } catch (err) {
      console.warn('[Wallet] Could not fetch live wallet, using user session:', err.message);
      // Fallback to user session available balance if offline
      if (user) {
        setWallet((prev) => ({
          ...prev,
          availableBalance: user.availableBalance || 100000.00,
          totalAccountValue: (user.availableBalance || 100000.00) + (user.investedBalance || 0),
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <WalletContext.Provider value={{ wallet, loading, refreshWallet: fetchWallet }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
