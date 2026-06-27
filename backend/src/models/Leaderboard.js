import mongoose from 'mongoose';

const leaderboardSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  period: {
    type: String,
    enum: ['all-time', 'monthly', 'weekly'],
    default: 'all-time'
  },
  entries: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalScore: Number,
    averageScore: Number,
    attemptCount: Number,
    lastAttemptDate: Date,
    rank: Number
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('Leaderboard', leaderboardSchema);
