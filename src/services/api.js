/**
 * StockWise Centralized API Client
 * Automatically handles token injection, headers, and uniform error reporting.
 */

// Use configured production API URL in production, or fallback to relative path (proxied by Vite) in dev
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const api = async (endpoint, options = {}) => {
  const token = localStorage.getItem('stockwise_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    // If network fails (e.g., backend server not started)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to StockWise API server. Please check your backend connection.');
    }
    throw error;
  }
};
