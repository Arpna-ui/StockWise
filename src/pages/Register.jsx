import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  Gift,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';

export const Register = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side validations
    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (username.trim().length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setErrorMessage('Username can only contain letters, numbers, and underscores.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    if (!agreed) {
      setErrorMessage('Please agree to the educational virtual trading terms.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      addToast(
        res.message || 'Account created! ₹1,00,000 virtual capital credited.',
        'success',
        5000
      );
      navigate('/');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your details.';
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
          maxWidth: '500px',
          padding: '36px 32px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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
              marginBottom: '10px',
            }}
          >
            S
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Start Trading with StockWise</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Learn. Trade. Grow. — 100% Risk-Free Virtual Market
          </p>
        </div>

        {/* ₹1,00,000 Virtual Capital Banner */}
        <div
          style={{
            backgroundColor: 'var(--color-profit-bg)',
            border: '1px solid var(--color-profit-border)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '12px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-profit)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
            }}
          >
            <Gift size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-profit)' }}>
              ₹1,00,000 Virtual Capital Included
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Every new user receives ₹1,00,000 in virtual funds only once upon registration.
            </div>
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Full Name
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
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
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

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Username
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
              <AtSign size={18} color="var(--text-muted)" />
              <input
                type="text"
                required
                placeholder="e.g. aarav_trade"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().trim());
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

          {/* Email Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email Address
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
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
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

          {/* Passwords Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '10px 12px',
                }}
              >
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min 6 chars"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Confirm Pass
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '10px 12px',
                }}
              >
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat pass"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    width: '100%',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ background: 'transparent', color: 'var(--text-muted)', padding: '2px', display: 'flex' }}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Terms Agreement Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            I understand StockWise uses virtual currency (₹1,00,000) for education.
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin-animation" /> Creating Account...
              </>
            ) : (
              <>
                Create Account & Claim ₹1,00,000 <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary-blue)', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
