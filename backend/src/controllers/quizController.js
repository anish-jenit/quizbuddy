import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import QuizResponse from '../models/QuizResponse.js';
import Group from '../models/Group.js';

const QUIZ_REPORT_THRESHOLD = 5;
const CORE_GENRES = ['Tamil', 'English', 'Math', 'Science', 'History'];

const populateQuiz = (query) => query
  .populate('createdBy', 'firstName lastName email')
  .populate('group', 'name code quizVisibility createdBy mentors students')
  .populate('questions');

const getId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value._id) return value._id.toString();
  return value.toString();
};

const isUserInGroup = (group, userId) => {
  if (!group || !userId) return false;
  const creatorId = getId(group.createdBy);
  const mentorIds = (group.mentors || []).map(getId);
  const studentIds = (group.students || []).map(getId);
  return creatorId === userId || mentorIds.includes(userId) || studentIds.includes(userId);
};

const canStudentAttemptQuiz = (quiz, userId) => {
  if (!quiz.isPublished || !quiz.isActive || quiz.moderationStatus !== 'approved') return false;
  if (!quiz.group) return true;
  return quiz.group.quizVisibility === 'public' || isUserInGroup(quiz.group, userId);
};

const serializeQuiz = (quiz, user) => {
  const serialized = quiz.toObject({ virtuals: true });
  const userId = getId(user?._id || user?.id || user);
  const reaction = (serialized.reactions || []).find((item) => getId(item.user) === userId);
  const visibility = serialized.group?.quizVisibility || 'private';

  return {
    ...serialized,
    visibility,
    currentUserReaction: reaction?.value || null,
    canAttemptWithoutGroup: !serialized.group || visibility === 'public' || isUserInGroup(serialized.group, userId),
    isUnderReview: serialized.moderationStatus !== 'approved'
  };
};

const sortQuizzes = (quizzes, sortBy) => {
  const items = [...quizzes];
  if (sortBy === 'title') {
    return items.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === 'newest') {
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  if (sortBy === 'mostDisliked') {
    return items.sort((a, b) => (b.dislikeCount || 0) - (a.dislikeCount || 0));
  }
  return items.sort((a, b) => {
    const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
    if (likeDiff !== 0) return likeDiff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

export const createQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, groupId, timePerQuestion } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    let group = null;

    if (req.user.role === 'mentor') {
      if (!groupId) {
        return res.status(400).json({ message: 'Mentors must select a group for the quiz' });
      }

      group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }

      const userId = req.user._id.toString();
      const isMentorInGroup =
        group.createdBy.toString() === userId || group.mentors.some((mentorId) => mentorId.toString() === userId);

      if (!isMentorInGroup) {
        return res.status(403).json({ message: 'You can only create quizzes for groups you mentor' });
      }
    } else if (groupId) {
      group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
    }

    if (group?.quizVisibility === 'public' && !CORE_GENRES.includes(category)) {
      return res.status(400).json({ message: 'Public quizzes must have one of the five core genres' });
    }
    if (category && !CORE_GENRES.includes(category)) {
      return res.status(400).json({ message: 'Invalid quiz genre' });
    }

    const quiz = new Quiz({
      title,
      description,
      category: category || undefined,
      difficulty: difficulty || 'medium',
      createdBy: req.user._id,
      group: groupId || null,
      timePerQuestion: timePerQuestion || 30
    });

    await quiz.save();

    if (group) {
      await Group.findByIdAndUpdate(group._id, { $push: { quizzes: quiz._id } });
    }

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create quiz', error: error.message });
  }
};

export const getQuizzes = async (req, res) => {
  try {
    const { groupId, category, isPublished, sortBy } = req.query;
    const query = {};

    if (groupId) query.group = groupId;
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';

    const quizDocs = await populateQuiz(Quiz.find(query));
    let quizzes = quizDocs.map((quiz) => serializeQuiz(quiz, req.user));

    if (req.user.role === 'student') {
      const userId = req.user._id.toString();
      quizzes = quizzes.filter((quiz) => canStudentAttemptQuiz(quiz, userId));
    }

    quizzes = sortQuizzes(quizzes, sortBy || (req.user.role === 'student' ? 'mostLiked' : 'newest'));

    res.status(200).json({ success: true, quizzes });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quizzes', error: error.message });
  }
};

