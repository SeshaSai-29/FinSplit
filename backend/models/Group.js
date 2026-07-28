import mongoose from 'mongoose';

const GroupSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 6
  },
  name: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    required: true
  },
  members: [{
    type: String
  }]
}, {
  timestamps: true
});

const Group = mongoose.model('Group', GroupSchema);

export default Group;
