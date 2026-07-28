import React, { useState } from 'react';
import { Trash2, Loader2, Receipt } from 'lucide-react';

export default function TransactionTable({ transactions, onTransactionDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (deletingId) return; // Prevent double-click

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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

  if (transactions.length === 0) {
    return (
      <div className="glass-card transaction-table-card">
        <h2 className="transaction-table__title">
          <Receipt size={22} style={{ color: '#22d3ee' }} />
          <span>Transaction History</span>
        </h2>
        <div className="empty-state">
          <Receipt size={48} className="empty-icon" />
          <p>No transactions yet</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Add your first transaction using the form to get started.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card transaction-table-card">
      <h2 className="transaction-table__title">
        <Receipt size={22} style={{ color: '#22d3ee' }} />
        <span>Transaction History</span>
        <span className="transaction-count">{transactions.length}</span>
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
            {transactions.map((txn) => (
              <tr key={txn._id} className="transaction-row">
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
                    onClick={() => handleDelete(txn._id)}
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
    </div>
  );
}
