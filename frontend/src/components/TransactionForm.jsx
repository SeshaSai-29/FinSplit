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
  'Electricity',
  'Water bill',
  'Tax',
  'Insurance',
  'Groceries',
  'Personal care',
  'Pet',
  'Gift',
  'Settlement',
  'Others',
  'Custom',
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
  const [customCategory, setCustomCategory] = useState('');

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

  const currentUserId = user?.id || user?._id;
  const allMembers = currentUserId 
    ? [
        {
          _id: currentUserId,
          name: user?.name ? `${user.name} (You)` : 'You',
          email: user?.email || '',
        },
        ...groupMembers,
      ]
    : groupMembers;

  // Sync and clean splits when groupMembers, splitType, or selectedGroupIds change
  useEffect(() => {
    if (form.selectedGroupIds.length === 0) {
      setForm((prev) => ({ ...prev, splits: [] }));
      return;
    }

    const allowedIds = form.splitType === 'equal' 
      ? allMembers.map((m) => m._id)
      : groupMembers.map((m) => m._id);

    const cleanedSplits = form.splits.filter((s) => allowedIds.includes(s.userId));

    // If splitType is equal and the splits are empty (e.g. newly switched or loaded),
    // initialize them to include all members, each with 1 share.
    if (form.splitType === 'equal' && cleanedSplits.length === 0 && allowedIds.length > 0) {
      const defaultSplits = allowedIds.map((id) => ({
        userId: id,
        shares: 1
      }));
      setForm((prev) => ({ ...prev, splits: defaultSplits }));
    } else if (cleanedSplits.length !== form.splits.length) {
      setForm((prev) => ({ ...prev, splits: cleanedSplits }));
    }
  }, [groupMembers, form.splitType, form.selectedGroupIds, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'category' && value !== 'Custom') {
      setCustomCategory('');
    }
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
      splits: [], // Reset splits so they reinitialize for the new group members
    });
    setError('');
  };

  const handleSplitModeChange = (mode) => {
    const newSplits = mode === 'equal'
      ? allMembers.map((m) => ({ userId: m._id, shares: 1 }))
      : [];
    setForm({
      ...form,
      splitType: mode,
      splits: newSplits,
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

  const handleEqualSplitCheckboxToggle = (memberId) => {
    const isChecked = form.splits.some((s) => s.userId === memberId);
    let newSplits;
    if (isChecked) {
      newSplits = form.splits.filter((s) => s.userId !== memberId);
    } else {
      newSplits = [...form.splits, { userId: memberId, shares: 1 }];
    }
    setForm({ ...form, splits: newSplits });
    setError('');
  };

  const handleEqualSplitSharesChange = (memberId, val) => {
    const sharesVal = val === '' ? '' : Math.max(1, parseInt(val) || 1);
    const newSplits = form.splits.map((s) => {
      if (s.userId === memberId) {
        return { ...s, shares: sharesVal };
      }
      return s;
    });
    setForm({ ...form, splits: newSplits });
    setError('');
  };

  const totalShares = form.splitType === 'equal'
    ? form.splits.reduce((sum, s) => sum + Number(s.shares || 0), 0)
    : 0;

  const calculatedEqualSplits = form.splits.map((s) => {
    const memberShares = Number(s.shares || 0);
    const totalAmount = Number(form.amount || 0);
    const amount = totalShares > 0 ? (totalAmount * memberShares) / totalShares : 0;
    return {
      ...s,
      amount: parseFloat(amount.toFixed(2))
    };
  });

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

    // Custom category validation
    const categoryToSave = form.category === 'Custom' ? customCategory.trim() : form.category;
    if (form.category === 'Custom' && !customCategory.trim()) {
      setError('Please enter a custom category name');
      return;
    }

    const isShared = form.selectedGroupIds.length > 0;
    const isCustom = form.splitType === 'custom' && isShared;
    const isEqualSplit = form.splitType === 'equal' && isShared;

    let formattedSplits = [];
    if (isShared) {
      if (isCustom) {
        formattedSplits = form.splits
          .map((s) => ({ userId: s.userId, amount: Number(s.amount) }))
          .filter((s) => s.amount > 0);
      } else if (isEqualSplit) {
        formattedSplits = calculatedEqualSplits
          .map((s) => ({
            userId: s.userId,
            shares: Number(s.shares || 1),
            amount: Number(s.amount),
          }))
          .filter((s) => s.shares > 0 && s.amount > 0);
      }
    }

    if (isCustom) {
      const splitTotal = formattedSplits.reduce((sum, s) => sum + s.amount, 0);
      if (splitTotal > Number(form.amount)) {
        setError('Total split amount cannot exceed the transaction amount');
        return;
      }
    }

    if (isEqualSplit) {
      const hasInvalidShares = form.splits.some(s => s.shares === '' || Number(s.shares) <= 0);
      if (hasInvalidShares) {
        setError('Please configure positive shares for all selected members');
        return;
      }
      if (formattedSplits.length === 0) {
        setError('At least one member must be selected with positive shares');
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
          category: categoryToSave,
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
      setCustomCategory('');
      setForm({
        ...INITIAL_FORM,
        // Keep the lock if we are inside a group modal
        selectedGroupIds: lockedGroupId ? [lockedGroupId] : [],
      });

      if (onTransactionAdded) {
        onTransactionAdded(data);
      }
      try {
        localStorage.setItem('home_cache_dirty', 'true');
        window.dispatchEvent(new Event('finsplit_data_changed'));
      } catch (e) {}

      // Auto-clear success message and close modal if onClose handler provided
      setTimeout(() => {
        setSuccess('');
        if (onClose) {
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
        <PlusCircle size={22} style={{ color: 'var(--brand-primary)' }} />
        <span>{lockedGroupId ? 'Add Group Transaction' : 'Add Transaction'}</span>
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

      <form onSubmit={handleSubmit} id="transaction-form" autoComplete="off">
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
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-lpignore="true"
            data-form-type="other"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="txn-amount">Amount (₹)</label>
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
            autoComplete="off"
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

        {form.category === 'Custom' && (
          <div className="form-group" style={{ marginTop: '0.25rem' }}>
            <label className="form-label" htmlFor="txn-custom-category">Custom Category Name</label>
            <input
              id="txn-custom-category"
              className="form-input form-input--no-icon"
              type="text"
              name="customCategory"
              placeholder="e.g. Subscriptions"
              value={customCategory}
              onChange={(e) => {
                setCustomCategory(e.target.value);
                setError('');
              }}
              disabled={loading}
              autoComplete="off"
            />
          </div>
        )}

        {/* Share with Multiple Groups Section */}
        {/* When a group is locked (e.g. inside GroupDashboard modal), show a badge instead of the checkbox list */}
        {lockedGroupId ? (
          <div className="form-group">
            <label className="form-label">
              <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem', color: 'var(--brand-primary)' }} />
              Shared With
            </label>
            <div className="locked-group-badge">
              <Users size={14} style={{ color: 'var(--brand-primary)' }} />
              <span>{lockedGroupName || lockedGroupId}</span>
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

                {/* Equal Split Member Picker */}
                {form.splitType === 'equal' && (
                  <div className="equal-split-container">
                    <label className="form-label" style={{ marginBottom: '0.5rem' }}>Configure Shares for Members</label>
                    {fetchingMembers ? (
                      <div className="members-loading" style={{ padding: '1rem 0' }}>
                        <Loader2 className="animate-spin" size={18} style={{ color: 'var(--brand-primary)' }} />
                        <span>Loading group members...</span>
                      </div>
                    ) : allMembers.length === 0 ? (
                      <p className="share-group-hint" style={{ color: 'var(--text-muted)' }}>
                        No members in this group to split with.
                      </p>
                    ) : (
                      <>
                        <div className="split-remaining-bar">
                          <span className="split-remaining-label">Total Shares:</span>
                          <span className="split-remaining-value" style={{ color: 'var(--brand-primary)' }}>
                            {totalShares} {totalShares === 1 ? 'share' : 'shares'}
                          </span>
                        </div>

                        <div className="split-members-list">
                          {allMembers.map((member) => {
                            const splitEntry = form.splits.find((s) => s.userId === member._id);
                            const isMemberChecked = !!splitEntry;
                            const displayAmount = splitEntry ? calculatedEqualSplits.find((s) => s.userId === member._id)?.amount : 0;
                            return (
                              <div
                                key={member._id}
                                className={`split-member-row ${isMemberChecked ? 'split-member-row--active' : ''}`}
                                id={`equal-split-row-${member._id}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isMemberChecked}
                                  onChange={() => handleEqualSplitCheckboxToggle(member._id)}
                                  disabled={loading}
                                  style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                                />
                                <div className="split-member-info">
                                  <span className="split-member-name">{member.name}</span>
                                  <span className="split-member-email">{member.email}</span>
                                </div>
                                <div className="split-shares-input-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <div className="split-amount-input-wrapper" style={{ width: '65px' }}>
                                    <input
                                      type="number"
                                      className="split-amount-input"
                                      placeholder="1"
                                      min="1"
                                      step="1"
                                      value={splitEntry ? splitEntry.shares : ''}
                                      onChange={(e) => handleEqualSplitSharesChange(member._id, e.target.value)}
                                      disabled={loading || !isMemberChecked}
                                      style={{ textAlign: 'center' }}
                                      autoComplete="off"
                                    />
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '45px' }}>share(s)</span>
                                  <div style={{ minWidth: '70px', textAlign: 'right', fontWeight: 600, color: isMemberChecked ? '#22C55E' : 'var(--text-muted)' }}>
                                    {displayAmount !== undefined ? `₹${displayAmount.toFixed(2)}` : '₹0.00'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Custom Split Member Picker */}
                {form.splitType === 'custom' && (
                  <div className="custom-split-container">
                    <label className="form-label" style={{ marginBottom: '0.5rem' }}>Assign Amounts to Members</label>
                    {fetchingMembers ? (
                      <div className="members-loading" style={{ padding: '1rem 0' }}>
                        <Loader2 className="animate-spin" size={18} style={{ color: 'var(--brand-primary)' }} />
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
                            style={{ color: remainingAmount > 0 ? 'var(--brand-primary)' : '#22C55E' }}
                          >
                            ₹{remainingAmount.toFixed(2)} / ₹{Number(form.amount || 0).toFixed(2)}
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
                                  style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                                />
                                <div className="split-member-info">
                                  <span className="split-member-name">{member.name}</span>
                                  <span className="split-member-email">{member.email}</span>
                                </div>
                                <div className="split-amount-input-wrapper">
                                  <span className="split-amount-input-symbol">₹</span>
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
                                    autoComplete="off"
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
                <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem', color: 'var(--brand-primary)' }} />
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

                  {/* Equal Split Member Picker */}
                  {form.splitType === 'equal' && (
                    <div className="equal-split-container">
                      <label className="form-label" style={{ marginBottom: '0.5rem' }}>Configure Shares for Members</label>
                      {fetchingMembers ? (
                        <div className="members-loading" style={{ padding: '1rem 0' }}>
                          <Loader2 className="animate-spin" size={18} style={{ color: 'var(--brand-primary)' }} />
                          <span>Loading group members...</span>
                        </div>
                      ) : allMembers.length === 0 ? (
                        <p className="share-group-hint" style={{ color: 'var(--text-muted)' }}>
                          No members in selected groups to split with.
                        </p>
                      ) : (
                        <>
                          <div className="split-remaining-bar">
                            <span className="split-remaining-label">Total Shares:</span>
                            <span className="split-remaining-value" style={{ color: 'var(--brand-primary)' }}>
                              {totalShares} {totalShares === 1 ? 'share' : 'shares'}
                            </span>
                          </div>

                          <div className="split-members-list">
                            {allMembers.map((member) => {
                              const splitEntry = form.splits.find((s) => s.userId === member._id);
                              const isMemberChecked = !!splitEntry;
                              const displayAmount = splitEntry ? calculatedEqualSplits.find((s) => s.userId === member._id)?.amount : 0;
                              return (
                                <div
                                  key={member._id}
                                  className={`split-member-row ${isMemberChecked ? 'split-member-row--active' : ''}`}
                                  id={`equal-split-row-${member._id}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isMemberChecked}
                                    onChange={() => handleEqualSplitCheckboxToggle(member._id)}
                                    disabled={loading}
                                    style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                                  />
                                  <div className="split-member-info">
                                    <span className="split-member-name">{member.name}</span>
                                    <span className="split-member-email">{member.email}</span>
                                  </div>
                                  <div className="split-shares-input-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div className="split-amount-input-wrapper" style={{ width: '65px' }}>
                                      <input
                                        type="number"
                                        className="split-amount-input"
                                        placeholder="1"
                                        min="1"
                                        step="1"
                                        value={splitEntry ? splitEntry.shares : ''}
                                        onChange={(e) => handleEqualSplitSharesChange(member._id, e.target.value)}
                                        disabled={loading || !isMemberChecked}
                                        style={{ textAlign: 'center' }}
                                        autoComplete="off"
                                      />
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '45px' }}>share(s)</span>
                                    <div style={{ minWidth: '70px', textAlign: 'right', fontWeight: 600, color: isMemberChecked ? '#22C55E' : 'var(--text-muted)' }}>
                                      {displayAmount !== undefined ? `₹${displayAmount.toFixed(2)}` : '₹0.00'}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Custom Split Member Picker */}
                  {form.splitType === 'custom' && (
                    <div className="custom-split-container">
                      <label className="form-label" style={{ marginBottom: '0.5rem' }}>Assign Amounts to Members</label>
                      {fetchingMembers ? (
                        <div className="members-loading" style={{ padding: '1rem 0' }}>
                          <Loader2 className="animate-spin" size={18} style={{ color: 'var(--brand-primary)' }} />
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
                              style={{ color: remainingAmount > 0 ? 'var(--brand-primary)' : '#22C55E' }}
                            >
                              ₹{remainingAmount.toFixed(2)} / ₹{Number(form.amount || 0).toFixed(2)}
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
                                    style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                                  />
                                  <div className="split-member-info">
                                    <span className="split-member-name">{member.name}</span>
                                    <span className="split-member-email">{member.email}</span>
                                  </div>
                                  <div className="split-amount-input-wrapper">
                                    <span className="split-amount-input-symbol">₹</span>
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
                                      autoComplete="off"
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
