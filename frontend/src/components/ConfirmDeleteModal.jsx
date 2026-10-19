import React, { useEffect } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  onConfirm,
  onCancel,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDeleting = false
}) {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onCancel && !isDeleting) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, isDeleting]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={() => {
        if (onCancel && !isDeleting) onCancel();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        id="confirm-delete-modal"
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <span>{title}</span>
          </h3>

          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.35rem',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              opacity: isDeleting ? 0.5 : 1,
            }}
            onMouseOver={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.background = 'var(--bg-surface-elevated)';
              }
            }}
            onMouseOut={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.background = 'transparent';
              }
            }}
            aria-label="Close dialog"
            id="confirm-modal-close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          <p style={{ margin: 0 }}>{message}</p>
        </div>

        {/* Action Buttons Footer */}
        <div
          style={{
            padding: '1rem 1.5rem 1.25rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          {/* Neutral Cancel Button */}
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.9rem',
              borderRadius: '8px',
              height: '38px',
            }}
            id="confirm-modal-cancel-btn"
          >
            {cancelText}
          </button>

          {/* Destructive Red Delete Button */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn-danger"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              height: '38px',
            }}
            id="confirm-modal-delete-btn"
          >
            {isDeleting ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
