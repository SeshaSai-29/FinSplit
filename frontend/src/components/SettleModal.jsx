import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HandCoins, X, Loader2, AlertCircle, CheckCircle2, IndianRupee, ArrowRight } from 'lucide-react';

export default function SettleModal({
  isOpen,
  payee,
  owedAmount = 0,
  groupId,
  groupName,
  onSettled,
  onClose,
}) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && payee) {
      const defaultAmt = Number(owedAmount) > 0 ? Number(owedAmount).toFixed(2) : '';
      setAmount(defaultAmt);
      setDescription(`Settlement to ${payee.name || 'member'}`);
      setError('');
      setSuccess('');
    }
  }, [isOpen, payee, owedAmount]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !payee) return null;

  const payeeId = payee._id || payee.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setError('Please enter a valid positive settlement amount.');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description for this settlement.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: numericAmount,
          type: 'expense',
          category: 'Settlement',
          isShared: true,
          groupIds: [groupId],
          splitType: 'custom',
          splits: [
            {
              userId: payeeId,
              amount: numericAmount,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record settlement.');
      }

      setSuccess('Settlement recorded successfully!');
      if (onSettled) {
        onSettled(data);
      }

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) =>
    Number(val).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });

  return createPortal(
    <div
      className="settle-modal-overlay"
      onClick={() => {
        if (!loading) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="settle-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '512px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
          margin: 'auto 0',
          maxHeight: '90vh',
          overflowY: 'auto',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
        }}
        id="settle-modal"
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.15rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22C55E',
                flexShrink: 0,
              }}
            >
              <HandCoins size={18} />
            </div>
            <span>Record Settlement</span>
          </h3>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-surface-elevated)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
            aria-label="Close dialog"
            id="settle-modal-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ margin: 0 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ margin: 0 }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Transfer Summary Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Payer
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                You
              </span>
            </div>

            <div style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ArrowRight size={18} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Payee
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#22C55E' }}>
                {payee.name}
              </span>
            </div>
          </div>

          {/* Group and Category Badges */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, background: 'var(--bg-surface-elevated)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                Group
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                {groupName || groupId || 'Current Group'}
              </span>
            </div>

            <div style={{ flex: 1, background: 'var(--bg-surface-elevated)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem' }}>
                Category
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Settlement
              </span>
            </div>
          </div>

          {/* Amount Field */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="settle-amount">
              Settlement Amount (₹)
            </label>
            <div className="input-wrapper">
              <IndianRupee className="input-icon" size={18} />
              <input
                id="settle-amount"
                className="form-input"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoComplete="off"
                disabled={loading}
                required
              />
            </div>
            {owedAmount > 0 && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
                Total owed: {formatCurrency(owedAmount)} (You can edit to settle partial amount)
              </span>
            )}
          </div>

          {/* Description Field */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="settle-description">
              Note / Description
            </label>
            <input
              id="settle-description"
              className="form-input form-input--no-icon"
              type="text"
              placeholder="e.g. Settlement to User"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoComplete="off"
              disabled={loading}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !amount || Number(amount) <= 0}
            style={{
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.75rem',
            }}
            id="settle-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Recording Settlement...</span>
              </>
            ) : (
              <>
                <HandCoins size={18} />
                <span>Confirm Settlement</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
