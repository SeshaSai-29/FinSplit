import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, LayoutDashboard, CheckCircle2, Target, Settings, PlusCircle, X, Calendar, Filter, RotateCcw } from 'lucide-react';
import BalanceCard from '../components/BalanceCard';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';
import TransactionDetailModal from '../components/TransactionDetailModal';

const MONTH_NAMES = [
  { value: 'all', label: 'All Months' },
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function PersonalDashboard({ user }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTransaction, setActiveTransaction] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  // Date filter state: month and year
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowTransactionModal(false);
      }
    };
    if (showTransactionModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTransactionModal]);

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
    try {
      localStorage.setItem('home_cache_dirty', 'true');
      window.dispatchEvent(new Event('finsplit_data_changed'));
    } catch (e) {}
    // If this is a group income transaction, do not add to personal dashboard
    if (newTransaction.type === 'income' && (newTransaction.isShared || (newTransaction.groupIds && newTransaction.groupIds.length > 0))) {
      return;
    }
    setTransactions((prev) => [newTransaction, ...prev]);
  };

  const handleTransactionDeleted = (id) => {
    try {
      localStorage.setItem('home_cache_dirty', 'true');
      window.dispatchEvent(new Event('finsplit_data_changed'));
    } catch (e) {}
    setTransactions((prev) => prev.filter((t) => t._id !== id));
  };

  const handleDeleteTransaction = async (id) => {
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

      handleTransactionDeleted(id);
      setSuccess('Transaction deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message);
      throw err;
    }
  };

  // Derive distinct years from transaction timestamps, ensuring current year is included
  const availableYears = useMemo(() => {
    const currentYr = new Date().getFullYear();
    const yearSet = new Set([currentYr]);
    transactions.forEach((txn) => {
      const rawDate = txn.createdAt || txn.date;
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          yearSet.add(d.getFullYear());
        }
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [transactions]);

  // Filter transactions by selected Month and Year using transaction timestamps
  const filteredByDateTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const rawDate = txn.createdAt || txn.date;
      if (!rawDate) return true;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return true;

      const txnYear = d.getFullYear().toString();
      const txnMonth = (d.getMonth() + 1).toString();

      if (selectedYear !== 'all' && txnYear !== selectedYear.toString()) {
        return false;
      }
      if (selectedMonth !== 'all' && txnMonth !== selectedMonth.toString()) {
        return false;
      }
      return true;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const isDateFiltered = selectedYear !== 'all' || selectedMonth !== 'all';

  const getFilterLabel = () => {
    if (selectedYear === 'all' && selectedMonth === 'all') {
      return 'All time';
    }
    const monthName = selectedMonth !== 'all' ? MONTH_NAMES.find((m) => m.value === selectedMonth)?.label : null;
    if (selectedYear !== 'all' && selectedMonth !== 'all') {
      return `${monthName} ${selectedYear}`;
    }
    if (selectedYear !== 'all') {
      return `Year ${selectedYear}`;
    }
    return `Every ${monthName}`;
  };

  const handleResetDateFilters = () => {
    setSelectedYear('all');
    setSelectedMonth('all');
  };

  // Calculate current active month's total expenses for budget tracker
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthExpenses = transactions
    .filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyBudgetLimit = user?.monthlyBudgetLimit || 0;
  const percentageUsed = monthlyBudgetLimit > 0 ? (currentMonthExpenses / monthlyBudgetLimit) * 100 : 0;

  let progressBarColor = '#22C55E'; // Green (< 70%)
  if (percentageUsed > 90) {
    progressBarColor = '#EF4444'; // Red (> 90% or exceeded)
  } else if (percentageUsed >= 70) {
    progressBarColor = '#F59E0B'; // Warning (70% - 90%)
  }

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <Loader2 size={40} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
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
          <LayoutDashboard size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--brand-primary)' }} />
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

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Month & Year Date Filter Bar */}
      <div className="glass-card personal-filter-bar" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
              <Filter size={18} style={{ color: 'var(--brand-primary)' }} />
              <span>Filter by Date:</span>
            </div>

            {/* Year Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label htmlFor="personal-year-filter" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Year:
              </label>
              <select
                id="personal-year-filter"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="form-input form-select"
                style={{
                  padding: '0.35rem 2rem 0.35rem 0.65rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  minWidth: '115px',
                  height: '34px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Filter by transaction year"
              >
                <option value="all">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr.toString()}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <label htmlFor="personal-month-filter" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Month:
              </label>
              <select
                id="personal-month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="form-input form-select"
                style={{
                  padding: '0.35rem 2rem 0.35rem 0.65rem',
                  fontSize: '0.85rem',
                  borderRadius: '6px',
                  minWidth: '130px',
                  height: '34px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Filter by transaction month"
              >
                {MONTH_NAMES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preset Buttons */}
            <div className="filter-preset-buttons">
              <button
                type="button"
                id="filter-preset-all-btn"
                className={`filter-preset-btn ${!isDateFiltered ? 'filter-preset-btn--active' : ''}`}
                onClick={handleResetDateFilters}
                title="Show all transactions across all dates"
              >
                All Time
              </button>
              <button
                type="button"
                id="filter-preset-this-month-btn"
                className={`filter-preset-btn ${selectedYear === currentYear.toString() && selectedMonth === (currentMonth + 1).toString() ? 'filter-preset-btn--active' : ''}`}
                onClick={() => {
                  setSelectedYear(currentYear.toString());
                  setSelectedMonth((currentMonth + 1).toString());
                }}
                title="Filter to current month"
              >
                This Month
              </button>
              <button
                type="button"
                id="filter-preset-this-year-btn"
                className={`filter-preset-btn ${selectedYear === currentYear.toString() && selectedMonth === 'all' ? 'filter-preset-btn--active' : ''}`}
                onClick={() => {
                  setSelectedYear(currentYear.toString());
                  setSelectedMonth('all');
                }}
                title="Filter to current year"
              >
                This Year
              </button>
            </div>
          </div>

          {/* Add Transaction Button */}
          <div>
            <button
              className="btn-primary"
              id="personal-add-transaction-btn"
              onClick={() => setShowTransactionModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1.25rem', fontSize: '0.9rem' }}
            >
              <PlusCircle size={18} />
              Add Transaction
            </button>
          </div>
        </div>

        {/* Active filter summary pill */}
        {isDateFiltered && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Calendar size={15} style={{ color: 'var(--brand-primary)' }} />
              <span>
                Filtered by: <strong style={{ color: 'var(--text-primary)' }}>{getFilterLabel()}</strong>
              </span>
              <span className="filter-count-badge" id="personal-filter-count-badge">
                {filteredByDateTransactions.length} transaction{filteredByDateTransactions.length !== 1 ? 's' : ''} found
              </span>
            </div>
            <button
              type="button"
              id="personal-clear-filter-btn"
              onClick={handleResetDateFilters}
              style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, padding: 0 }}
            >
              <RotateCcw size={13} />
              Reset date filter
            </button>
          </div>
        )}
      </div>

      {/* Summary Balance Cards (reflects active date filter) */}
      <BalanceCard 
        transactions={filteredByDateTransactions} 
        filterType={filterType} 
        onFilterChange={setFilterType} 
      />

      {/* Personal Monthly Budget Tracker Progress Card */}
      <div className="glass-card budget-progress-card" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="budget-progress-header">
          <div className="budget-progress-title">
            <Target size={20} style={{ color: 'var(--brand-primary)' }} />
            <span>Personal Monthly Budget Tracker</span>
          </div>
          <div className="budget-progress-values">
            {currentMonthExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            <span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.9rem' }}>
              {' '}
              / {monthlyBudgetLimit > 0 ? monthlyBudgetLimit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '₹0.00 (Unset)'} spent
            </span>
          </div>
        </div>

        {monthlyBudgetLimit > 0 ? (
          <>
            <div className="budget-progress-bar-track">
              <div
                className="budget-progress-bar-fill"
                style={{
                  width: `${Math.min(100, percentageUsed)}%`,
                  backgroundColor: progressBarColor,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
              <span className="budget-progress-percentage">
                {percentageUsed.toFixed(0)}% of monthly budget target used
              </span>
              {percentageUsed > 100 && (
                <span style={{ color: '#EF4444', fontSize: '0.8rem', fontWeight: 600 }}>
                  Over budget by {(currentMonthExpenses - monthlyBudgetLimit).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              No monthly budget target set. Configure a budget limit in Profile Settings to track your monthly spending.
            </p>
            <button
              className="btn-secondary"
              onClick={() => navigate('/profile')}
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              <Settings size={14} />
              <span>Configure Budget Target</span>
            </button>
          </div>
        )}
      </div>

      {/* Full-width Transaction Table */}
      <div style={{ width: '100%' }}>
        <TransactionTable
          transactions={filteredByDateTransactions}
          onTransactionDeleted={handleTransactionDeleted}
          onTransactionClick={setActiveTransaction}
          filterType={filterType}
          isDateFiltered={isDateFiltered}
          onResetFilters={handleResetDateFilters}
        />
      </div>

      {/* Transaction Modal Overlay */}
      {showTransactionModal && (
        <div
          className="group-expense-modal-overlay"
          id="personal-transaction-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTransactionModal(false); }}
        >
          <div className="group-expense-modal" id="personal-transaction-modal">
            <button
              className="group-expense-modal__close"
              id="personal-transaction-modal-close"
              onClick={() => setShowTransactionModal(false)}
              title="Close"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <TransactionForm
              user={user}
              onTransactionAdded={(newTxn) => {
                handleTransactionAdded(newTxn);
                setShowTransactionModal(false);
              }}
              onClose={() => setShowTransactionModal(false)}
            />
          </div>
        </div>
      )}

      {activeTransaction && (
        <TransactionDetailModal
          transaction={activeTransaction}
          onClose={() => setActiveTransaction(null)}
          currentUserId={user?.id || user?._id}
          onDelete={handleDeleteTransaction}
        />
      )}
    </div>
  );
}
