import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  isShared: {
    type: Boolean,
    default: false
  },
  groupIds: [{
    type: String
  }],
  splitType: {
    type: String,
    enum: ['equal', 'custom'],
    default: 'equal'
  },
  splits: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true
    },
    shares: {
      type: Number
    }
  }]
}, {
  timestamps: true
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
