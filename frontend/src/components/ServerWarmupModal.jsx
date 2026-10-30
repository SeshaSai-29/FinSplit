import React, { useEffect, useState } from 'react';
import { 
  Server, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Sparkles, 
  X,
  Loader2 
} from 'lucide-react';
import { 
  subscribeServerHealth, 
  dismissServerHealthModal, 
  ensureServerReady 
} from '../utils/serverHealth.js';

export default function ServerWarmupModal() {
  const [healthState, setHealthState] = useState({
    status: 'idle',
    elapsedSeconds: 0,
    maxSeconds: 60,
    message: ''
  });

  useEffect(() => {
    const unsubscribe = subscribeServerHealth((state) => {
      setHealthState(state);
    });
    return unsubscribe;
  }, []);

  if (healthState.status === 'idle') {
    return null;
  }

  const { status, elapsedSeconds, maxSeconds, message } = healthState;
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / maxSeconds) * 100));

  const handleRetry = () => {
    ensureServerReady({ force: true });
  };

  const handleDismiss = () => {
    dismissServerHealthModal();
  };

  return (
    <div 
      className="server-warmup-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-warmup-title"
    >
      <div className="server-warmup-card">
        {/* Glow ambient background effect */}
        <div className={`server-warmup-glow ${status === 'error' ? 'glow-error' : status === 'ready' ? 'glow-success' : 'glow-primary'}`} />

        {/* Top Header Badge */}
        <div className="server-warmup-header">
          <div className="server-badge">
            <span className={`status-dot ${status === 'error' ? 'dot-error' : status === 'ready' ? 'dot-success' : 'dot-active'}`} />
            <span>Render Cloud Service</span>
            <span className="badge-divider">•</span>
            <span>{status === 'error' ? 'Connection Error' : status === 'ready' ? 'Online' : 'Cold-Start Warmup'}</span>
          </div>

          {status === 'error' && (
            <button 
              type="button" 
              onClick={handleDismiss} 
              className="server-warmup-close-btn"
              title="Close notification"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Icon Centerpiece */}
        <div className="server-warmup-icon-wrapper">
          {status === 'checking' && (
            <div className="icon-pulse-container">
              <div className="pulse-ring ring-1" />
              <div className="pulse-ring ring-2" />
              <div className="icon-center bg-primary-glow">
                <Server size={32} className="pulse-server-icon" />
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="icon-center bg-success-glow animate-pop">
              <CheckCircle2 size={40} className="text-success" />
            </div>
          )}

          {status === 'error' && (
            <div className="icon-center bg-error-glow animate-shake">
              <AlertTriangle size={38} className="text-danger" />
            </div>
          )}
        </div>

        {/* Title and Narrative */}
        <div className="server-warmup-body">
          <h3 id="server-warmup-title" className="server-warmup-title">
            {status === 'checking' && 'Waking Up Cloud Server...'}
            {status === 'ready' && 'Server is Online!'}
            {status === 'error' && 'Server Taking Longer Than Expected'}
          </h3>

          <p className="server-warmup-desc">
            {status === 'checking' && (
              <>
                Render's free tier spins down services after inactivity. FinSplit is booting the backend container and linking the database. 
                <span className="warmup-highlight"> Your request will automatically continue as soon as it wakes up!</span>
              </>
            )}
            {status === 'ready' && 'Connection verified successfully. Resuming your requested action now...'}
            {status === 'error' && (
              message || 'The server is experiencing some issues or taking longer than expected to wake up. Please try again later.'
            )}
          </p>

          {/* Progress Section (during checking) */}
          {status === 'checking' && (
            <div className="server-warmup-progress-box">
              <div className="progress-meta">
                <span className="progress-label">
                  <Clock size={13} style={{ marginRight: '5px' }} />
                  Elapsed: <strong>{elapsedSeconds}s</strong> / {maxSeconds}s max
                </span>
                <span className="progress-percentage">{progressPercent}%</span>
              </div>

              <div className="progress-track">
                <div 
                  className="progress-fill"
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                >
                  <div className="progress-shimmer" />
                </div>
              </div>

              <div className="warmup-substeps">
                <div className={`substep-item ${elapsedSeconds >= 1 ? 'active' : ''}`}>
                  <span className="substep-check">✓</span>
                  <span>Health Ping Dispatched</span>
                </div>
                <div className={`substep-item ${elapsedSeconds >= 12 ? 'active' : ''}`}>
                  <span className="substep-check">✓</span>
                  <span>Booting Node Container</span>
                </div>
                <div className={`substep-item ${elapsedSeconds >= 25 ? 'active' : ''}`}>
                  <span className="substep-check">✓</span>
                  <span>MongoDB Atlas Connection</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons (on error) */}
          {status === 'error' && (
            <div className="server-warmup-actions">
              <button 
                type="button" 
                onClick={handleRetry} 
                className="btn-warmup-retry"
              >
                <RefreshCw size={16} />
                <span>Retry Connection</span>
              </button>
              <button 
                type="button" 
                onClick={handleDismiss} 
                className="btn-warmup-dismiss"
              >
                <span>Dismiss</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Scoped CSS for Glassmorphism & High-End Micro-Animations */}
      <style>{`
        .server-warmup-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(5, 9, 20, 0.78);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: warmupFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          padding: 1.25rem;
        }

        .server-warmup-card {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: linear-gradient(145deg, #111A2E 0%, #0A0F1D 100%);
          border: 1px solid rgba(59, 130, 246, 0.28);
          border-radius: 18px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 45px rgba(59, 130, 246, 0.15);
          overflow: hidden;
          padding: 1.75rem;
          color: #F8FAFC;
          font-family: var(--font-body, -apple-system, sans-serif);
          animation: warmupScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .server-warmup-glow {
          position: absolute;
          top: -80px;
          left: 50%;
          transform: translateX(-50%);
          width: 280px;
          height: 160px;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(65px);
          opacity: 0.5;
        }
        .glow-primary { background: #3B82F6; }
        .glow-success { background: #10B981; }
        .glow-error { background: #EF4444; }

        .server-warmup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .server-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          background: rgba(31, 44, 74, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #94A3B8;
        }

        .badge-divider {
          opacity: 0.4;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .dot-active {
          background-color: #3B82F6;
          box-shadow: 0 0 10px #3B82F6;
          animation: dotBlink 1.4s ease-in-out infinite;
        }
        .dot-success {
          background-color: #10B981;
          box-shadow: 0 0 10px #10B981;
        }
        .dot-error {
          background-color: #EF4444;
          box-shadow: 0 0 10px #EF4444;
        }

        .server-warmup-close-btn {
          background: transparent;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        .server-warmup-close-btn:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.1);
        }

        .server-warmup-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0.5rem 0 1.5rem 0;
        }

        .icon-pulse-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 84px;
          height: 84px;
        }

        .pulse-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(59, 130, 246, 0.4);
          animation: pulseWave 2.4s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
        .ring-1 { width: 100%; height: 100%; }
        .ring-2 { width: 130%; height: 130%; animation-delay: 0.8s; opacity: 0.6; }

        .icon-center {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .bg-primary-glow {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(6, 182, 212, 0.15));
          border: 1.5px solid rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.35);
        }
        .pulse-server-icon {
          color: #60A5FA;
          animation: floatIcon 2s ease-in-out infinite;
        }

        .bg-success-glow {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
          border: 1.5px solid #10B981;
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.4);
        }
        .text-success { color: #10B981; }

        .bg-error-glow {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(185, 28, 28, 0.1));
          border: 1.5px solid #EF4444;
          box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
        }
        .text-danger { color: #EF4444; }

        .server-warmup-body {
          text-align: center;
        }

        .server-warmup-title {
          font-family: var(--font-heading, sans-serif);
          font-size: 1.35rem;
          font-weight: 700;
          color: #F8FAFC;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .server-warmup-desc {
          font-size: 0.9rem;
          line-height: 1.55;
          color: #94A3B8;
          margin-bottom: 1.5rem;
        }

        .warmup-highlight {
          color: #60A5FA;
          font-weight: 500;
        }

        .server-warmup-progress-box {
          background: rgba(13, 20, 36, 0.7);
          border: 1px solid rgba(31, 44, 74, 0.8);
          border-radius: 12px;
          padding: 1.1rem;
          text-align: left;
        }

        .progress-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: #94A3B8;
          margin-bottom: 0.6rem;
        }

        .progress-label {
          display: flex;
          align-items: center;
        }

        .progress-percentage {
          font-family: var(--font-mono, monospace);
          font-weight: 600;
          color: #38BDF8;
        }

        .progress-track {
          width: 100%;
          height: 8px;
          background: #18233C;
          border-radius: 9999px;
          overflow: hidden;
          margin-bottom: 0.9rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #8B5CF6 100%);
          border-radius: 9999px;
          position: relative;
          transition: width 0.4s ease;
        }

        .progress-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          animation: shimmerMove 1.8s infinite;
        }

        .warmup-substeps {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          border-top: 1px dashed rgba(31, 44, 74, 0.8);
          padding-top: 0.75rem;
        }

        .substep-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.78rem;
          color: #64748B;
          transition: color 0.3s ease;
        }

        .substep-item.active {
          color: #E2E8F0;
        }

        .substep-check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #1E293B;
          color: #64748B;
          font-size: 0.65rem;
          font-weight: bold;
        }

        .substep-item.active .substep-check {
          background: rgba(16, 185, 129, 0.2);
          color: #10B981;
        }

        .server-warmup-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .btn-warmup-retry {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #3B82F6;
          color: #FFFFFF;
          border: none;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        }
        .btn-warmup-retry:hover {
          background: #2563EB;
          transform: translateY(-1px);
        }

        .btn-warmup-dismiss {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(31, 44, 74, 0.6);
          color: #94A3B8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-warmup-dismiss:hover {
          color: #FFFFFF;
          background: rgba(31, 44, 74, 0.9);
        }

        @keyframes pulseWave {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes shimmerMove {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes warmupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes warmupScaleIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .animate-pop {
          animation: popSuccess 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes popSuccess {
          0% { transform: scale(0.7); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
