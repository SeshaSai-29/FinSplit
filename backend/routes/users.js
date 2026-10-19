import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile stats & details
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const groupCount = user.groupIds ? user.groupIds.length : 0;
    const standaloneTxnCount = await Transaction.countDocuments({
      userId: req.user.id,
      isShared: false
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      monthlyBudgetLimit: user.monthlyBudgetLimit || 0,
      categoryBudgets: user.categoryBudgets || [],
      createdAt: user.createdAt,
      groupCount,
      standaloneTxnCount
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user display name, email, and monthly budget limit
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { name, email, monthlyBudgetLimit } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Please provide both name and email' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }

  if (monthlyBudgetLimit !== undefined && monthlyBudgetLimit !== null) {
    const numericBudget = Number(monthlyBudgetLimit);
    if (isNaN(numericBudget) || numericBudget < 0) {
      return res.status(400).json({ message: 'Monthly budget limit must be a valid non-negative number' });
    }
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is unique if it is being updated
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
    }

    user.name = name;
    user.email = email.toLowerCase();
    if (monthlyBudgetLimit !== undefined && monthlyBudgetLimit !== null) {
      user.monthlyBudgetLimit = Math.max(0, Number(monthlyBudgetLimit) || 0);
    }
    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      groupIds: user.groupIds,
      monthlyBudgetLimit: user.monthlyBudgetLimit || 0,
      categoryBudgets: user.categoryBudgets || [],
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Secure password change endpoint
// @access  Private
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please provide both current and new passwords' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error changing password' });
  }
});

// @route   DELETE /api/users/profile
// @desc    Delete user account and clean up transactions
// @access  Private
router.delete('/profile', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete user's transactions
    await Transaction.deleteMany({ userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

// @route   GET /api/users/export-data
// @desc    Export all personal transactions, group transactions, and settlement entries
// @access  Private
router.get('/export-data', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Standalone Personal Transactions
    const personalTransactions = await Transaction.find({
      userId: req.user.id,
      isShared: false
    }).sort({ createdAt: -1 });

    // 2. Group Transactions involving the user
    const userGroupIds = user.groupIds || [];
    const groupTransactions = await Transaction.find({
      isShared: true,
      $or: [
        { userId: req.user.id },
        { 'splits.userId': req.user.id },
        { groupIds: { $in: userGroupIds } }
      ]
    })
    .populate('userId', 'name email')
    .populate('splits.userId', 'name email')
    .sort({ createdAt: -1 });

    // 3. Settlement Entries
    const settlements = groupTransactions.filter((t) => t.category === 'Settlement');

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      exportedAt: new Date().toISOString(),
      personalTransactions,
      groupTransactions,
      settlements
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Server error generating export data' });
  }
});

// @route   GET /api/users/category-budgets
// @desc    Get user's configured category budgets
// @access  Private
router.get('/category-budgets', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.categoryBudgets || []);
  } catch (error) {
    console.error('Fetch category budgets error:', error);
    res.status(500).json({ message: 'Server error fetching category budgets' });
  }
});

// @route   POST /api/users/category-budgets
// @desc    Add or update a single category budget limit
// @access  Private
router.post('/category-budgets', protect, async (req, res) => {
  const { category, limit } = req.body;

  if (!category || limit === undefined || limit === null) {
    return res.status(400).json({ message: 'Please provide both category and limit' });
  }

  const numericLimit = Number(limit);
  if (isNaN(numericLimit) || numericLimit < 0) {
    return res.status(400).json({ message: 'Limit must be a non-negative number' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const trimmedCat = category.trim();
    const existingIndex = (user.categoryBudgets || []).findIndex(
      (cb) => cb.category.toLowerCase() === trimmedCat.toLowerCase()
    );

    if (existingIndex >= 0) {
      user.categoryBudgets[existingIndex].limit = numericLimit;
      user.categoryBudgets[existingIndex].category = trimmedCat;
    } else {
      if (!user.categoryBudgets) user.categoryBudgets = [];
      user.categoryBudgets.push({ category: trimmedCat, limit: numericLimit });
    }

    await user.save();
    res.json({
      message: 'Category budget updated successfully',
      categoryBudgets: user.categoryBudgets
    });
  } catch (error) {
    console.error('Save category budget error:', error);
    res.status(500).json({ message: 'Server error saving category budget' });
  }
});

// @route   PUT /api/users/category-budgets
// @desc    Bulk update or replace category budgets list
// @access  Private
router.put('/category-budgets', protect, async (req, res) => {
  const { categoryBudgets } = req.body;

  if (!Array.isArray(categoryBudgets)) {
    return res.status(400).json({ message: 'categoryBudgets must be an array' });
  }

  // Validate array items
  for (const item of categoryBudgets) {
    if (!item.category || typeof item.category !== 'string' || item.limit === undefined || isNaN(Number(item.limit)) || Number(item.limit) < 0) {
      return res.status(400).json({ message: 'Each category budget must have a category name and a non-negative limit' });
    }
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.categoryBudgets = categoryBudgets.map((item) => ({
      category: item.category.trim(),
      limit: Number(item.limit)
    }));

    await user.save();
    res.json({
      message: 'Category budgets updated successfully',
      categoryBudgets: user.categoryBudgets
    });
  } catch (error) {
    console.error('Bulk update category budgets error:', error);
    res.status(500).json({ message: 'Server error updating category budgets' });
  }
});

// @route   DELETE /api/users/category-budgets/:category
// @desc    Delete a category budget limit
// @access  Private
router.delete('/category-budgets/:category', protect, async (req, res) => {
  const { category } = req.params;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const targetCat = decodeURIComponent(category).trim().toLowerCase();
    user.categoryBudgets = (user.categoryBudgets || []).filter(
      (cb) => cb.category.toLowerCase() !== targetCat
    );

    await user.save();
    res.json({
      message: 'Category budget removed successfully',
      categoryBudgets: user.categoryBudgets
    });
  } catch (error) {
    console.error('Delete category budget error:', error);
    res.status(500).json({ message: 'Server error deleting category budget' });
  }
});

export default router;
