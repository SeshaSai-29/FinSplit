import React, { useState, useEffect } from 'react';
import { IndianRupee, X, Loader2, AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

export default function ManageGroupBudgetModal({
  isOpen,
  group,
  onClose,
  onBudgetUpdated
}) {
  const [budgetAmount, setBudgetAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setBudgetAmount(group.budget && group.budget > 0 ? group.budget.toString() : '');
      setError('');
      setConfirmRemove(false);
    }
  }, [isOpen, group]);

  // Close modal on Escape key
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
  }, [isOpen, onClose, loading]);

  if (!isOpen || !group) return null;

  const currentBudget = group.budget || 0;
  const isSettingNew = currentBudget === 0;

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    setError('');

    const numericValue = Number(budgetAmount);
    if (isNaN(numericValue) || numericValue < 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group.code}/budget`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ budget: numericValue })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update group budget');
      }

      if (onBudgetUpdated) {
        onBudgetUpdated(data.group, data.message || 'Budget updated successfully');
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBudget = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group.code}/budget`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove group budget');
      }

      if (onBudgetUpdated) {
        onBudgetUpdated(data.group, 'Group budget removed successfully');
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [5000, 10000, 20000, 50000, 100000];

  return (
    <div
      className="confirm-modal-overlay"
      id="manage-budget-modal-overlay"
      onClick={() => {
        if (!loading) onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="glass-card"
        id="manage-budget-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: 0
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-elevated)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
                flexShrink: 0
              }}
            >
              <IndianRupee size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isSettingNew ? 'Set Group Budget' : 'Change Group Budget'}
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {group.name} ({group.code})
              </p>
            </div>
          </div>

          <button
            type="button"
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
              padding: '0.4rem',
              borderRadius: '6px',
              transition: 'all 0.2s ease'
            }}
            id="manage-budget-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSaveBudget} autoComplete="off" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ margin: 0, padding: '0.75rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Budget Info Bar */}
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Current Budget Limit:</span>
            <span style={{ fontWeight: 700, color: currentBudget > 0 ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
              {currentBudget > 0
                ? currentBudget.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                : 'No budget set'}
            </span>
          </div>

          {/* Budget Input Field */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="group-budget-amount-input">
              {isSettingNew ? 'New Budget Amount (₹)' : 'Updated Budget Amount (₹)'}
            </label>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--brand-primary)',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  pointerEvents: 'none'
                }}
              >
                ₹
              </span>
              <input
                id="group-budget-amount-input"
                type="number"
                min="0"
                step="any"
                className="form-input"
                placeholder="e.g. 25000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '1.05rem', fontWeight: 600 }}
                disabled={loading}
                autoFocus
                autoComplete="off"
                required
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
              All group members will see their shared expenses tracked against this budget.
            </span>
          </div>

          {/* Quick preset chips */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
              <IndianRupee size={12} style={{ color: 'var(--brand-primary)' }} /> Quick presets:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBudgetAmount(amt.toString())}
                  disabled={loading}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: budgetAmount === amt.toString() ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface-elevated)',
                    border: budgetAmount === amt.toString() ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                    color: budgetAmount === amt.toString() ? 'var(--brand-primary)' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'all 0.15s'
                  }}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Remove Budget Section (if budget currently exists) */}
          {currentBudget > 0 && (
            <div
              style={{
                marginTop: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px dashed rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem'
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#EF4444', display: 'block' }}>
                  Remove Budget Limit
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Clear the budget limit to track expenses without a ceiling.
                </span>
              </div>

              {!confirmRemove ? (
                <button
                  type="button"
                  onClick={() => setConfirmRemove(true)}
                  disabled={loading}
                  style={{
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleRemoveBudget}
                    disabled={loading}
                    style={{
                      padding: '0.4rem 0.65rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      backgroundColor: '#EF4444',
                      border: 'none',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    {loading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRemove(false)}
                    disabled={loading}
                    style={{
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Action Buttons Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '8px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !budgetAmount || Number(budgetAmount) < 0}
              style={{
                padding: '0.6rem 1.3rem',
                fontSize: '0.9rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isSettingNew ? 'Set Budget' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
