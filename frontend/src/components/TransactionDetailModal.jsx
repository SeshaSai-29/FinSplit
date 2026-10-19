import React, { useState } from 'react';
import { X, Calendar, Tag, User, IndianRupee, Split, Trash2, Loader2, Receipt, HandCoins } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import SettleModal from './SettleModal';

export default function TransactionDetailModal({ 
  transaction, 
  onClose, 
  currentUserId, 
  members = [], 
  onDelete = null, 
  onSettled = null,
  readOnly = false 
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  if (!transaction) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) =>
    value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });

  const payerId = transaction.userId && typeof transaction.userId === 'object' 
    ? transaction.userId._id 
    : transaction.userId;

  const isOwner = payerId === currentUserId;

  const getPayerObject = () => {
    if (transaction.userId && typeof transaction.userId === 'object' && transaction.userId.name) {
      return {
        _id: transaction.userId._id,
        name: transaction.userId.name,
      };
    }
    const memberMatch = members.find((m) => (m._id || m.id) === payerId);
    if (memberMatch) {
      return {
        _id: memberMatch._id || memberMatch.id,
        name: memberMatch.name,
      };
    }
    return {
      _id: payerId,
      name: 'Payer',
    };
  };

  const getPayerName = () => {
    if (transaction.userId && typeof transaction.userId === 'object' && transaction.userId.name) {
      return payerId === currentUserId ? 'You' : transaction.userId.name;
    }
    return payerId === currentUserId ? 'You' : 'Unknown';
  };

  // Derive split breakdown list
  const getSplitsBreakdown = () => {
    if (!transaction.isShared) {
      return [];
    }

    // 1. Equal Split with populated splits array
    if (transaction.splitType === 'equal' && transaction.splits && transaction.splits.length > 0) {
      return transaction.splits.map(s => {
        const memberId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
        const name = s.userId && typeof s.userId === 'object' && s.userId.name 
          ? (memberId === currentUserId ? 'You' : s.userId.name)
          : (memberId === currentUserId ? 'You' : 'Unknown');

        return {
          userId: memberId,
          name,
          shares: s.shares || 1,
          amount: s.amount,
          isPayer: memberId === payerId
        };
      });
    }

    // 2. Custom Split with populated splits array
    if (transaction.splitType === 'custom' && transaction.splits && transaction.splits.length > 0) {
      const breakdown = transaction.splits.map(s => {
        const memberId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
        const name = s.userId && typeof s.userId === 'object' && s.userId.name 
          ? (memberId === currentUserId ? 'You' : s.userId.name)
          : (memberId === currentUserId ? 'You' : 'Unknown');

        return {
          userId: memberId,
          name,
          shares: null,
          amount: s.amount,
          isPayer: memberId === payerId
        };
      });

      // Add payer if they are not in the splits explicitly (since custom split leaves payer's share as remainder)
      const hasPayerInSplits = breakdown.some(s => s.userId === payerId);
      if (!hasPayerInSplits) {
        const splitTotal = transaction.splits.reduce((sum, s) => sum + s.amount, 0);
        const payerAmount = Math.max(0, transaction.amount - splitTotal);
        
        let payerDisplayName = 'You';
        if (transaction.userId && typeof transaction.userId === 'object' && transaction.userId.name) {
          payerDisplayName = payerId === currentUserId ? 'You' : transaction.userId.name;
        }

        breakdown.push({
          userId: payerId,
          name: payerDisplayName,
          shares: null,
          amount: payerAmount,
          isPayer: true
        });
      }

      return breakdown;
    }

    // 3. Fallback/Legacy Equal Split (where splits array is empty)
    // Split equally among all group members passed via members prop
    if ((!transaction.splits || transaction.splits.length === 0) && members.length > 0) {
      const count = members.length;
      const shareAmount = transaction.amount / count;
      return members.map(m => {
        const memberId = m._id || m.id;
        const name = memberId === currentUserId ? 'You' : m.name;
        return {
          userId: memberId,
          name,
          shares: 1,
          amount: shareAmount,
          isPayer: memberId === payerId
        };
      });
    }

    return [];
  };

  const splitsList = getSplitsBreakdown();
  const currentUserSplit = splitsList.find((s) => s.userId === currentUserId);
  const userOwedShare = currentUserSplit ? currentUserSplit.amount : 0;

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(transaction._id);
      }
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Error deleting from detail modal:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettlementSuccess = (newTxn) => {
    if (onSettled) {
      onSettled(newTxn);
    }
    setShowSettleModal(false);
    onClose();
  };

  const groupId = transaction.groupIds && transaction.groupIds.length > 0 ? transaction.groupIds[0] : '';

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose} 
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
        padding: '1rem'
      }}
    >
      <div 
        className="modal-container" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '550px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        id="transaction-detail-modal"
      >
        {/* Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={18} style={{ color: 'var(--brand-primary)' }} />
            <span>Transaction Details</span>
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.25rem',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-surface-elevated)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '75vh', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Main Info Header */}
          <div style={{ textAlign: 'center', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              {transaction.category}
            </span>
            <h2 style={{ margin: '0.25rem 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {transaction.description}
            </h2>
            <div 
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: transaction.type === 'income' ? '#22C55E' : '#EF4444',
                fontFamily: 'var(--font-mono, monospace)'
              }}
            >
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Calendar size={14} />
                <span>Date & Time</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatDate(transaction.createdAt || new Date())}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <User size={14} />
                <span>Paid By</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {getPayerName()}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Tag size={14} />
                <span>Transaction Type</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {transaction.type}
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <Split size={14} />
                <span>Sharing Mode</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {transaction.isShared 
                  ? (transaction.splitType === 'equal' ? 'Equal Split' : 'Custom Split')
                  : 'Personal (No Split)'}
              </div>
            </div>
          </div>

          {/* Split Breakdown */}
          {transaction.isShared && (
            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Split Breakdown
              </h4>
              
              {splitsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'var(--bg-surface-elevated)', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No split details available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {splitsList.map((split) => (
                    <div 
                      key={split.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-surface-elevated)',
                        border: split.isPayer ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {split.name}
                          {split.isPayer && (
                            <span 
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.05rem 0.35rem', 
                                background: 'rgba(34, 197, 94, 0.15)', 
                                color: '#22C55E', 
                                borderRadius: '4px',
                                fontWeight: 600
                              }}
                            >
                              Payer
                            </span>
                          )}
                        </span>
                        {split.shares && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {split.shares} {split.shares === 1 ? 'share' : 'shares'}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatCurrency(split.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!readOnly && (
          <div 
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}
          >
            {transaction.isShared && transaction.category !== 'Settlement' && !isOwner && userOwedShare > 0 && (
              <button
                type="button"
                onClick={() => setShowSettleModal(true)}
                className="btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
                id="settle-payer-btn"
              >
                <HandCoins size={16} />
                <span>Settle Your Share ({formatCurrency(userOwedShare)})</span>
              </button>
            )}

            {isOwner && onDelete && (
              <button
                className="btn-danger"
                onClick={handleDeleteClick}
                disabled={isDeleting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 1.25rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Transaction</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <>
          <ConfirmDeleteModal
            isOpen={showConfirmDelete}
            title="Delete Transaction"
            message="Are you sure you want to delete this transaction? This action cannot be undone."
            onConfirm={handleConfirmDelete}
            onCancel={() => setShowConfirmDelete(false)}
            isDeleting={isDeleting}
          />

          <SettleModal
            isOpen={showSettleModal}
            payee={getPayerObject()}
            owedAmount={userOwedShare}
            groupId={groupId}
            onSettled={handleSettlementSuccess}
            onClose={() => setShowSettleModal(false)}
          />
        </>
      )}
    </div>
  );
}

