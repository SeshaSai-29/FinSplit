import express from 'express';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

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
      splits: (splitType === 'custom' && splits) ? splits : []
    });

    res.status(201).json(transaction);
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
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ createdAt: -1 });
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
      return res.status(401).json({ message: 'Not authorized to delete this transaction' });
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
