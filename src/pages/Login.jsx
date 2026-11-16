import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import { Modal } from '../components/common/Modal';

export const Login = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const { login, loginDemo, forgotPassword } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginId.trim() || !password) {
      setErrorMessage('Please enter both your email/username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginId.trim(), password, rememberMe);
      addToast('Welcome back to StockWise!', 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed. Please verify your credentials.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccess = () => {
    loginDemo();
    addToast('Logged in with Demo Virtual Account (₹1,00,000 capital)!', 'success');
    navigate('/');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      addToast('Please enter your email address.', 'error');
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail.trim());
      addToast(res.message || 'Password reset link sent!', 'success', 5000);
      setIsForgotModalOpen(false);
      setForgotEmail('');

      // If simulated/console mode, also give a helpful notice
      if (res.deliveryMode === 'console_logged' && res.resetUrl) {
        addToast(`Notice: Email printed to server terminal (${res.resetUrl})`, 'info', 7000);
      }
    } catch (err) {
      addToast(err.message || 'Failed to send reset link.', 'error');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: '12px',
            }}
          >
            S
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Access your StockWise virtual trading account
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'var(--color-loss-bg)',
              border: '1px solid var(--color-loss-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '10px 14px',
              color: 'var(--color-loss)',
              fontSize: '0.85rem',
              marginBottom: '18px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email or Username input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email or Username
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '10px 14px',
              }}
            >
              <User size={18} color="var(--text-muted)" />
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter email or username"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  setErrorMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  width: '100%',
                }}
              />
            </div>
          </div>

          {/* Password with Show/Hide toggle */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <span
                onClick={() => setIsForgotModalOpen(true)}
                style={{ fontSize: '0.78rem', color: 'var(--color-primary-blue)', cursor: 'pointer', fontWeight: 500 }}
              >
                Forgot Password?
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '10px 14px',
              }}
            >
              <Lock size={18} color="var(--text-muted)" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember me checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember this device
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" /> Authenticating...
              </>
            ) : (
              <>
                Sign In to StockWise <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* One-Click Demo Access Button */}
          <button
            type="button"
            onClick={handleDemoAccess}
            className="btn-secondary"
            style={{ width: '100%', padding: '12px' }}
          >
            <ShieldCheck size={16} color="var(--color-profit)" /> One-Click Demo Access (₹1,00,000)
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary-blue)', fontWeight: 700 }}>
            Create Account & Claim ₹1,00,000
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Reset Account Password"
      >
        <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            Enter the email address registered with your StockWise virtual trading account. We'll generate a secure password reset link valid for 10 minutes.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Registered Email Address
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '10px 14px',
              }}
            >
              <Mail size={18} color="var(--text-muted)" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isForgotSubmitting}
              className="btn-primary"
            >
              {isForgotSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
