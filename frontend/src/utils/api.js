/**
 * FinSplit API Configuration Utility
 * Supports decoupled deployment (Vercel Frontend + Render Backend)
 */

// Base URL for backend API calls.
// In development, this is empty (relative '/api') so Vite proxy handles requests.
// In production on Vercel, set VITE_API_URL to your Render service URL (e.g. https://my-backend.onrender.com).
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Helper to build an absolute or proxied API endpoint URL
 * @param {string} endpoint - Path such as '/api/auth/google' or '/api/transactions'
 * @returns {string} Fully qualified or relative URL
 */
export const getApiUrl = (endpoint = '') => {
  if (!endpoint) return API_BASE_URL || '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
