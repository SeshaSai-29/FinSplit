import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Users, ChevronDown, IndianRupee, PlusCircle, X, CheckCircle2, Pencil } from 'lucide-react';
import GroupTransactionTable from '../components/GroupTransactionTable';
import MembersDisplay from '../components/MembersDisplay';
import OwingLogicCard from '../components/OwingLogicCard';
import TransactionForm from '../components/TransactionForm';
import TransactionDetailModal from '../components/TransactionDetailModal';
import ManageGroupBudgetModal from '../components/ManageGroupBudgetModal';

export default function GroupDashboard({ user, onUserUpdate }) {
  const { groupId: routeGroupId } = useParams();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [activeTransaction, setActiveTransaction] = useState(null);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  // Fetch user's groups on mount
  useEffect(() => {
    fetchGroups();
  }, [user]);

  // Sync selectedGroupId with URL parameter / localStorage
  useEffect(() => {
    if (groupsLoading) return;

    const candidateId = routeGroupId || localStorage.getItem('activeGroupId') || '';

    if (candidateId) {
      const isValid = groups.some((g) => g.code === candidateId);
      if (isValid) {
        if (selectedGroupId !== candidateId) {
          setSelectedGroupId(candidateId);
        }
        localStorage.setItem('activeGroupId', candidateId);
        if (routeGroupId !== candidateId) {
          navigate(`/group-dashboard/${candidateId}`, { replace: true });
        }
      } else {
        localStorage.removeItem('activeGroupId');
        if (selectedGroupId) {
          setSelectedGroupId('');
        }
        if (routeGroupId) {
          navigate('/group-dashboard', { replace: true });
        }
      }
    } else {
      if (selectedGroupId) {
        setSelectedGroupId('');
      }
    }
  }, [groupsLoading, groups, routeGroupId]);

  // Fetch transactions and members when a group is selected
  useEffect(() => {
    if (!selectedGroupId) {
      setTransactions([]);
      setMembers([]);
      return;
    }

    const fetchGroupData = async () => {
      setError('');
      setLoading(true);
      setMembersLoading(true);

      const token = localStorage.getItem('token');

      // Fetch transactions and members in parallel
      try {
        const [txnsRes, membersRes] = await Promise.all([
          fetch(`/api/transactions/group/${selectedGroupId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/groups/${selectedGroupId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!txnsRes.ok) {
          const data = await txnsRes.json();
          throw new Error(data.message || 'Failed to fetch group transactions');
        }

        const txnsData = await txnsRes.json();
        setTransactions(txnsData);

        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData);
        } else {
          console.error('Failed to fetch group members');
        }
      } catch (err) {
        setError(err.message);
        setTransactions([]);
        setMembers([]);
      } finally {
        setLoading(false);
        setMembersLoading(false);
      }
    };

    fetchGroupData();
  }, [selectedGroupId]);

  const syncProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data));
        if (onUserUpdate) {
          onUserUpdate(data);
        }
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  const handleGroupDeleted = async () => {
    try { localStorage.setItem('home_cache_dirty', 'true'); window.dispatchEvent(new Event('finsplit_data_changed')); } catch (e) {}
    setSelectedGroupId('');
    localStorage.removeItem('activeGroupId');
    navigate('/group-dashboard');
    await fetchGroups();
    await syncProfile();
  };

  const handleGroupLeft = async () => {
    try { localStorage.setItem('home_cache_dirty', 'true'); window.dispatchEvent(new Event('finsplit_data_changed')); } catch (e) {}
    setSelectedGroupId('');
    localStorage.removeItem('activeGroupId');
    navigate('/group-dashboard');
    await fetchGroups();
    await syncProfile();
  };

  const handleGroupRenamed = async () => {
    try { localStorage.setItem('home_cache_dirty', 'true'); window.dispatchEvent(new Event('finsplit_data_changed')); } catch (e) {}
    await fetchGroups();
  };

  const handleBudgetUpdated = (updatedGroup, message) => {
    try { localStorage.setItem('home_cache_dirty', 'true'); window.dispatchEvent(new Event('finsplit_data_changed')); } catch (e) {}
    setGroups((prev) => prev.map((g) => (g.code === updatedGroup.code ? updatedGroup : g)));
    setSuccess(message || 'Group budget updated successfully!');
    setTimeout(() => setSuccess(''), 4000);
    fetchGroups();
  };

  const handleGroupChange = (e) => {
    const newCode = e.target.value;
    setSelectedGroupId(newCode);
    setError('');
    setShowExpenseModal(false);
    setShowBudgetModal(false);

    if (newCode) {
      localStorage.setItem('activeGroupId', newCode);
      navigate(`/group-dashboard/${newCode}`);
    } else {
      localStorage.removeItem('activeGroupId');
      navigate('/group-dashboard');
    }
  };

  const handleGroupTransactionAdded = (newTxn) => {
    try { localStorage.setItem('home_cache_dirty', 'true'); window.dispatchEvent(new Event('finsplit_data_changed')); } catch (e) {}
    const populatedTxn = {
      ...newTxn,
      userId: (newTxn.userId && typeof newTxn.userId === 'object' && newTxn.userId.name)
        ? newTxn.userId
        : { _id: user?.id || user?._id, name: user?.name || 'You', email: user?.email || '' }
    };
    setTransactions((prev) => [populatedTxn, ...prev]);
    setShowExpenseModal(false);
    fetchGroups();
  };

  const handleTransactionDeleted = async (id) => {
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

      try { localStorage.setItem('home_cache_dirty', 'true'); window.dispatchEvent(new Event('finsplit_data_changed')); } catch (e) {}
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      await syncProfile();
      await fetchGroups();
      setSuccess('Transaction deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err.message);
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowExpenseModal(false);
        setShowBudgetModal(false);
      }
    };
    if (showExpenseModal || showBudgetModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExpenseModal, showBudgetModal]);

  const userGroupIds = user?.groupIds || [];

  // Compute total expenses and income for the group
  const totalExpenses = transactions
    .filter((txn) => txn.type === 'expense')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const selectedGroup = groups.find((g) => g.code === selectedGroupId);
  const currentUserId = user?.id || user?._id;
  const isOwner = Boolean(selectedGroup && (selectedGroup.createdBy === currentUserId || selectedGroup.createdBy === user?.id));
  const groupOwner = members.find((m) => m._id === selectedGroup?.createdBy || m.id === selectedGroup?.createdBy);
  const budgetLimit = selectedGroup?.budget || 0;
  const availableMoney = budgetLimit > 0 ? Math.max(0, budgetLimit - totalExpenses) : 0;
  const isOverBudget = budgetLimit > 0 && totalExpenses > budgetLimit;
  const overAmount = isOverBudget ? totalExpenses - budgetLimit : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <Users size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.5rem', color: 'var(--brand-primary)' }} />
          Group Dashboard
        </h1>
        <p className="page-subtitle">
          View shared expenses across your groups — see who paid what, at a glance.
        </p>
      </div>

      {/* No Groups State */}
      {!groupsLoading && userGroupIds.length === 0 && (
        <div className="glass-card">
          <div className="empty-state">
            <Users size={56} className="empty-icon" />
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>No groups yet</p>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
              Head over to the Groups page to create or join a group, then come back to see shared expenses.
            </span>
          </div>
        </div>
      )}

      {/* Group Selector */}
      {userGroupIds.length > 0 && (
        <>
          <div className="group-selector-bar glass-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
              <div className="group-selector-inner" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="group-dashboard-select" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                  Select Group
                </label>
                <div className="group-select-wrapper">
                  <select
                    id="group-dashboard-select"
                    className="form-input form-select group-dashboard-select"
                    value={selectedGroupId}
                    onChange={handleGroupChange}
                    disabled={groupsLoading}
                  >
                    <option value="">— Choose a group —</option>
                    {groups.map((group) => (
                      <option key={group.code} value={group.code}>
                        {group.name} ({group.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedGroup && (
                <div className="group-owner-info" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '0.35rem', alignItems: 'center', paddingLeft: '0.25rem', marginTop: '0.25rem' }}>
                  <span>Group Owner:</span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                    {groupOwner ? `${groupOwner.name} (${groupOwner.email})` : 'Loading owner details...'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick stats when a group is selected */}
            {selectedGroupId && !loading && (
              <div className="group-stats-row">
                <div className="group-stat">
                  <span className="group-stat__label">Total Budget</span>
                  <span className="group-stat__value" style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
                    {budgetLimit > 0
                      ? budgetLimit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
                      : '₹0.00'}
                  </span>
                </div>
                <div className="group-stat">
                  <span className="group-stat__label">Available to Use</span>
                  <span className="group-stat__value" style={{ color: budgetLimit <= 0 ? 'var(--text-primary)' : isOverBudget ? '#EF4444' : '#22C55E', fontWeight: 700 }}>
                    {budgetLimit <= 0
                      ? '₹0.00'
                      : isOverBudget
                        ? `-₹${overAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                        : availableMoney.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                </div>
                <div className="group-stat">
                  <span className="group-stat__label">Total Expenses</span>
                  <span className="group-stat__value amount-expense">
                    {totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                  </span>
                </div>
                <div className="group-stat">
                  <span className="group-stat__label">Transactions</span>
                  <span className="group-stat__value">{transactions.length}</span>
                </div>
                <div className="group-stat">
                  <span className="group-stat__label">Members</span>
                  <span className="group-stat__value">{members.length || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="alert alert-danger" style={{ marginTop: '1.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Success State */}
          {success && (
            <div className="alert alert-success" style={{ marginTop: '1.5rem' }}>
              <CheckCircle2 size={18} />
              <span>{success}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
              <Loader2 size={40} style={{ color: 'var(--brand-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: 'var(--text-secondary)' }}>Loading group details...</p>
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          )}

          {/* Prompt to select */}
          {!selectedGroupId && !loading && (
            <div className="glass-card" style={{ marginTop: '2rem' }}>
              <div className="empty-state">
                <ChevronDown size={48} className="empty-icon" style={{ animation: 'bounceDown 1.5s ease-in-out infinite' }} />
                <p style={{ fontWeight: 600 }}>Select a group above</p>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Choose a group from the dropdown to view its shared expenses.
                </span>
                <style>{`
                  @keyframes bounceDown {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(8px); }
                  }
                `}</style>
              </div>
            </div>
          )}

          {/* Group Content Dashboard Layout */}
          {selectedGroupId && !loading && (
            <>
              {/* Two-Column Grid: Left: OwingLogicCard, Right: MembersDisplay */}
              <div className="group-dashboard-grid">
                <OwingLogicCard
                  transactions={transactions}
                  members={members}
                  currentUserId={user?.id || user?._id}
                  selectedGroup={selectedGroup}
                  onSettlementCreated={handleGroupTransactionAdded}
                />
                <MembersDisplay
                  members={members}
                  loading={membersLoading}
                  group={selectedGroup}
                  currentUser={user}
                  onGroupDeleted={handleGroupDeleted}
                  onGroupLeft={handleGroupLeft}
                  onGroupRenamed={handleGroupRenamed}
                  onManageBudget={() => setShowBudgetModal(true)}
                />
              </div>

              {/* Add Transaction Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  className="btn-primary"
                  id="group-add-transaction-btn"
                  onClick={() => setShowExpenseModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.4rem' }}
                >
                  <PlusCircle size={18} />
                  Add Transaction
                </button>
              </div>

              {/* Transaction Table */}
              <div style={{ marginTop: '1.5rem' }}>
                <GroupTransactionTable transactions={transactions} onTransactionClick={setActiveTransaction} />
              </div>

              {/* Modal Overlay */}
              {showExpenseModal && (
                <div
                  className="group-expense-modal-overlay"
                  id="group-expense-modal-overlay"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowExpenseModal(false); }}
                >
                  <div className="group-expense-modal" id="group-expense-modal">
                    <button
                      className="group-expense-modal__close"
                      id="group-expense-modal-close"
                      onClick={() => setShowExpenseModal(false)}
                      title="Close"
                      aria-label="Close modal"
                    >
                      <X size={20} />
                    </button>
                    <TransactionForm
                      user={user}
                      lockedGroupId={selectedGroupId}
                      lockedGroupName={selectedGroup?.name}
                      onTransactionAdded={handleGroupTransactionAdded}
                      onClose={() => setShowExpenseModal(false)}
                    />
                  </div>
                </div>
              )}

              {activeTransaction && (
                <TransactionDetailModal
                  transaction={activeTransaction}
                  onClose={() => setActiveTransaction(null)}
                  currentUserId={user?.id || user?._id}
                  members={members}
                  onDelete={handleTransactionDeleted}
                  onSettled={handleGroupTransactionAdded}
                />
              )}

              {showBudgetModal && selectedGroup && (
                <ManageGroupBudgetModal
                  isOpen={showBudgetModal}
                  group={selectedGroup}
                  onClose={() => setShowBudgetModal(false)}
                  onBudgetUpdated={handleBudgetUpdated}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
