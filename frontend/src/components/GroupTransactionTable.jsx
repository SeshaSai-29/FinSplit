import React from 'react';
import { Receipt, Users } from 'lucide-react';

export default function GroupTransactionTable({ transactions, onTransactionClick }) {
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

  // Derive payer name from the populated userId object
  const getPayerName = (txn) => {
    if (txn.userId && typeof txn.userId === 'object' && txn.userId.name) {
      return txn.userId.name;
    }
    return 'Unknown';
  };

  if (transactions.length === 0) {
    return (
      <div className="glass-card transaction-table-card">
        <h2 className="transaction-table__title">
          <Users size={22} style={{ color: 'var(--brand-primary)' }} />
          <span>Shared Expenses</span>
        </h2>
        <div className="empty-state">
          <Receipt size={48} className="empty-icon" />
          <p>No shared expenses yet</p>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Members can log shared expenses from their Personal Dashboard.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card transaction-table-card">
      <h2 className="transaction-table__title">
        <Users size={22} style={{ color: 'var(--brand-primary)' }} />
        <span>Shared Expenses</span>
        <span className="transaction-count">{transactions.length}</span>
      </h2>

      <div className="transaction-table-wrapper">
        <table className="transaction-table" id="group-transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Paid By</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn._id} className="transaction-row" onClick={() => onTransactionClick && onTransactionClick(txn)} style={{ cursor: 'pointer' }}>
                <td className="txn-date">{formatDate(txn.createdAt)}</td>
                <td>
                  <span className="paid-by-badge">
                    {getPayerName(txn)}
                  </span>
                </td>
                <td className="txn-description">{txn.description}</td>
                <td>
                  <span className="category-badge">{txn.category}</span>
                </td>
                <td className={txn.type === 'income' ? 'amount-income' : 'amount-expense'}>
                  {formatCurrency(txn.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
