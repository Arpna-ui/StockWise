import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Sliders,
  RotateCcw,
  Check,
  Lock,
  LogOut,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { api } from '../services/api';

export const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { refreshWallet } = useWallet();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Notification states (persisted in localStorage)
  const [notifyTrades, setNotifyTrades] = useState(() => {
    const saved = localStorage.getItem('stockwise_notify_trades');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifyPriceAlerts, setNotifyPriceAlerts] = useState(() => {
    const saved = localStorage.getItem('stockwise_notify_alerts');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [notifyDigest, setNotifyDigest] = useState(() => {
    const saved = localStorage.getItem('stockwise_notify_digest');
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Trading preferences (persisted in localStorage)
  const [defaultOrderType, setDefaultOrderType] = useState(() => {
    return localStorage.getItem('stockwise_default_order_type') || 'MARKET';
  });
  const [defaultQuantity, setDefaultQuantity] = useState(() => {
    return parseInt(localStorage.getItem('stockwise_default_quantity'), 10) || 1;
  });

  // Modals & action states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle saving trading preferences
  const handleSavePreferences = () => {
    localStorage.setItem('stockwise_default_order_type', defaultOrderType);
    localStorage.setItem('stockwise_default_quantity', defaultQuantity.toString());
    addToast('Trading preferences updated and saved', 'success');
  };

  // Handle saving notification settings
  const handleSaveNotificationSettings = () => {
    localStorage.setItem('stockwise_notify_trades', JSON.stringify(notifyTrades));
    localStorage.setItem('stockwise_notify_alerts', JSON.stringify(notifyPriceAlerts));
    localStorage.setItem('stockwise_notify_digest', JSON.stringify(notifyDigest));
    addToast('Notification preferences updated', 'success');
  };

  // Genuine Reset Virtual Account flow
  const handleResetAccount = async () => {
    try {
      setIsResetting(true);
      const res = await api('/api/users/reset-account', {
        method: 'POST',
      });

      if (res.success) {
        await refreshWallet();
        setIsResetModalOpen(false);
        addToast(res.message || 'Virtual account reset: starting balance ₹1,00,000 restored', 'success');
      } else {
        throw new Error(res.message || 'Could not reset virtual account');
      }
    } catch (err) {
      console.error('[Settings] Account reset failed:', err);
      addToast(err.message || 'Failed to reset virtual account', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Genuine Change Password flow
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      addToast('Please provide both current and new password', 'error');
      return;
    }

    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const res = await api('/api/users/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (res.success) {
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        addToast(res.message || 'Password updated successfully', 'success');
      } else {
        throw new Error(res.message || 'Failed to update password');
      }
    } catch (err) {
      console.error('[Settings] Password change failed:', err);
      addToast(err.message || 'Password update failed. Verify current password.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Logout flow
  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    addToast('You have been logged out safely', 'info');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '840px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Platform Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          Personalize your trading interface, notification feeds, security credentials, and simulation parameters.
        </p>
      </div>

      {/* Theme Preference */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.15rem' }}>Appearance & Theme</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Choose between high-contrast fintech dark navy and crisp daytime light mode.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div
            onClick={() => theme !== 'dark' && toggleTheme()}
            style={{
              padding: '16px',
              borderRadius: 'var(--border-radius-md)',
              border: `2px solid ${theme === 'dark' ? 'var(--color-primary-blue)' : 'var(--border-subtle)'}`,
              backgroundColor: '#0E1424',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Moon size={22} color="#3B82F6" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Fintech Dark (Navy)</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>High contrast for active market trading</div>
              </div>
            </div>
            {theme === 'dark' && <Check size={18} color="var(--color-primary-blue)" />}
          </div>

          <div
            onClick={() => theme !== 'light' && toggleTheme()}
            style={{
              padding: '16px',
              borderRadius: 'var(--border-radius-md)',
              border: `2px solid ${theme === 'light' ? 'var(--color-primary-blue)' : 'var(--border-subtle)'}`,
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sun size={22} color="#F59E0B" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Clean Light</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Crisp daytime display with soft borders</div>
              </div>
            </div>
            {theme === 'light' && <Check size={18} color="var(--color-primary-blue)" />}
          </div>
        </div>
      </div>

      {/* Trading Execution Defaults */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.15rem' }}>Trading Order Defaults</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Configure default values for quick order executions across stock pages and modals.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Default Order Type
            </label>
            <select
              value={defaultOrderType}
              onChange={(e) => setDefaultOrderType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="MARKET">Market Execution (Instant)</option>
              <option value="LIMIT">Limit Order (Specific Target Price)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Default Share Quantity
            </label>
            <input
              type="number"
              min="1"
              value={defaultQuantity}
              onChange={(e) => setDefaultQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSavePreferences}
          className="btn-primary"
          style={{ alignSelf: 'flex-start', padding: '9px 18px', fontSize: '0.85rem' }}
        >
          <Save size={15} /> Save Trading Defaults
        </button>
      </div>

      {/* Notifications Preference */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Alerts & Notification Feeds</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time updates</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Order Execution Receipts</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Receive instant notifications when virtual buy/sell orders execute or fail
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyTrades}
              onChange={(e) => setNotifyTrades(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Watchlist Price Spikes & Triggers</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Notify when bookmarked NSE/BSE tickers reach configured target price levels
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyPriceAlerts}
              onChange={(e) => setNotifyPriceAlerts(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Pre-Market Briefing Digest</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Daily 9:00 AM IST market summary covering Nifty 50, Bank Nifty, and global cues
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifyDigest}
              onChange={(e) => setNotifyDigest(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </label>
        </div>

        <button
          onClick={handleSaveNotificationSettings}
          className="btn-secondary"
          style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <Bell size={15} /> Save Notification Preferences
        </button>
      </div>

      {/* Security & Password */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '1.15rem' }}>Security & Credentials</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Password Protection</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Protected with salted bcrypt cryptographic hashing
            </div>
          </div>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Lock size={15} /> Change Password
          </button>
        </div>
      </div>

      {/* Danger Zone: Simulation Reset */}
      <div
        className="card"
        style={{
          borderColor: 'var(--color-loss)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-loss)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={16} /> Reset Virtual Portfolio
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Wipe simulated holdings and revert virtual available balance back to the starting ₹1,00,000 grant.
          </p>
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="btn-sell"
          style={{ padding: '9px 16px', fontSize: '0.85rem' }}
        >
          <RotateCcw size={15} /> Reset Demo Balance
        </button>
      </div>

      {/* Session Management & Logout */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Account Session</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Logged in as <b>{user?.fullName || 'Active Trader'}</b> ({user?.email || user?.username || 'user'})
          </div>
        </div>

        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className="btn-secondary"
          style={{ color: 'var(--color-loss)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <LogOut size={15} /> Log Out
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetAccount}
        title="Reset Virtual Portfolio?"
        message="This action will permanently wipe all active stock holdings and restore your virtual cash balance to ₹1,00,000.00. This is safe as all money on StockWise is paper currency."
        confirmText="Yes, Reset Balance"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isResetting}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
        title="Log Out of StockWise?"
        message="Are you sure you want to log out? Your watchlist, portfolio state, and transaction history will remain securely stored in your account."
        confirmText="Log Out"
        cancelText="Stay Logged In"
        isDestructive={false}
      />

      {/* Password Update Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Account Password">
        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              New Password (min 6 characters)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new strong password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isUpdatingPassword}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={isUpdatingPassword} className="btn-primary">
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};