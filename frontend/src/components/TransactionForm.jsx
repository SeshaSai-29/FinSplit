import React, { useState, useEffect } from 'react';
import { PlusCircle, Loader2, AlertCircle, CheckCircle2, Users } from 'lucide-react';

const CATEGORIES = [
  'Food',
  'Rent',
  'Salary',
  'Entertainment',
  'Utilities',
  'Transport',
  'Healthcare',
  'Shopping',
  'Other',
];

const INITIAL_FORM = {
  description: '',
  amount: '',
  type: 'expense',
  category: 'Food',
  selectedGroupIds: [],
  splitType: 'equal',
  splits: [], // [{ userId, amount }]
};

export default function TransactionForm({ onTransactionAdded, user, lockedGroupId, lockedGroupName, onClose }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [fetchingMembers, setFetchingMembers] = useState(false);

  // When a lockedGroupId is provided (e.g. from GroupDashboard modal), pre-seed it
  useEffect(() => {
    if (lockedGroupId) {
      setForm((prev) => ({
        ...prev,
        selectedGroupIds: [lockedGroupId],
        splitType: 'equal',
      }));
    }
  }, [lockedGroupId]);

  // Fetch the user's groups (with names)
  useEffect(() => {
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
        console.error('Error fetching groups for form:', err);
      }
    };

    fetchGroups();
  }, [user]);

  // Fetch members of selected groups when selectedGroupIds changes
  useEffect(() => {
    if (form.selectedGroupIds.length === 0) {
      setGroupMembers([]);
      return;
    }

    const fetchMembers = async () => {
      setFetchingMembers(true);
      try {
        const token = localStorage.getItem('token');
        const memberPromises = form.selectedGroupIds.map(async (gid) => {
          const res = await fetch(`/api/groups/${gid}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            return res.json();
          }
          return [];
        });

        const results = await Promise.all(memberPromises);
        const allMembers = results.flat();
        const uniqueMembersMap = {};
        allMembers.forEach((m) => {
          // Exclude the current logged-in user
          if (m._id !== user?.id && m._id !== user?._id) {
            uniqueMembersMap[m._id] = m;
          }
        });
        setGroupMembers(Object.values(uniqueMembersMap));
      } catch (err) {
        console.error('Error fetching group members for split:', err);
      } finally {
        setFetchingMembers(false);
      }
    };

    fetchMembers();
  }, [form.selectedGroupIds, user]);

  // Keep splits clean by removing any members that are no longer in groupMembers list
  useEffect(() => {
    const memberIds = groupMembers.map((m) => m._id);
    const cleanedSplits = form.splits.filter((s) => memberIds.includes(s.userId));
    if (cleanedSplits.length !== form.splits.length) {
      setForm((prev) => ({ ...prev, splits: cleanedSplits }));
    }
  }, [groupMembers]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleGroupToggle = (groupCode) => {
    const isChecked = form.selectedGroupIds.includes(groupCode);
    let newGroupIds;
    if (isChecked) {
      newGroupIds = form.selectedGroupIds.filter((id) => id !== groupCode);
    } else {
      newGroupIds = [...form.selectedGroupIds, groupCode];
    }
    setForm({
      ...form,
      selectedGroupIds: newGroupIds,
      splitType: newGroupIds.length === 0 ? 'equal' : form.splitType,
      splits: newGroupIds.length === 0 ? [] : form.splits,
    });
    setError('');
  };

  const handleSplitModeChange = (mode) => {
    setForm({
      ...form,
      splitType: mode,
      splits: mode === 'equal' ? [] : form.splits,
    });
    setError('');
  };

  const handleSplitCheckboxChange = (memberId) => {
    const isChecked = form.splits.some((s) => s.userId === memberId);
    let newSplits;
    if (isChecked) {
      newSplits = form.splits.filter((s) => s.userId !== memberId);
    } else {
      newSplits = [...form.splits, { userId: memberId, amount: '' }];
    }
    setForm({ ...form, splits: newSplits });
    setError('');
  };

  const handleSplitAmountChange = (memberId, val) => {
    const newSplits = form.splits.map((s) => {
      if (s.userId === memberId) {
        return { ...s, amount: val };
      }
      return s;
    });
    setForm({ ...form, splits: newSplits });
    setError('');
  };

  const totalSplitAmount = form.splits.reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const remainingAmount = Math.max(0, Number(form.amount || 0) - totalSplitAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!form.description.trim()) {
      setError('Please enter a description');
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const isShared = form.selectedGroupIds.length > 0;
    const isCustom = form.splitType === 'custom' && isShared;
    const formattedSplits = isCustom
      ? form.splits
        .map((s) => ({ userId: s.userId, amount: Number(s.amount) }))
        .filter((s) => s.amount > 0)
      : [];

    if (isCustom) {
      const splitTotal = formattedSplits.reduce((sum, s) => sum + s.amount, 0);
      if (splitTotal > Number(form.amount)) {
        setError('Total split amount cannot exceed the transaction amount');
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: form.description.trim(),
          amount: Number(form.amount),
          type: form.type,
          category: form.category,
          isShared,
          groupIds: form.selectedGroupIds,
          splitType: isShared ? form.splitType : 'equal',
          splits: formattedSplits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add transaction');
      }

      setSuccess('Transaction added successfully!');
      setForm({
        ...INITIAL_FORM,
        // Keep the lock if we are inside a group modal
        selectedGroupIds: lockedGroupId ? [lockedGroupId] : [],
      });

      if (onTransactionAdded) {
        onTransactionAdded(data);
      }

      // Auto-clear success message and close modal if in locked mode
      setTimeout(() => {
        setSuccess('');
        if (lockedGroupId && onClose) {
          onClose();
        }
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const userGroupIds = user?.groupIds || [];

  return (
    <div className="glass-card transaction-form">
      <h2 className="transaction-form__title">
        <PlusCircle size={22} style={{ color: '#8b5cf6' }} />
        <span>{lockedGroupId ? 'Log Group Expense' : 'Add Transaction'}</span>
      </h2>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} id="transaction-form">
        <div className="form-group">
          <label className="form-label" htmlFor="txn-description">Description</label>
          <input
            id="txn-description"
            className="form-input form-input--no-icon"
            type="text"
            name="description"
            placeholder="e.g. Grocery shopping"
            value={form.description}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="txn-amount">Amount ($)</label>
          <input
            id="txn-amount"
            className="form-input form-input--no-icon"
            type="number"
            name="amount"
            placeholder="0.00"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div className="form-row">
          <div className="form-group form-group--half">
            <label className="form-label" htmlFor="txn-type">Type</label>
            <select
              id="txn-type"
              className="form-input form-select"
              name="type"
              value={form.type}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group form-group--half">
            <label className="form-label" htmlFor="txn-category">Category</label>
            <select
              id="txn-category"
              className="form-input form-select"
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={loading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Share with Multiple Groups Section */}
        {/* When a group is locked (e.g. inside GroupDashboard modal), show a badge instead of the checkbox list */}
        {lockedGroupId ? (
          <div className="form-group">
            <label className="form-label">
              <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem', color: '#06b6d4' }} />
              Shared With
            </label>
            <div className="locked-group-badge">
              <Users size={14} style={{ color: '#06b6d4' }} />
              <span>{lockedGroupName || lockedGroupId}</span>
              <span className="locked-group-badge__pill">Auto-attached</span>
            </div>

            {/* Split type still available in locked mode for expenses */}
            {form.type === 'expense' && (
              <>
                <label className="form-label" style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Split Type</label>
                <div className="split-mode-toggle">
                  <button
                    type="button"
                    className={`split-mode-btn ${form.splitType === 'equal' ? 'split-mode-btn--active' : ''}`}
                    onClick={() => handleSplitModeChange('equal')}
                    disabled={loading}
                  >
                    Equal Split
                  </button>
                  <button
                    type="button"
                    className={`split-mode-btn ${form.splitType === 'custom' ? 'split-mode-btn--active' : ''}`}
                    onClick={() => handleSplitModeChange('custom')}
                    disabled={loading}
                  >
                    Custom Split
                  </button>
                </div>

                {/* Custom Split Member Picker */}
                {form.splitType === 'custom' && (
                  <div className="custom-split-container">
                    <label className="form-label" style={{ marginBottom: '0.5rem' }}>Assign Amounts to Members</label>
                    {fetchingMembers ? (
                      <div className="members-loading" style={{ padding: '1rem 0' }}>
                        <Loader2 className="animate-spin" size={18} style={{ color: '#06b6d4' }} />
                        <span>Loading group members...</span>
                      </div>
                    ) : groupMembers.length === 0 ? (
                      <p className="share-group-hint" style={{ color: 'var(--text-muted)' }}>
                        No other members in this group to split with.
                      </p>
                    ) : (
                      <>
                        <div className="split-remaining-bar">
                          <span className="split-remaining-label">Remaining to assign:</span>
                          <span
                            className="split-remaining-value"
                            style={{ color: remainingAmount > 0 ? '#22d3ee' : '#10b981' }}
                          >
                            ${remainingAmount.toFixed(2)} / ${Number(form.amount || 0).toFixed(2)}
                          </span>
                        </div>

                        <div className="split-members-list">
                          {groupMembers.map((member) => {
                            const splitEntry = form.splits.find((s) => s.userId === member._id);
                            const isMemberChecked = !!splitEntry;
                            return (
                              <div
                                key={member._id}
                                className={`split-member-row ${isMemberChecked ? 'split-member-row--active' : ''}`}
                                id={`split-row-${member._id}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isMemberChecked}
                                  onChange={() => handleSplitCheckboxChange(member._id)}
                                  disabled={loading}
                                  style={{ accentColor: '#8b5cf6', width: '16px', height: '16px' }}
                                />
                                <div className="split-member-info">
                                  <span className="split-member-name">{member.name}</span>
                                  <span className="split-member-email">{member.email}</span>
                                </div>
                                <div className="split-amount-input-wrapper">
                                  <span className="split-amount-input-symbol">$</span>
                                  <input
                                    type="number"
                                    className="split-amount-input"
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    max={form.amount}
                                    value={splitEntry ? splitEntry.amount : ''}
                                    onChange={(e) => handleSplitAmountChange(member._id, e.target.value)}
                                    disabled={loading || !isMemberChecked}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) :
          /* Normal mode: full group checkbox list */
          userGroupIds.length > 0 && (
            <div className="form-group share-group-field">
              <label className="form-label">
                <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem', color: '#06b6d4' }} />
                Share with Groups
              </label>
              <div className="group-checkbox-list">
                {groups.map((group) => {
                  const isChecked = form.selectedGroupIds.includes(group.code);
                  return (
                    <label
                      key={group.code}
                      className={`group-checkbox-item ${isChecked ? 'group-checkbox-item--checked' : ''}`}
                      id={`checkbox-item-${group.code}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleGroupToggle(group.code)}
                        disabled={loading}
                      />
                      <span>{group.name} ({group.code})</span>
                    </label>
                  );
                })}
              </div>

              {/* Split Mode Selector (Only shown if at least 1 group is selected and type is expense) */}
              {form.selectedGroupIds.length > 0 && form.type === 'expense' && (
                <>
                  <label className="form-label" style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Split Type</label>
                  <div className="split-mode-toggle">
                    <button
                      type="button"
                      className={`split-mode-btn ${form.splitType === 'equal' ? 'split-mode-btn--active' : ''}`}
                      onClick={() => handleSplitModeChange('equal')}
                      disabled={loading}
                    >
                      Equal Split
                    </button>
                    <button
                      type="button"
                      className={`split-mode-btn ${form.splitType === 'custom' ? 'split-mode-btn--active' : ''}`}
                      onClick={() => handleSplitModeChange('custom')}
                      disabled={loading}
                    >
                      Custom Split
                    </button>
                  </div>

                  {/* Custom Split Member Picker */}
                  {form.splitType === 'custom' && (
                    <div className="custom-split-container">
                      <label className="form-label" style={{ marginBottom: '0.5rem' }}>Assign Amounts to Members</label>
                      {fetchingMembers ? (
                        <div className="members-loading" style={{ padding: '1rem 0' }}>
                          <Loader2 className="animate-spin" size={18} style={{ color: '#06b6d4' }} />
                          <span>Loading group members...</span>
                        </div>
                      ) : groupMembers.length === 0 ? (
                        <p className="share-group-hint" style={{ color: 'var(--text-muted)' }}>
                          No other members in selected groups to split with.
                        </p>
                      ) : (
                        <>
                          <div className="split-remaining-bar">
                            <span className="split-remaining-label">Remaining to assign:</span>
                            <span
                              className="split-remaining-value"
                              style={{ color: remainingAmount > 0 ? '#22d3ee' : '#10b981' }}
                            >
                              ${remainingAmount.toFixed(2)} / ${Number(form.amount || 0).toFixed(2)}
                            </span>
                          </div>

                          <div className="split-members-list">
                            {groupMembers.map((member) => {
                              const splitEntry = form.splits.find((s) => s.userId === member._id);
                              const isMemberChecked = !!splitEntry;
                              return (
                                <div
                                  key={member._id}
                                  className={`split-member-row ${isMemberChecked ? 'split-member-row--active' : ''}`}
                                  id={`split-row-${member._id}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isMemberChecked}
                                    onChange={() => handleSplitCheckboxChange(member._id)}
                                    disabled={loading}
                                    style={{ accentColor: '#8b5cf6', width: '16px', height: '16px' }}
                                  />
                                  <div className="split-member-info">
                                    <span className="split-member-name">{member.name}</span>
                                    <span className="split-member-email">{member.email}</span>
                                  </div>
                                  <div className="split-amount-input-wrapper">
                                    <span className="split-amount-input-symbol">$</span>
                                    <input
                                      type="number"
                                      className="split-amount-input"
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                      max={form.amount}
                                      value={splitEntry ? splitEntry.amount : ''}
                                      onChange={(e) => handleSplitAmountChange(member._id, e.target.value)}
                                      disabled={loading || !isMemberChecked}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {form.selectedGroupIds.length > 0 && (
                <p className="share-group-hint">
                  This transaction will be visible in the selected groups.
                </p>
              )}
            </div>
          )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Adding...</span>
            </>
          ) : (
            <>
              <PlusCircle size={18} />
              <span>Add Transaction</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
