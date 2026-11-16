import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { CURRENT_USER } from '../mockData/userData';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('stockwise_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check persistent session on mount
  useEffect(() => {
    const verifyUserSession = async () => {
      const storedToken = localStorage.getItem('stockwise_token');

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await api('/api/auth/me');
        if (res.success && res.user) {
          setUser(res.user);
          setIsAuthenticated(true);
        } else {
          // Token invalid or expired
          localStorage.removeItem('stockwise_token');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.warn('[Session Verification] Token check failed:', err.message);
        // If server is unavailable, do not immediately kick out if user was previously authenticated in demo
        localStorage.removeItem('stockwise_token');
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyUserSession();
  }, []);

  /**
   * Log in user using email or username & password
   */
  const login = async (loginId, password, rememberMe = true) => {
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ loginId, password }),
      });

      if (res.success && res.token) {
        if (rememberMe) {
          localStorage.setItem('stockwise_token', res.token);
        }
        setToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        return { success: true, message: res.message };
      }
      throw new Error(res.message || 'Login failed.');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Register new user with ₹1,00,000 virtual balance
   */
  const register = async ({ fullName, username, email, password, confirmPassword }) => {
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, username, email, password, confirmPassword }),
      });

      if (res.success && res.token) {
        localStorage.setItem('stockwise_token', res.token);
        setToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        return { success: true, message: res.message };
      }
      throw new Error(res.message || 'Registration failed.');
    } catch (error) {
      throw error;
    }
  };

  /**
   * Request password reset link
   */
  const forgotPassword = async (email) => {
    return await api('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  };

  /**
   * Reset password with token from email
   */
  const resetPassword = async (tokenParam, password, confirmPassword) => {
    const res = await api(`/api/auth/reset-password/${tokenParam}`, {
      method: 'POST',
      body: JSON.stringify({ password, confirmPassword }),
    });

    if (res.success && res.token) {
      localStorage.setItem('stockwise_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsAuthenticated(true);
    }
    return res;
  };

  /**
   * Logout user and clear session tokens
   */
  const logout = () => {
    localStorage.removeItem('stockwise_token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  /**
   * Instant demo login for evaluation / mentors
   */
  const loginDemo = () => {
    setUser({
      ...CURRENT_USER,
      id: 'demo_user_1',
      fullName: 'Aarav Sharma',
      username: 'aarav_trader',
      email: 'aarav.sharma@stockwise.trade',
    });
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
        loginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
