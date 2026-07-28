import express from 'express';
import Group from '../models/Group.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate 6-char Alphanumeric Group Code Helper
function generateGroupCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// @route   POST /api/groups/create
// @desc    Create a new group (generates a unique 6-character code)
// @access  Private
router.post('/create', protect, async (req, res) => {
  const { name, budget } = req.body;

  try {
    // Generate a unique 6-character code
    let code = generateGroupCode();
    let groupExists = await Group.findOne({ code });

    while (groupExists) {
      code = generateGroupCode();
      groupExists = await Group.findOne({ code });
    }

    const groupName = name || `${req.user.name}'s Group`;

    // Create the group
    const newGroup = await Group.create({
      code,
      name: groupName,
      budget: budget ? Number(budget) : 0,
      createdBy: req.user.id,
      members: [req.user.id] // Initial member is the creator
    });

    // Update user's groupIds array
    const currentUser = await User.findById(req.user.id);
    const updatedGroupIds = [...(currentUser.groupIds || []), code];
    await User.findByIdAndUpdate(req.user.id, { groupIds: updatedGroupIds });

    res.status(201).json({
      message: 'Group created successfully',
      group: newGroup
    });
  } catch (error) {
    console.error('Group Creation Error:', error);
    res.status(500).json({ message: 'Server error during group creation' });
  }
});

// @route   POST /api/groups/join
// @desc    Join an existing group using a 6-character code
// @access  Private
router.post('/join', protect, async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Please provide a 6-character group code' });
  }

  const cleanCode = code.toUpperCase().trim();

  if (cleanCode.length !== 6) {
    return res.status(400).json({ message: 'Group code must be exactly 6 characters' });
  }

  try {
    // Find target group
    const group = await Group.findOne({ code: cleanCode });

    if (!group) {
      return res.status(404).json({ message: 'Group not found. Please check the code.' });
    }

    // Check if user is already a member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    // Add user to the group's members using $addToSet (atomic, prevents duplicates)
    const updatedGroup = await Group.findOneAndUpdate(
      { code: cleanCode },
      { $addToSet: { members: req.user.id } },
      { new: true }
    );

    // Update user's groupIds list
    const currentUser = await User.findById(req.user.id);
    const updatedGroupIds = [...(currentUser.groupIds || []), cleanCode];
    await User.findByIdAndUpdate(req.user.id, { groupIds: updatedGroupIds });

    res.json({
      message: 'Successfully joined the group',
      group: updatedGroup
    });
  } catch (error) {
    console.error('Group Join Error:', error);
    res.status(500).json({ message: 'Server error while joining group' });
  }
});

// @route   GET /api/groups
// @desc    Get all groups the logged-in user belongs to
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userGroups = await Group.find({ members: req.user.id });
    res.json(userGroups);
  } catch (error) {
    console.error('Get Groups Error:', error);
    res.status(500).json({ message: 'Server error retrieving groups list' });
  }
});

// @route   GET /api/groups/:groupId/members
// @desc    Get all members of a specific group (names and emails)
// @access  Private (must be a member of the group)
router.get('/:groupId/members', protect, async (req, res) => {
  const { groupId } = req.params;

  try {
    // Verify the logged-in user is a member of this group
    const userGroupIds = req.user.groupIds || [];
    if (!userGroupIds.includes(groupId)) {
      return res.status(403).json({ message: 'Forbidden: you are not a member of this group' });
    }

    // Find all users whose groupIds array contains this groupId
    const members = await User.find(
      { groupIds: groupId },
      'name email'
    );

    res.json(members);
  } catch (error) {
    console.error('Fetch Group Members Error:', error);
    res.status(500).json({ message: 'Server error while fetching group members' });
  }
});

// @route   POST /api/groups/:groupId/budget
// @desc    Update the budget for a specific group
// @access  Private (must be the owner/creator of the group)
router.post('/:groupId/budget', protect, async (req, res) => {
  const { groupId } = req.params;
  const { budget } = req.body;

  try {
    const group = await Group.findOne({ code: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify the logged-in user is the owner/creator of this group
    if (group.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: only the group owner can update the budget' });
    }

    if (budget === undefined || typeof budget !== 'number') {
      return res.status(400).json({ message: 'Please provide a valid budget number' });
    }

    group.budget = budget;
    await group.save();

    res.json({ message: 'Budget updated', group });
  } catch (error) {
    console.error('Update Group Budget Error:', error);
    res.status(500).json({ message: 'Server error while updating group budget' });
  }
});

// @route   PUT /api/groups/:groupId/rename
// @desc    Rename a specific group
// @access  Private (must be the owner/creator of the group)
router.put('/:groupId/rename', protect, async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Please provide a valid group name' });
  }

  try {
    const group = await Group.findOne({ code: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify the logged-in user is the owner/creator
    if (group.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: only the group owner can rename the group' });
    }

    group.name = name.trim();
    await group.save();

    res.json({ message: 'Group renamed successfully', group });
  } catch (error) {
    console.error('Rename Group Error:', error);
    res.status(500).json({ message: 'Server error while renaming group' });
  }
});

// @route   DELETE /api/groups/:groupId
// @desc    Delete a group, remove membership references, and update associated transactions
// @access  Private (must be the owner/creator of the group)
router.delete('/:groupId', protect, async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findOne({ code: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify the logged-in user is the owner/creator
    if (group.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: only the group owner can delete the group' });
    }

    // Delete the group
    await Group.deleteOne({ code: groupId });

    // Remove group code from all group members' groupIds lists
    await User.updateMany(
      { groupIds: groupId },
      { $pull: { groupIds: groupId } }
    );

    // Fetch transactions associated with the group to clean up or delete
    const transactions = await Transaction.find({ groupIds: groupId });
    for (const txn of transactions) {
      if (txn.groupIds.length > 1) {
        // Pull groupId from transaction and save
        txn.groupIds = txn.groupIds.filter(g => g !== groupId);
        await txn.save();
      } else {
        // Only associated with this group - delete the entire transaction
        await txn.deleteOne();
      }
    }

    res.json({ message: 'Group and associated transactions deleted successfully' });
  } catch (error) {
    console.error('Delete Group Error:', error);
    res.status(500).json({ message: 'Server error while deleting group' });
  }
});

// @route   POST /api/groups/:groupId/leave
// @desc    Remove the current user from the group
// @access  Private (non-owners only)
router.post('/:groupId/leave', protect, async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findOne({ code: groupId });
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Verify user is currently a member
    if (!group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // Verify the user is NOT the owner
    if (group.createdBy === req.user.id) {
      return res.status(400).json({ message: 'As the group owner, you cannot leave the group. You must delete it instead.' });
    }

    // Remove user ID from group's members list
    group.members = group.members.filter(m => m !== req.user.id);
    await group.save();

    // Remove group code from user's groupIds list
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { groupIds: groupId }
    });

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('Leave Group Error:', error);
    res.status(500).json({ message: 'Server error while leaving group' });
  }
});

export default router;
