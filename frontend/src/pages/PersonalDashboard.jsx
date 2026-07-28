import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, LayoutDashboard } from 'lucide-react';
import BalanceCard from '../components/BalanceCard';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';

export default function PersonalDashboard({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/transactions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAdded = (newTransaction) => {
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const handleTransactionDeleted = (id) => {
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={40} style={{ color: '#06b6d4', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your transactions...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <LayoutDashboard size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: '#06b6d4' }} />
          Personal Dashboard
        </h1>
        <p className="page-subtitle">
          Track your income and expenses — manage your personal finances at a glance.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <BalanceCard transactions={transactions} />

      <div className="dashboard-layout">
        <div className="dashboard-main">
          <TransactionTable
            transactions={transactions}
            onTransactionDeleted={handleTransactionDeleted}
          />
        </div>
        <div className="dashboard-sidebar">
          <TransactionForm onTransactionAdded={handleTransactionAdded} user={user} />
        </div>
      </div>
    </div>
  );
}
