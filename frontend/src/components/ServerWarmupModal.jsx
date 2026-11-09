import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, RefreshCw, X } from 'lucide-react';
import {
  subscribeServerHealth,
  dismissServerHealthModal,
  ensureServerReady
} from '../utils/serverHealth.js';

export default function ServerWarmupModal() {
  const [healthState, setHealthState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    return subscribeServerHealth((state) => setHealthState(state));
  }, []);

  if (healthState.status === 'idle' || healthState.status === 'ready') {
    return null;
  }

  const { status, message } = healthState;

  return (
    <div className="server-warmup-overlay">
      <div className="server-warmup-box">
        {status === 'checking' && (
          <>
            <Loader2
              size={36}
              style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }}
            />
            <h3 className="server-warmup-heading">The server is starting</h3>
            <p className="server-warmup-text">Please wait for some time...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle size={36} style={{ color: 'var(--color-danger)' }} />
            <h3 className="server-warmup-heading">Something went wrong</h3>
            <p className="server-warmup-text">
              {message || 'Please try again later.'}
            </p>
            <div className="server-warmup-btns">
              <button
                type="button"
                className="btn-primary"
                onClick={() => ensureServerReady({ force: true })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={15} />
                Retry
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={dismissServerHealthModal}
              >
                Dismiss
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .server-warmup-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-deep, #0A0F1D);
          padding: 1.5rem;
        }

        .server-warmup-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
          max-width: 380px;
        }

        .server-warmup-heading {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary, #F8FAFC);
          margin: 0;
        }

        .server-warmup-text {
          font-family: var(--font-body, sans-serif);
          font-size: 0.9rem;
          color: var(--text-secondary, #94A3B8);
          margin: 0;
          line-height: 1.5;
        }

        .server-warmup-btns {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
