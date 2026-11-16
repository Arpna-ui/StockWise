import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Award,
  Calendar,
  Mail,
  Phone,
  Hash,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Lock,
  Camera,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useToast } from '../components/common/Toast';
import { api } from '../services/api';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
];

export const Profile = () => {
  const { user: authUser } = useAuth();
  const { wallet } = useWallet();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password Modal
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api('/api/users/profile');
      if (res.success && res.data) {
        setProfileData(res.data);
        setFormName(res.data.fullName || '');
        setFormPhone(res.data.phone || '');
        setFormBio(res.data.bio || '');
        setFormAvatar(res.data.avatar || '');
      }
    } catch (err) {
      console.warn('[Profile fetch warning]', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSavingProfile(true);
      const res = await api('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: formName,
          phone: formPhone,
          bio: formBio,
          avatar: formAvatar,
        }),
      });

      if (res.success) {
        addToast('Profile details updated successfully', 'success');
        setIsEditOpen(false);
        fetchProfile();
      } else {
        addToast(res.message || 'Failed to update profile', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error updating profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New password and confirmation do not match', 'error');
      return;
    }

    try {
      setIsChangingPassword(true);
      const res = await api('/api/users/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (res.success) {
        addToast('Password changed successfully!', 'success');
        setIsPasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        addToast(res.message || 'Failed to update password', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error changing password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const user = profileData || authUser || {};
  const initials = user.initials || 'TR';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            User Profile & Account Information
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Manage your personal credentials, virtual trading allocations, and account security.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPasswordOpen(true)}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Lock size={15} /> Change Password
          </button>
          <button
            onClick={() => setIsEditOpen(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header Card with Initials / Avatar */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '24px 28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Avatar or Initials Display */}
          <div style={{ position: 'relative' }}>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--color-primary-blue)',
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}

            {/* Initials Fallback */}
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB 0%, #10B981 100%)',
                color: '#FFFFFF',
                display: user.avatar ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
              }}
            >
              {initials}
            </div>

            <button
              onClick={() => setIsEditOpen(true)}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-blue)',
                border: '2px solid var(--bg-card)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Change avatar"
            >
              <Camera size={13} />
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{user.fullName || 'Trader'}</h2>
              {user.username && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  @{user.username}
                </span>
              )}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-profit-bg)',
                  border: '1px solid var(--color-profit-border)',
                  color: 'var(--color-profit)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                <ShieldCheck size={14} /> {user.kycStatus || 'Verified Virtual Trader'}
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '4px', maxWidth: '520px' }}>
              {user.bio || 'Virtual Equity Trader & Financial Enthusiast'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Mail size={13} /> {user.email || 'user@stockwise.trade'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Phone size={13} /> {user.phone || '+91 98765 43210'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} /> Member since{' '}
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                  : 'October 2026'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Account Information & Capital Allocation */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
          borderColor: 'var(--color-primary-blue)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={20} color="var(--color-primary-blue)" />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Virtual Paper Capital Allocation</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '4px' }}>
              Risk-free virtual currency credited once upon registration. Zero real-world financial liability.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Initial Grant</div>
              <div className="mono-num" style={{ fontWeight: 800, fontSize: '1.25rem' }}>₹1,00,000.00</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Cash</div>
              <div className="mono-num profit-text" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
                ₹{Number(wallet.availableBalance || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Value</div>
              <div className="mono-num" style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary-blue)' }}>
                ₹{Number(wallet.totalAccountValue || 100000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Specifications Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="card">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Account Identifier
          </span>
          <div className="mono-num" style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
            #{user.id ? user.id.toString().slice(-10).toUpperCase() : 'SW-USER'}
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
            Unique StockWise Trader UUID
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trading Exchange Regime
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
            NSE / BSE Simulated
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
            Standard Indian Market Hours (09:15 - 15:30 IST)
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Security Level
          </span>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '4px', color: 'var(--color-profit)' }}>
            JWT + Bcrypt (Active)
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
            Standard Tokenized Session
          </span>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Edit Personal Details</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Trader Bio
                </label>
                <textarea
                  rows={2}
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    resize: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Choose Profile Picture Avatar
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  {PRESET_AVATARS.map((avUrl, i) => (
                    <img
                      key={i}
                      src={avUrl}
                      alt={`Avatar ${i}`}
                      onClick={() => setFormAvatar(avUrl)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                        border: `2px solid ${formAvatar === avUrl ? 'var(--color-primary-blue)' : 'transparent'}`,
                      }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormAvatar('')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.72rem',
                      backgroundColor: !formAvatar ? 'var(--color-primary-blue)' : 'var(--bg-secondary)',
                      color: !formAvatar ? '#FFFFFF' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    Use Initials
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSavingProfile} className="btn-primary">
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isPasswordOpen && (
        <div className="modal-backdrop" onClick={() => setIsPasswordOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px', padding: '24px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem' }}>Change Account Password</h3>
              <button
                onClick={() => setIsPasswordOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  New Password (min. 6 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsPasswordOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isChangingPassword} className="btn-primary">
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
