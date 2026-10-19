import express from 'express';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/transactions/analytics
// @desc    Get aggregated spending, savings, trailing averages, MoM changes, and category budget utilization
// @access  Private
router.get('/analytics', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch all personal transactions for the authenticated user (excluding group income)
    const transactions = await Transaction.find({
      userId: req.user.id,
      $nor: [
        { type: 'income', isShared: true },
        { type: 'income', groupIds: { $exists: true, $ne: [] } }
      ]
    });

    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth(); // 0-indexed (0=Jan, 8=Sep)

    if (req.query.month) {
      const parts = req.query.month.split('-');
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m) && m >= 0 && m <= 11) {
          targetYear = y;
          targetMonth = m;
        }
      }
    }

    const targetDate = new Date(targetYear, targetMonth, 1);

    // Selected month bounds
    const startOfCurrentMonth = new Date(targetYear, targetMonth, 1);
    const endOfCurrentMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Previous month bounds
    const startOfPreviousMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfPreviousMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Trailing windows relative to current month start / now
    // 3 Months: target month + past 2 months
    const startOf3M = new Date(targetYear, targetMonth - 2, 1);
    // 6 Months: target month + past 5 months
    const startOf6M = new Date(targetYear, targetMonth - 5, 1);
    // 12 Months: target month + past 11 months
    const startOf12M = new Date(targetYear, targetMonth - 11, 1);

    // Filter variables
    let currentMonthIncome = 0;
    let currentMonthExpenses = 0;
    const currentMonthCategoryMap = {};

    let previousMonthIncome = 0;
    let previousMonthExpenses = 0;

    let total3MExpenses = 0;
    let total6MExpenses = 0;
    let total12MExpenses = 0;

    let total3MIncome = 0;
    let total6MIncome = 0;
    let total12MIncome = 0;

    // Monthly breakdown map for historical tracking (past 12 months up to current calendar month)
    const currentCalendarYear = now.getFullYear();
    const currentCalendarMonth = now.getMonth();
    const monthlyHistoryMap = {};
    const monthlyCategoryBreakdownMap = {};

    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentCalendarYear, currentCalendarMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const shortLabel = d.toLocaleString('en-US', { month: 'short' });
      monthlyHistoryMap[key] = {
        key,
        month: shortLabel,
        monthFull: label,
        label,
        shortLabel,
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        income: 0,
        expense: 0,
        expenses: 0,
        savings: 0,
        savingsRate: 0,
        transactionCount: 0
      };
      monthlyCategoryBreakdownMap[key] = {};
    }

    // Ensure target month exists in history map if user selected an older month
    const targetKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    if (!monthlyHistoryMap[targetKey]) {
      const label = targetDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const shortLabel = targetDate.toLocaleString('en-US', { month: 'short' });
      monthlyHistoryMap[targetKey] = {
        key: targetKey,
        month: shortLabel,
        monthFull: label,
        label,
        shortLabel,
        year: targetYear,
        monthNum: targetMonth + 1,
        income: 0,
        expense: 0,
        expenses: 0,
        savings: 0,
        savingsRate: 0,
        transactionCount: 0
      };
      monthlyCategoryBreakdownMap[targetKey] = {};
    }

    transactions.forEach((txn) => {
      const txnDate = new Date(txn.createdAt);
      const amount = Number(txn.amount) || 0;
      const isExpense = txn.type === 'expense';
      const isIncome = txn.type === 'income';

      // Current Selected Month
      if (txnDate >= startOfCurrentMonth && txnDate <= endOfCurrentMonth) {
        if (isIncome) currentMonthIncome += amount;
        if (isExpense) {
          currentMonthExpenses += amount;
          const cat = txn.category || 'Others';
          if (!currentMonthCategoryMap[cat]) {
            currentMonthCategoryMap[cat] = { spent: 0, count: 0 };
          }
          currentMonthCategoryMap[cat].spent += amount;
          currentMonthCategoryMap[cat].count += 1;
        }
      }

      // Previous Month
      if (txnDate >= startOfPreviousMonth && txnDate <= endOfPreviousMonth) {
        if (isIncome) previousMonthIncome += amount;
        if (isExpense) previousMonthExpenses += amount;
      }

      // Trailing 3 Months
      if (txnDate >= startOf3M && txnDate <= endOfCurrentMonth) {
        if (isExpense) total3MExpenses += amount;
        if (isIncome) total3MIncome += amount;
      }

      // Trailing 6 Months
      if (txnDate >= startOf6M && txnDate <= endOfCurrentMonth) {
        if (isExpense) total6MExpenses += amount;
        if (isIncome) total6MIncome += amount;
      }

      // Trailing 12 Months
      if (txnDate >= startOf12M && txnDate <= endOfCurrentMonth) {
        if (isExpense) total12MExpenses += amount;
        if (isIncome) total12MIncome += amount;
      }

      // Monthly History Bucket
      const monthKey = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyHistoryMap[monthKey]) {
        const label = txnDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const shortLabel = txnDate.toLocaleString('en-US', { month: 'short' });
        monthlyHistoryMap[monthKey] = {
          key: monthKey,
          month: shortLabel,
          monthFull: label,
          label,
          shortLabel,
          year: txnDate.getFullYear(),
          monthNum: txnDate.getMonth() + 1,
          income: 0,
          expense: 0,
          expenses: 0,
          savings: 0,
          savingsRate: 0,
          transactionCount: 0
        };
        monthlyCategoryBreakdownMap[monthKey] = {};
      }

      if (isIncome) monthlyHistoryMap[monthKey].income += amount;
      if (isExpense) {
        monthlyHistoryMap[monthKey].expense += amount;
        monthlyHistoryMap[monthKey].expenses += amount;

        const cat = txn.category || 'Others';
        if (!monthlyCategoryBreakdownMap[monthKey]) {
          monthlyCategoryBreakdownMap[monthKey] = {};
        }
        if (!monthlyCategoryBreakdownMap[monthKey][cat]) {
          monthlyCategoryBreakdownMap[monthKey][cat] = { spent: 0, count: 0 };
        }
        monthlyCategoryBreakdownMap[monthKey][cat].spent += amount;
        monthlyCategoryBreakdownMap[monthKey][cat].count += 1;
      }
      monthlyHistoryMap[monthKey].transactionCount += 1;
    });

    // Compute monthly category breakdowns for all months
    const monthlyCategoryBreakdowns = {};
    Object.keys(monthlyHistoryMap).forEach((mKey) => {
      const catMap = monthlyCategoryBreakdownMap[mKey] || {};
      const totalExp = monthlyHistoryMap[mKey].expenses || 0;
      monthlyCategoryBreakdowns[mKey] = Object.keys(catMap).map((cat) => {
        const { spent, count } = catMap[cat];
        const percentage = totalExp > 0 ? Math.round((spent / totalExp) * 10000) / 100 : 0;
        const roundedSpent = Math.round(spent * 100) / 100;
        return {
          category: cat,
          amount: roundedSpent,
          spent: roundedSpent,
          count,
          percentage
        };
      }).sort((a, b) => b.amount - a.amount);
    });

    // Compute monthly history savings & savings rate
    const monthlyHistory = Object.values(monthlyHistoryMap).map((m) => {
      const savings = m.income - m.expenses;
      const savingsRate = m.income > 0 ? Math.round((savings / m.income) * 10000) / 100 : 0;
      return {
        ...m,
        income: Math.round(m.income * 100) / 100,
        expense: Math.round(m.expense * 100) / 100,
        expenses: Math.round(m.expenses * 100) / 100,
        savings: Math.round(savings * 100) / 100,
        savingsRate
      };
    }).sort((a, b) => a.key.localeCompare(b.key));

    // Savings & Rate for Current Month
    const currentMonthSavings = currentMonthIncome - currentMonthExpenses;
    const currentMonthSavingsRate = currentMonthIncome > 0
      ? Math.round((currentMonthSavings / currentMonthIncome) * 10000) / 100
      : 0;

    // Previous Month Savings
    const previousMonthSavings = previousMonthIncome - previousMonthExpenses;
    const previousMonthSavingsRate = previousMonthIncome > 0
      ? Math.round((previousMonthSavings / previousMonthIncome) * 10000) / 100
      : 0;

    // MoM Spending Change Percentage: ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100
    let momSpendingChangePercent = 0;
    if (previousMonthExpenses > 0) {
      momSpendingChangePercent = Math.round(((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 10000) / 100;
    } else if (currentMonthExpenses > 0) {
      momSpendingChangePercent = 100;
    }

    // MoM Income Change Percentage
    let momIncomeChangePercent = 0;
    if (previousMonthIncome > 0) {
      momIncomeChangePercent = Math.round(((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 10000) / 100;
    } else if (currentMonthIncome > 0) {
      momIncomeChangePercent = 100;
    }

    // Trailing Averages (divided by window duration 3, 6, 12 months)
    const trailingAverages = {
      threeMonths: {
        totalSpend: total3MExpenses,
        totalIncome: total3MIncome,
        avgMonthlySpend: Math.round((total3MExpenses / 3) * 100) / 100,
        avgMonthlyIncome: Math.round((total3MIncome / 3) * 100) / 100,
        avgMonthlySavings: Math.round(((total3MIncome - total3MExpenses) / 3) * 100) / 100
      },
      sixMonths: {
        totalSpend: total6MExpenses,
        totalIncome: total6MIncome,
        avgMonthlySpend: Math.round((total6MExpenses / 6) * 100) / 100,
        avgMonthlyIncome: Math.round((total6MIncome / 6) * 100) / 100,
        avgMonthlySavings: Math.round(((total6MIncome - total6MExpenses) / 6) * 100) / 100
      },
      twelveMonths: {
        totalSpend: total12MExpenses,
        totalIncome: total12MIncome,
        avgMonthlySpend: Math.round((total12MExpenses / 12) * 100) / 100,
        avgMonthlyIncome: Math.round((total12MIncome / 12) * 100) / 100,
        avgMonthlySavings: Math.round(((total12MIncome - total12MExpenses) / 12) * 100) / 100
      }
    };

    // Category Breakdown for Current Month
    const categoryBreakdown = Object.keys(currentMonthCategoryMap).map((cat) => {
      const { spent, count } = currentMonthCategoryMap[cat];
      const percentage = currentMonthExpenses > 0
        ? Math.round((spent / currentMonthExpenses) * 10000) / 100
        : 0;
      const roundedSpent = Math.round(spent * 100) / 100;
      return {
        category: cat,
        amount: roundedSpent,
        spent: roundedSpent,
        count,
        percentage
      };
    }).sort((a, b) => b.amount - a.amount);

    // Category Budget Utilization: (categorySpent / categoryLimit) * 100
    const userCategoryBudgets = user.categoryBudgets || [];
    const categoryBudgetsUtilization = userCategoryBudgets.map((cb) => {
      const catSpent = currentMonthCategoryMap[cb.category] ? currentMonthCategoryMap[cb.category].spent : 0;
      const limit = Number(cb.limit) || 0;
      const utilization = limit > 0 ? Math.round((catSpent / limit) * 10000) / 100 : 0;
      const remaining = Math.max(0, limit - catSpent);
      const isOverBudget = catSpent > limit;
      const overAmount = isOverBudget ? catSpent - limit : 0;

      return {
        category: cb.category,
        limit,
        spent: Math.round(catSpent * 100) / 100,
        utilization,
        remaining: Math.round(remaining * 100) / 100,
        isOverBudget,
        overAmount: Math.round(overAmount * 100) / 100
      };
    });

    // Categories with expenses this month that don't have a budget set
    const configuredCategoriesSet = new Set(userCategoryBudgets.map((cb) => cb.category.toLowerCase()));
    const unbudgetedCategories = categoryBreakdown
      .filter((cb) => !configuredCategoriesSet.has(cb.category.toLowerCase()))
      .map((cb) => ({
        category: cb.category,
        limit: 0,
        spent: cb.spent,
        utilization: 0,
        remaining: 0,
        isOverBudget: false,
        overAmount: 0,
        hasBudget: false
      }));

    res.json({
      currentMonth: {
        monthKey: targetKey,
        monthName: targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        shortMonth: targetDate.toLocaleString('en-US', { month: 'short' }),
        year: targetYear,
        monthNum: targetMonth + 1,
        income: Math.round(currentMonthIncome * 100) / 100,
        expenses: Math.round(currentMonthExpenses * 100) / 100,
        savings: Math.round(currentMonthSavings * 100) / 100,
        savingsRate: currentMonthSavingsRate,
        overallMonthlyLimit: user.monthlyBudgetLimit || 0
      },
      previousMonth: {
        monthName: new Date(targetYear, targetMonth - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        shortMonth: new Date(targetYear, targetMonth - 1, 1).toLocaleString('en-US', { month: 'short' }),
        income: Math.round(previousMonthIncome * 100) / 100,
        expenses: Math.round(previousMonthExpenses * 100) / 100,
        savings: Math.round(previousMonthSavings * 100) / 100,
        savingsRate: previousMonthSavingsRate
      },
      momChange: {
        spendingChangePercent: momSpendingChangePercent,
        spendingChangeAmount: Math.round((currentMonthExpenses - previousMonthExpenses) * 100) / 100,
        incomeChangePercent: momIncomeChangePercent,
        incomeChangeAmount: Math.round((currentMonthIncome - previousMonthIncome) * 100) / 100,
        isSpendingUp: currentMonthExpenses > previousMonthExpenses,
        isIncomeUp: currentMonthIncome > previousMonthIncome,
        hasPreviousMonthData: previousMonthExpenses > 0 || previousMonthIncome > 0
      },
      trailingAverages,
      categoryBreakdown,
      monthlyCategoryBreakdowns,
      categoryBudgets: categoryBudgetsUtilization,
      unbudgetedCategories,
      monthlyHistory
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error);
    res.status(500).json({ message: 'Server error generating analytics' });
  }
});

// @route   POST /api/transactions
// @desc    Create a new transaction
// @access  Private
router.post('/', protect, async (req, res) => {
  const { description, amount, type, category, isShared, groupIds, splitType, splits } = req.body;

  // Basic validation
  if (!description || amount === undefined || !type || !category) {
    return res.status(400).json({ message: 'Please provide description, amount, type, and category' });
  }

  // Type enum validation
  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ message: "Type must be either 'income' or 'expense'" });
  }

  // Custom split validation
  if (splitType === 'custom' && splits) {
    const splitTotal = splits.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    if (splitTotal > amount) {
      return res.status(400).json({ message: 'Split amounts cannot exceed the transaction amount' });
    }
    for (const s of splits) {
      if (!s.userId || s.amount === undefined || Number(s.amount) <= 0) {
        return res.status(400).json({ message: 'Each split must have a valid userId and a positive amount' });
      }
    }
  }

  // Equal split validation
  if (splitType === 'equal' && splits && splits.length > 0) {
    const splitTotal = splits.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    if (splitTotal > amount + 0.1) {
      return res.status(400).json({ message: 'Split amounts cannot exceed the transaction amount' });
    }
    for (const s of splits) {
      if (!s.userId || s.amount === undefined || Number(s.amount) <= 0 || s.shares === undefined || Number(s.shares) <= 0) {
        return res.status(400).json({ message: 'Each split must have a valid userId, a positive amount, and positive shares' });
      }
    }
  }

  try {
    const transaction = await Transaction.create({
      userId: req.user.id,
      description,
      amount,
      type,
      category,
      isShared: isShared || false,
      groupIds: groupIds || [],
      splitType: splitType || 'equal',
      splits: ((splitType === 'custom' || splitType === 'equal') && splits) ? splits : []
    });

    // If this is a group income transaction, automatically increment the group's budget
    if (type === 'income' && groupIds && groupIds.length > 0) {
      for (const gCode of groupIds) {
        await Group.findOneAndUpdate(
          { code: gCode },
          { $inc: { budget: Number(amount) } }
        );
      }
    }

    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('userId', 'name email')
      .populate('splits.userId', 'name email');

    res.status(201).json(populatedTransaction);
  } catch (error) {
    console.error('Create Transaction Error:', error);
    res.status(500).json({ message: 'Server error while creating transaction' });
  }
});

