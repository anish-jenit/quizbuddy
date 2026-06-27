import User from '../models/User.js';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';
import Group from '../models/Group.js';

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};

    if (role) query.role = role;

    const users = await User.find(query).select('-password');

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    if (!['student', 'mentor', 'admin'].includes(newRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

export const getReportedQuestions = async (req, res) => {
  try {
    const reportedQuestions = await Question.find({ isReported: true })
      .populate('quiz', 'title category')
      .sort({ 'reports.reportedAt': -1 });

    res.status(200).json({ success: true, reportedQuestions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reported questions', error: error.message });
  }
};

export const resolveQuestionReport = async (req, res) => {
  try {
    const { questionId, action } = req.body;

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (action === 'approve') {
      question.isReported = false;
      question.reports = [];
    } else if (action === 'delete') {
      const quiz = await Quiz.findById(question.quiz);
      quiz.questions = quiz.questions.filter(q => q.toString() !== questionId);
      await quiz.save();
      await Question.findByIdAndDelete(questionId);
      return res.status(200).json({ success: true, message: 'Question deleted' });
    }

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      question
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resolve report', error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalQuizzes = await Quiz.countDocuments();
    const reportedQuestions = await Question.countDocuments({ isReported: true });
    const reportedQuizzes = await Quiz.countDocuments({
      $or: [
        { reportCount: { $gt: 0 } },
        { moderationStatus: { $in: ['pending-review', 'hidden'] } }
      ]
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalMentors,
        totalQuizzes,
        reportedQuestions,
        reportedQuizzes
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

export const getReportedQuizzes = async (req, res) => {
  try {
    const reportedQuizzes = await Quiz.find({
      $or: [
        { reportCount: { $gt: 0 } },
        { moderationStatus: { $in: ['pending-review', 'hidden'] } }
      ]
    })
      .populate('createdBy', 'firstName lastName email')
      .populate('group', 'name quizVisibility')
      .sort({ reportCount: -1, updatedAt: -1 });

    res.status(200).json({ success: true, reportedQuizzes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reported quizzes', error: error.message });
  }
};

export const reviewQuizReport = async (req, res) => {
  try {
    const { quizId, action } = req.body;

    if (!['approve', 'keep-hidden'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (action === 'approve') {
      quiz.moderationStatus = 'approved';
      quiz.reports = [];
      quiz.reportCount = 0;
    } else {
      quiz.moderationStatus = 'hidden';
    }

    await quiz.save();

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Quiz approved and visible again' : 'Quiz will remain hidden from students'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review quiz report', error: error.message });
  }
};

export const getPendingTeacherRequests = async (req, res) => {
  try {
    const pendingRequests = await User.find({
      approvalStatus: 'pending',
      requestedRole: 'mentor'
    }).select('-password').sort({ createdAt: -1 });

    res.status(200).json({ success: true, pendingRequests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending teacher requests', error: error.message });
  }
};

export const getReviewedTeacherRequests = async (req, res) => {
  try {
    const reviewedRequests = await User.find({
      requestedRole: 'mentor',
      approvalStatus: { $in: ['approved', 'rejected'] }
    }).select('-password').sort({ updatedAt: -1 });

    res.status(200).json({ success: true, reviewedRequests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviewed teacher requests', error: error.message });
  }
};

export const reviewTeacherRequest = async (req, res) => {
  try {
    const { userId, action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (action === 'approve') {
      user.role = 'mentor';
      user.approvalStatus = 'approved';
      user.requestedRole = 'mentor';
    } else {
      user.role = 'student';
      user.approvalStatus = 'rejected';
      user.requestedRole = 'mentor';
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Teacher request approved' : 'Teacher request rejected',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review teacher request', error: error.message });
  }
};

export const getPendingMentorRemovals = async (req, res) => {
  try {
    const groups = await Group.find({ 'pendingMentorRemovals.0': { $exists: true } })
      .populate('pendingMentorRemovals.mentorId', 'firstName lastName email')
      .populate('pendingMentorRemovals.requestedBy', 'firstName lastName email');

    const requests = [];
    for (const group of groups) {
      for (const r of group.pendingMentorRemovals) {
        requests.push({
          groupId: group._id,
          groupName: group.name,
          mentorId: r.mentorId?._id || r.mentorId,
          mentorName: r.mentorId ? `${r.mentorId.firstName} ${r.mentorId.lastName}` : '',
          mentorEmail: r.mentorId?.email || '',
          requestedBy: r.requestedBy ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}` : '',
          requestedAt: r.requestedAt
        });
      }
    }

    res.status(200).json({ success: true, pendingRemovals: requests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending removals', error: error.message });
  }
};

export const reviewMentorRemoval = async (req, res) => {
  try {
    const { groupId, mentorId, action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found' });

    group.pendingMentorRemovals = (group.pendingMentorRemovals || []).filter(
      (r) => r.mentorId.toString() !== mentorId
    );

    if (action === 'approve') {
      group.mentors = group.mentors.filter((m) => m.toString() !== mentorId);
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: action === 'approve' ? 'Mentor removed from group' : 'Removal request rejected'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to review removal', error: error.message });
  }
};
