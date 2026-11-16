import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { addToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(token, password, confirmPassword);
      addToast(res.message || 'Password reset successfully! Logged in.', 'success');
      navigate('/');
    } catch (err) {
      const msg = err.message || 'Failed to reset password. The link may have expired.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
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
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Choose a secure password for your StockWise virtual trading account.
          </p>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              New Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '10px 14px',
              }}
            >
              <Lock size={16} color="var(--text-muted)" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '10px 14px',
              }}
            >
              <Lock size={16} color="var(--text-muted)" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  width: '100%',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" /> Updating Password...
              </>
            ) : (
              <>
                Update Password & Sign In <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
