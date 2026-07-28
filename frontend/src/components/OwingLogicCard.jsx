import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export default function OwingLogicCard({ transactions = [], members = [], currentUserId }) {
  // If no members or transactions, return default values
  const memberCount = members.length || 1;

  let totalPaid = 0;
  let totalOwed = 0;

  transactions.forEach((txn) => {
    // Only process expenses (shared group expenses)
    if (txn.type !== 'expense') return;

    // Check if the current logged-in user is the payer
    const payerId = txn.userId && typeof txn.userId === 'object' ? txn.userId._id : txn.userId;
    const isPayer = payerId === currentUserId;

    if (isPayer) {
      totalPaid += txn.amount;
    }

    // Determine the user's share for this transaction
    let userShare = 0;

    if (!txn.splitType || txn.splitType === 'equal') {
      // Split equally among all group members
      userShare = txn.amount / memberCount;
    } else if (txn.splitType === 'custom') {
      // Custom split: find if the current user is explicitly assigned an amount
      const userSplit = txn.splits?.find((s) => {
        const splitUserId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
        return splitUserId === currentUserId;
      });

      if (userSplit) {
        userShare = userSplit.amount;
      } else if (isPayer) {
        // If the user is the payer and not explicitly in the splits,
        // their share is the remaining amount
        const splitTotal = txn.splits?.reduce((sum, s) => sum + s.amount, 0) || 0;
        userShare = Math.max(0, txn.amount - splitTotal);
      } else {
        // If the user is not in the splits and not the payer, they owe 0
        userShare = 0;
      }
    }

    totalOwed += userShare;
  });

  const balance = totalPaid - totalOwed;

  // Calculate peer-to-peer balances for the logged-in user
  const memberBalances = {};
  members.forEach((m) => {
    const mId = m._id || m.id;
    if (mId !== currentUserId) {
      memberBalances[mId] = 0;
    }
  });

  transactions.forEach((txn) => {
    if (txn.type !== 'expense') return;

    const payerId = txn.userId && typeof txn.userId === 'object' ? txn.userId._id : txn.userId;
    const isPayer = payerId === currentUserId;

    if (!txn.splitType || txn.splitType === 'equal') {
      const share = txn.amount / memberCount;
      if (isPayer) {
        members.forEach((m) => {
          const mId = m._id || m.id;
          if (mId !== currentUserId) {
            memberBalances[mId] = (memberBalances[mId] || 0) + share;
          }
        });
      } else {
        if (payerId && payerId !== currentUserId) {
          memberBalances[payerId] = (memberBalances[payerId] || 0) - share;
        }
      }
    } else if (txn.splitType === 'custom') {
      if (isPayer) {
        txn.splits?.forEach((s) => {
          const sUserId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
          if (sUserId !== currentUserId) {
            memberBalances[sUserId] = (memberBalances[sUserId] || 0) + s.amount;
          }
        });
      } else {
        const userSplit = txn.splits?.find((s) => {
          const sUserId = s.userId && typeof s.userId === 'object' ? s.userId._id : s.userId;
          return sUserId === currentUserId;
        });
        if (userSplit && payerId && payerId !== currentUserId) {
          memberBalances[payerId] = (memberBalances[payerId] || 0) - userSplit.amount;
        }
      }
    }
  });

  const formatRupee = (val) =>
    '₹' + Math.abs(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const activeBalances = [];
  members.forEach((m) => {
    const mId = m._id || m.id;
    if (mId === currentUserId) return;

    const netBal = memberBalances[mId] || 0;
    if (netBal > 0.01) {
      activeBalances.push({
        member: m,
        type: 'owes_you',
        amount: netBal,
      });
    } else if (netBal < -0.01) {
      activeBalances.push({
        member: m,
        type: 'you_owe',
        amount: netBal,
      });
    }
  });

  const formatCurrency = (val) =>
    Math.abs(val).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

  let cardClass = 'owing-card--neutral';
  let statusText = 'You are all settled up!';
  let statusColor = 'var(--text-secondary)';
  let StatusIcon = Wallet;

  if (balance > 0.01) {
    cardClass = 'owing-card--green';
    statusText = "You're in the green!";
    statusColor = '#10b981';
    StatusIcon = TrendingUp;
  } else if (balance < -0.01) {
    cardClass = 'owing-card--red';
    statusText = 'You owe money to the pool';
    statusColor = '#ef4444';
    StatusIcon = TrendingDown;
  }

  return (
    <div className={`glass-card owing-card ${cardClass}`} id="owing-logic-card">
      <div className="owing-card__header">
        <h3 className="owing-card__title">Split & Owing Status</h3>
        <div className="owing-card__icon" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
          <StatusIcon size={20} />
        </div>
      </div>

      <div className="owing-card__content">
        <div className="owing-status" style={{ color: statusColor }}>
          {statusText}
        </div>
        <div className="owing-balance-value" style={{ color: balance >= 0 ? '#10b981' : '#ef4444' }}>
          {balance >= 0 ? '+' : '−'}
          {formatCurrency(balance)}
        </div>

        <div className="owing-details">
          <div className="owing-detail-row">
            <span className="owing-detail-label">Your Total Paid</span>
            <span className="owing-detail-value">{formatCurrency(totalPaid)}</span>
          </div>
          <div className="owing-detail-row">
            <span className="owing-detail-label">Your Total Share</span>
            <span className="owing-detail-value">{formatCurrency(totalOwed)}</span>
          </div>
        </div>

        {activeBalances.length > 0 && (
          <div className="owing-p2p-breakdown" style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Individual Balances
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {activeBalances.map(({ member, type, amount }) => (
                <div 
                  key={member._id || member.id} 
                  className="owing-p2p-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {type === 'owes_you' ? (
                    <span>
                      <strong style={{ color: '#ffffff' }}>{member.name}</strong> owes you: <strong style={{ color: '#10b981' }}>{formatRupee(amount)}</strong>
                    </span>
                  ) : (
                    <span>
                      You owe <strong style={{ color: '#ffffff' }}>{member.name}</strong>: <strong style={{ color: '#ef4444' }}>{formatRupee(amount)}</strong>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
