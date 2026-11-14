import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './utils/api.js'
import { ensureServerReady } from './utils/serverHealth.js'

// Global fetch interceptor — combines URL rewriting (Vercel → Render) with server
// warmup. The first non-health /api call will trigger ensureServerReady() so that
// every page (including deep-linked routes) is covered without per-page guards.
let serverEnsured = false;

const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  // Normalise input to a string URL for inspection
  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.toString()
        : '';

  const isApiCall = rawUrl.startsWith('/api') || (API_BASE_URL && rawUrl.startsWith(API_BASE_URL + '/api'));
  const isHealthCheck = rawUrl.includes('/api/health');

  // Trigger warmup on the first real API call (skip health pings to avoid recursion)
  if (isApiCall && !isHealthCheck && !serverEnsured) {
    serverEnsured = true;
    await ensureServerReady();
  }

  // Rewrite relative /api paths to the absolute Render backend URL in production
  if (API_BASE_URL) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${API_BASE_URL}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api')) {
      input = new URL(`${API_BASE_URL}${input.pathname}${input.search}`);
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      input = new Request(`${API_BASE_URL}${input.url}`, input);
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

