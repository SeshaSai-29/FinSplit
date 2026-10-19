import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { API_BASE_URL } from './utils/api.js'

// In production (e.g. on Vercel), route relative /api requests to the Render backend
if (API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${API_BASE_URL}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api')) {
      input = new URL(`${API_BASE_URL}${input.pathname}${input.search}`);
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      input = new Request(`${API_BASE_URL}${input.url}`, input);
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

