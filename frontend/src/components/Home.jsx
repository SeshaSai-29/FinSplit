import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Landmark, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Clock, 
  Loader2, 
  ChevronRight 
} from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';

export default function Home({ user }) {
  const navigate = useNavigate();
  const currentUserId = user?.id || user?._id;
  const cacheKey = `home_dashboard_cache_${currentUserId || 'default'}`;

  // Try reading cached data for immediate display
  const getInitialCache = () => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse home cache:', e);
    }
    return null;
  };

  const initialCache = getInitialCache();

  const [transactions, setTransactions] = useState(initialCache?.transactions || []);
  const [groups, setGroups] = useState(initialCache?.groups || []);
  const [groupBalances, setGroupBalances] = useState(initialCache?.groupBalances || {});
  const [loading, setLoading] = useState(!initialCache);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Helper to compute net balance for a specific group
  const calculateGroupNetBalance = useCallback((groupTransactions, memberCount) => {
    let totalPaid = 0;
    let totalOwed = 0;

    groupTransactions.forEach((txn) => {
      if (txn.type !== 'expense') return;

      const payerId = txn.userId && typeof txn.userId === 'object' ? txn.userId._id : txn.userId;
      const isPayer = payerId === currentUserId;

      if (isPayer) {
        totalPaid += txn.amount;
      }

      let userShare = 0;
      if (!txn.splitType || txn.splitType === 'equal') {
        if (txn.splits && txn.splits.length > 0) {
          const userSplit = txn.splits.find((s) => {
            const splitUserId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
            return splitUserId === currentUserId;
          });
          userShare = userSplit ? userSplit.amount : 0;
        } else {
          userShare = txn.amount / (memberCount || 1);
        }
      } else if (txn.splitType === 'custom') {
        const userSplit = txn.splits?.find((s) => {
          const splitUserId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
          return splitUserId === currentUserId;
        });
        if (userSplit) {
          userShare = userSplit.amount;
        } else if (isPayer) {
          const splitTotal = txn.splits?.reduce((sum, s) => sum + s.amount, 0) || 0;
          userShare = Math.max(0, txn.amount - splitTotal);
        } else {
          userShare = 0;
        }
      }

      totalOwed += userShare;
    });

    return totalPaid - totalOwed;
  }, [currentUserId]);

  const fetchAndCalculateDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [txnRes, groupsRes] = await Promise.all([
        fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/groups', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let fetchedTxns = [];
      let fetchedGroups = [];
      let balanceMap = {};

      if (txnRes.ok) {
        fetchedTxns = await txnRes.json();
        setTransactions(fetchedTxns);
      }

      if (groupsRes.ok) {
        fetchedGroups = await groupsRes.json();
        setGroups(fetchedGroups);

        // Fetch group transactions to calculate owe/owed amounts
        const balancePromises = fetchedGroups.map(async (grp) => {
          try {
            const res = await fetch(`/api/transactions/group/${grp.code}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const grpTxns = await res.json();
              const net = calculateGroupNetBalance(grpTxns, grp.members?.length || 1);
              return { code: grp.code, net };
            }
          } catch (e) {
            console.error(`Error calculating balance for group ${grp.code}:`, e);
          }
          return { code: grp.code, net: 0 };
        });

        const balances = await Promise.all(balancePromises);
        balances.forEach((b) => {
          balanceMap[b.code] = b.net;
        });
        setGroupBalances(balanceMap);
      }

      // Save calculated results in cache and clear dirty flag
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          transactions: fetchedTxns,
          groups: fetchedGroups,
          groupBalances: balanceMap,
          timestamp: Date.now()
        }));
        localStorage.removeItem('home_cache_dirty');
      } catch (err) {
        console.error('Failed to store home cache:', err);
      }
    } catch (err) {
      console.error('Error fetching home dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, calculateGroupNetBalance]);

  useEffect(() => {
    const isDirty = localStorage.getItem('home_cache_dirty') === 'true';
    const hasCache = Boolean(initialCache);

    // Only recalculate if there is no cache yet or if data was modified
    if (!hasCache || isDirty) {
      fetchAndCalculateDashboard();
    } else {
      setLoading(false);
    }

    // Listen to changes triggered anywhere in the application
    const handleDataChanged = () => {
      fetchAndCalculateDashboard();
    };

    window.addEventListener('finsplit_data_changed', handleDataChanged);
    return () => {
      window.removeEventListener('finsplit_data_changed', handleDataChanged);
    };
  }, [fetchAndCalculateDashboard, initialCache]);

  const groupCount = groups.length || user?.groupIds?.length || 0;

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleGroupClick = (groupCode) => {
    localStorage.setItem('activeGroupId', groupCode);
    navigate(`/group-dashboard/${groupCode}`);
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Welcome back, {user?.name}!</h1>
        <p className="page-subtitle">Here is a quick overview of your personal finances and group balances.</p>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="home-top-metrics">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Personal Balance</span>
            <Landmark size={20} style={{ color: '#000000' }} />
          </div>
          <div className="stat-value" style={{ color: netBalance >= 0 ? '#22C55E' : '#EF4444' }}>
            {loading ? '...' : formatCurrency(netBalance)}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Net income vs expenses</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Active Groups</span>
            <Users size={20} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="stat-value">{groupCount}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Connected shared networks</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Income</span>
            <TrendingUp size={20} style={{ color: '#22C55E' }} />
          </div>
          <div className="stat-value" style={{ color: '#22C55E' }}>
            {loading ? '...' : formatCurrency(totalIncome)}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Logged earnings</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Total Expenses</span>
            <TrendingDown size={20} style={{ color: '#EF4444' }} />
          </div>
          <div className="stat-value" style={{ color: '#EF4444' }}>
            {loading ? '...' : formatCurrency(totalExpenses)}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Logged spending</p>
        </div>
      </div>

      {/* Main Content: Recent Activity & Group Balances */}
      <div className="home-sections-grid">
        {/* Section 1: Recent Activity */}
        <div className="home-section-card glass-card">
          <div className="home-section-header">
            <div className="home-section-title">
              <Clock size={20} style={{ color: 'var(--brand-primary)' }} />
              <span>Recent Activity</span>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              id="home-view-all-transactions-btn"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {loading && recentTransactions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.75rem', padding: '2rem 0' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Loading transactions...</span>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Receipt size={40} className="empty-icon" style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>No Recent Transactions</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                Start tracking by adding your first transaction in the dashboard.
              </span>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/dashboard')}
                style={{ marginTop: '1rem', padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '6px' }}
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="recent-activity-list">
              {recentTransactions.map((txn) => (
                <div
                  key={txn._id}
                  className="recent-activity-item"
                  onClick={() => setSelectedTransaction(txn)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view details"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0, paddingRight: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {txn.description}
                      </span>
                      <span className="category-badge" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                        {txn.category || 'General'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatDate(txn.createdAt || txn.date)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        fontFamily: 'var(--font-mono, monospace)',
                        color: txn.type === 'income' ? '#22C55E' : '#EF4444'
                      }}
                    >
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Group Balances */}
        <div className="home-section-card glass-card">
          <div className="home-section-header">
            <div className="home-section-title">
              <Users size={20} style={{ color: 'var(--brand-primary)' }} />
              <span>Group Balances</span>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/group-dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              id="home-go-group-dashboard-btn"
            >
              <span>Group Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {loading && groups.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '0.75rem', padding: '2rem 0' }}>
              <Loader2 className="animate-spin" size={28} style={{ color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculating group balances...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Users size={40} className="empty-icon" style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
              <p style={{ fontWeight: 600, margin: 0 }}>No Groups Joined</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'center' }}>
                Join or create a group to start splitting shared expenses.
              </span>
              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate('/groups')}
                style={{ marginTop: '1rem', padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '6px' }}
              >
                Manage Groups
              </button>
            </div>
          ) : (
            <div className="group-balance-list">
              {groups.map((group) => {
                const net = groupBalances[group.code] || 0;
                const isOwed = net > 0.01;
                const owes = net < -0.01;
                const memberCount = group.members?.length || 1;

                return (
                  <div
                    key={group.code}
                    className="group-balance-item"
                    onClick={() => handleGroupClick(group.code)}
                    style={{ cursor: 'pointer' }}
                    title={`Open ${group.name} dashboard`}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                          {group.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--brand-primary)',
                            border: '1px solid rgba(59, 130, 246, 0.25)'
                          }}
                        >
                          {group.code}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {memberCount} member{memberCount > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div>
                        {isOwed ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>You are owed</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#22C55E', fontFamily: 'var(--font-mono, monospace)' }}>
                              {formatCurrency(net)}
                            </span>
                          </div>
                        ) : owes ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>You owe</span>
                            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#EF4444', fontFamily: 'var(--font-mono, monospace)' }}>
                              {formatCurrency(Math.abs(net))}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Status</span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              Settled up
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          currentUserId={currentUserId}
          readOnly={true}
        />
      )}
    </div>
  );
}