export const getQuizById = async (req, res) => {
  try {
    const quiz = await populateQuiz(Quiz.findById(req.params.id));

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const serializedQuiz = serializeQuiz(quiz, req.user);
    if (req.user.role === 'student' && (!quiz.isPublished || !quiz.isActive)) {
      return res.status(403).json({ message: 'This quiz is not available' });
    }

    if (req.user.role === 'student' && serializedQuiz.moderationStatus !== 'approved') {
      return res.status(403).json({ message: 'This quiz is temporarily unavailable while under admin review' });
    }

    res.status(200).json({ success: true, quiz: serializedQuiz });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch quiz', error: error.message });
  }
};

export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this quiz' });
    }

    const group = quiz.group ? await Group.findById(quiz.group) : null;
    const nextGenre = req.body.category !== undefined ? req.body.category : quiz.category;
    if (group?.quizVisibility === 'public' && !CORE_GENRES.includes(nextGenre)) {
      return res.status(400).json({ message: 'Public quizzes must have one of the five core genres' });
    }

    const updatedQuiz = await Quiz.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      quiz: updatedQuiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update quiz', error: error.message });
  }
};

export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this quiz' });
    }

    await Quiz.findByIdAndDelete(id);
    await Question.deleteMany({ quiz: id });

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete quiz', error: error.message });
  }
};

export const publishQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const quiz = await Quiz.findById(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const questionCount = await Question.countDocuments({ quiz: id });

    if (questionCount === 0) {
      return res.status(400).json({ message: 'Quiz must have at least one question' });
    }

    if (questionCount > 10) {
      return res.status(400).json({ message: 'Quiz cannot have more than 10 questions' });
    }

    const group = quiz.group ? await Group.findById(quiz.group) : null;
    if (group?.quizVisibility === 'public' && !CORE_GENRES.includes(quiz.category)) {
      return res.status(400).json({ message: 'Choose a core genre before publishing this public quiz' });
    }

    quiz.isPublished = true;
    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz published successfully',
      quiz
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to publish quiz', error: error.message });
  }
};

export const reactToQuiz = async (req, res) => {
  try {
    const { value } = req.body;
    if (!['like', 'dislike', 'clear'].includes(value)) {
      return res.status(400).json({ message: 'Invalid reaction value' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const userId = req.user._id.toString();
    quiz.reactions = quiz.reactions.filter((item) => item.user.toString() !== userId);

    if (value !== 'clear') {
      quiz.reactions.push({ user: req.user._id, value });
    }

    quiz.likeCount = quiz.reactions.filter((item) => item.value === 'like').length;
    quiz.dislikeCount = quiz.reactions.filter((item) => item.value === 'dislike').length;
    await quiz.save();

    const populatedQuiz = await populateQuiz(Quiz.findById(req.params.id));
    return res.status(200).json({
      success: true,
      message: value === 'clear' ? 'Reaction removed' : 'Reaction saved',
      quiz: serializeQuiz(populatedQuiz, req.user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save reaction', error: error.message });
  }
};

export const reportQuiz = async (req, res) => {
  try {
    const { reason, description } = req.body;
    if (!reason) {
      return res.status(400).json({ message: 'Report reason is required' });
    }

    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const userId = req.user._id.toString();
    const existingIndex = quiz.reports.findIndex((item) => item.reportedBy.toString() === userId);
    const reportPayload = {
      reportedBy: req.user._id,
      reason,
      description: description || '',
      reportedAt: new Date()
    };

    if (existingIndex >= 0) {
      quiz.reports[existingIndex] = reportPayload;
    } else {
      quiz.reports.push(reportPayload);
    }

    quiz.reportCount = quiz.reports.length;
    if (quiz.reportCount > QUIZ_REPORT_THRESHOLD) {
      quiz.moderationStatus = 'pending-review';
    }

    await quiz.save();

    const populatedQuiz = await populateQuiz(Quiz.findById(req.params.id));
    return res.status(200).json({
      success: true,
      message: quiz.reportCount > QUIZ_REPORT_THRESHOLD
        ? 'Quiz reported and hidden pending admin review'
        : 'Quiz reported successfully',
      quiz: serializeQuiz(populatedQuiz, req.user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report quiz', error: error.message });
  }
};
