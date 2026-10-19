import React, { useState, useEffect } from 'react';
import { Target, X, Loader2, AlertCircle, Trash2, CheckCircle2, Plus, Edit2 } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Food',
  'Rent',
  'Entertainment',
  'Utilities',
  'Transport',
  'Healthcare',
  'Shopping',
  'Electricity',
  'Water bill',
  'Tax',
  'Insurance',
  'Groceries',
  'Personal care',
  'Pet',
  'Gift',
  'Salary',
  'Others'
];

export default function CategoryBudgetModal({
  isOpen,
  onClose,
  initialCategory = '',
  initialLimit = '',
  existingBudgets = [],
  onBudgetsUpdated
}) {
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [customCategory, setCustomCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setConfirmDelete(false);

      if (initialCategory) {
        setIsEditing(true);
        if (DEFAULT_CATEGORIES.includes(initialCategory)) {
          setSelectedCategory(initialCategory);
          setCustomCategory('');
        } else {
          setSelectedCategory('Custom');
          setCustomCategory(initialCategory);
        }
        setLimit(initialLimit !== undefined && initialLimit !== null ? initialLimit.toString() : '');
      } else {
        setIsEditing(false);
        // Default to first unused category if possible
        const usedSet = new Set((existingBudgets || []).map((b) => b.category.toLowerCase()));
        const firstAvailable = DEFAULT_CATEGORIES.find((c) => !usedSet.has(c.toLowerCase())) || 'Food';
        setSelectedCategory(firstAvailable);
        setCustomCategory('');
        setLimit('');
      }
    }
  }, [isOpen, initialCategory, initialLimit, existingBudgets]);

  // Handle ESC key
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

  if (!isOpen) return null;

  const getEffectiveCategory = () => {
    if (selectedCategory === 'Custom') {
      return customCategory.trim();
    }
    return selectedCategory;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    const targetCategory = getEffectiveCategory();
    if (!targetCategory) {
      setError('Please provide a category name.');
      return;
    }

    const numericLimit = Number(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setError('Please enter a valid budget limit greater than 0.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/category-budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: targetCategory,
          limit: numericLimit
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save category budget');
      }

      if (onBudgetsUpdated) {
        onBudgetsUpdated(data.categoryBudgets, data.message || `Budget set for ${targetCategory}`);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const targetCategory = getEffectiveCategory();
    if (!targetCategory) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/category-budgets/${encodeURIComponent(targetCategory)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete category budget');
      }

      if (onBudgetsUpdated) {
        onBudgetsUpdated(data.categoryBudgets, `Budget for ${targetCategory} removed`);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLimits = [2000, 5000, 10000, 15000, 25000];

  return (
    <div
      className="confirm-modal-overlay"
      id="category-budget-modal-overlay"
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
        backdropFilter: 'blur(5px)'
      }}
    >
      <div
        className="glass-card"
        id="category-budget-modal-card"
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
        {/* Header */}
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
                backgroundColor: 'var(--brand-primary-subtle)',
                border: '1px solid var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
                flexShrink: 0
              }}
            >
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isEditing ? 'Edit Category Budget' : 'Set Category Budget'}
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Set spending ceilings for specific expense categories
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
            id="category-budget-modal-close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} autoComplete="off" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="alert alert-danger" style={{ margin: 0, padding: '0.75rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Category Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="category-select">Category</label>
            <select
              id="category-select"
              className="form-input form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={loading || (isEditing && initialCategory && initialCategory !== 'Custom')}
              style={{ fontSize: '0.95rem' }}
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="Custom">Custom Category...</option>
            </select>
          </div>

          {selectedCategory === 'Custom' && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="custom-category-input">Custom Category Name</label>
              <input
                id="custom-category-input"
                type="text"
                className="form-input"
                placeholder="e.g. Subscriptions, Gym, Coffee"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                disabled={loading}
                autoComplete="off"
                required
              />
            </div>
          )}

          {/* Budget Limit Input */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="category-limit-input">
              Monthly Budget Limit (₹)
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
                id="category-limit-input"
                type="number"
                min="1"
                step="any"
                className="form-input"
                placeholder="e.g. 10000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                style={{ paddingLeft: '2.5rem', fontSize: '1.05rem', fontWeight: 600 }}
                disabled={loading}
                autoFocus={!isEditing}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
              <Target size={12} style={{ color: 'var(--brand-primary)' }} /> Quick presets:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {quickLimits.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setLimit(amt.toString())}
                  disabled={loading}
                  style={{
                    padding: '0.3rem 0.6rem',
                    fontSize: '0.75rem',
                    borderRadius: '6px',
                    backgroundColor: limit === amt.toString() ? 'var(--brand-primary-subtle)' : 'var(--bg-surface-elevated)',
                    border: limit === amt.toString() ? '1px solid var(--brand-primary)' : '1px solid var(--border-color)',
                    color: limit === amt.toString() ? 'var(--brand-primary)' : 'var(--text-primary)',
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

          {/* Delete Option if editing */}
          {isEditing && (
            <div
              style={{
                marginTop: '0.25rem',
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
                  Remove Category Budget
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Clear target limit for this category
                </span>
              </div>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
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
                    gap: '0.35rem'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={handleDelete}
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
                    onClick={() => setConfirmDelete(false)}
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

          {/* Actions Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '0.5rem',
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
              disabled={loading || !limit || Number(limit) <= 0}
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
                  <span>{isEditing ? 'Save Changes' : 'Set Budget'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
