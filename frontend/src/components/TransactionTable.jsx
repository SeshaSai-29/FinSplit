import React, { useState } from 'react';
import { Trash2, Loader2, Receipt } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';

export default function TransactionTable({ 
  transactions, 
  onTransactionDeleted, 
  onTransactionClick, 
  filterType = 'all',
  isDateFiltered = false,
  onResetFilters = null
}) {
  const [deletingId, setDeletingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const filteredTransactions = transactions.filter((txn) => {
    if (filterType === 'all') return true;
    return txn.type === filterType;
  });

  const executeDelete = async () => {
    if (!pendingDeleteId || deletingId) return;

    const id = pendingDeleteId;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete transaction');
      }

      setPendingDeleteId(null);
      if (onTransactionDeleted) {
        onTransactionDeleted(id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRowClick = (e, txn) => {
    if (e.target.closest('.btn-danger-sm')) {
      return;
    }
    if (onTransactionClick) {
      onTransactionClick(txn);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value) =>
    value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });

  if (transactions.length === 0) {
    return (
      <div className="glass-card transaction-table-card">
        <h2 className="transaction-table__title">
          <Receipt size={22} style={{ color: 'var(--brand-primary)' }} />
          <span>Transaction History</span>
        </h2>
        <div className="empty-state">
          <Receipt size={48} className="empty-icon" />
          <p>{isDateFiltered ? 'No transactions found in selected period' : 'No transactions yet'}</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isDateFiltered 
              ? 'There are no transactions matching the selected month or year.' 
              : 'Add your first transaction using the form to get started.'}
          </span>
          {isDateFiltered && onResetFilters && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onResetFilters}
              style={{ marginTop: '0.85rem', padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              Reset Date Filter
            </button>
          )}
        </div>
      </div>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <div className="glass-card transaction-table-card">
        <h2 className="transaction-table__title">
          <Receipt size={22} style={{ color: 'var(--brand-primary)' }} />
          <span>Transaction History</span>
        </h2>
        <div className="empty-state">
          <Receipt size={48} className="empty-icon" />
          <p>No {filterType} transactions found</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isDateFiltered 
              ? `There are no ${filterType} transactions in the selected time period.`
              : `There are no ${filterType} transactions matching your selected filter.`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card transaction-table-card">
      <h2 className="transaction-table__title">
        <Receipt size={22} style={{ color: 'var(--brand-primary)' }} />
        <span>Transaction History</span>
        <span className="transaction-count">{filteredTransactions.length}</span>
      </h2>

      <div className="transaction-table-wrapper">
        <table className="transaction-table" id="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((txn) => (
              <tr key={txn._id} className="transaction-row" onClick={(e) => handleRowClick(e, txn)} style={{ cursor: 'pointer' }}>
                <td className="txn-date">{formatDate(txn.createdAt)}</td>
                <td className="txn-description">{txn.description}</td>
                <td>
                  <span className="category-badge">{txn.category}</span>
                </td>
                <td className={txn.type === 'income' ? 'amount-income' : 'amount-expense'}>
                  {formatCurrency(txn.amount)}
                </td>
                <td>
                  <button
                    className="btn-danger-sm"
                    onClick={() => setPendingDeleteId(txn._id)}
                    disabled={deletingId === txn._id}
                    title="Delete transaction"
                    id={`delete-txn-${txn._id}`}
                  >
                    {deletingId === txn._id ? (
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDeleteModal
        isOpen={!!pendingDeleteId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setPendingDeleteId(null)}
        isDeleting={!!deletingId}
      />
    </div>
  );
}
