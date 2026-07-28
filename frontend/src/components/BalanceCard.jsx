import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function BalanceCard({ transactions }) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  const formatCurrency = (value) =>
    value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });

  return (
    <div className="balance-cards-row">
      <div className="balance-card balance-card--income">
        <div className="balance-card__header">
          <span className="balance-card__label">Total Income</span>
          <div className="balance-card__icon balance-card__icon--income">
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="balance-card__value amount-income">
          {formatCurrency(totalIncome)}
        </div>
        <p className="balance-card__hint">
          {transactions.filter((t) => t.type === 'income').length} transaction
          {transactions.filter((t) => t.type === 'income').length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="balance-card balance-card--expense">
        <div className="balance-card__header">
          <span className="balance-card__label">Total Expenses</span>
          <div className="balance-card__icon balance-card__icon--expense">
            <TrendingDown size={20} />
          </div>
        </div>
        <div className="balance-card__value amount-expense">
          {formatCurrency(totalExpenses)}
        </div>
        <p className="balance-card__hint">
          {transactions.filter((t) => t.type === 'expense').length} transaction
          {transactions.filter((t) => t.type === 'expense').length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="balance-card balance-card--net">
        <div className="balance-card__header">
          <span className="balance-card__label">Net Balance</span>
          <div className="balance-card__icon balance-card__icon--net">
            <Wallet size={20} />
          </div>
        </div>
        <div className={`balance-card__value ${netBalance >= 0 ? 'amount-income' : 'amount-expense'}`}>
          {formatCurrency(netBalance)}
        </div>
        <p className="balance-card__hint">
          {netBalance >= 0 ? 'You\'re in the green' : 'Spending exceeds income'}
        </p>
      </div>
    </div>
  );
}