// @route   GET /api/transactions
// @desc    Get all transactions for the logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Fetch all personal transactions for the logged-in user (excluding group income)
    const transactions = await Transaction.find({
      userId: req.user.id,
      $nor: [
        { type: 'income', isShared: true },
        { type: 'income', groupIds: { $exists: true, $ne: [] } }
      ]
    })
      .populate('splits.userId', 'name')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Fetch Transactions Error:', error);
    res.status(500).json({ message: 'Server error while fetching transactions' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Verify ownership: Check if current user is the owner of the transaction
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized: You can only delete transactions you created.' });
    }

    // If deleting a group income transaction, decrement the group's budget
    if (transaction.type === 'income' && transaction.groupIds && transaction.groupIds.length > 0) {
      for (const gCode of transaction.groupIds) {
        const grp = await Group.findOne({ code: gCode });
        if (grp) {
          grp.budget = Math.max(0, (grp.budget || 0) - Number(transaction.amount));
          await grp.save();
        }
      }
    }

    await transaction.deleteOne();

    res.json({ message: 'Transaction removed successfully' });
  } catch (error) {
    console.error('Delete Transaction Error:', error);
    res.status(500).json({ message: 'Server error while deleting transaction' });
  }
});

// @route   GET /api/transactions/group/:groupId
// @desc    Get all shared transactions for a specific group
// @access  Private (must be a member of the group)
router.get('/group/:groupId', protect, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Verify the logged-in user is a member of this group
    const userGroupIds = req.user.groupIds || [];
    if (!userGroupIds.includes(groupId)) {
      return res.status(403).json({ message: 'Forbidden: you are not a member of this group' });
    }

    // Fetch all shared transactions for this group, with the payer's name populated
    const transactions = await Transaction.find({ groupIds: groupId, isShared: true })
      .populate('userId', 'name')
      .populate('splits.userId', 'name')
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Fetch Group Transactions Error:', error);
    res.status(500).json({ message: 'Server error while fetching group transactions' });
  }
});

export default router;
