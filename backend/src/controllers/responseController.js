import QuizResponse from '../models/QuizResponse.js';
import Quiz from '../models/Quiz.js';
import Question from '../models/Question.js';
import Leaderboard from '../models/Leaderboard.js';
import Group from '../models/Group.js';

export const startQuiz = async (req, res) => {
  try {
    const { quizId, isGroupAttempt, groupId } = req.body;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (!quiz.isPublished) {
      return res.status(400).json({ message: 'Quiz is not published yet' });
    }

    if (!quiz.isActive || quiz.moderationStatus !== 'approved') {
      return res.status(403).json({ message: 'This quiz is temporarily unavailable while under admin review' });
    }

    if (quiz.group) {
      const group = await Group.findById(quiz.group);
      if (group && group.quizVisibility !== 'public') {
        const uid = req.user._id.toString();
        const isMember =
          group.createdBy.toString() === uid ||
          group.mentors.some((id) => id.toString() === uid) ||
          group.students.some((id) => id.toString() === uid);
        if (!isMember) {
          return res.status(403).json({
            message: 'You must join this group first to attempt this quiz',
            requiresGroupJoin: true,
            groupId: quiz.group
          });
        }
      }
    }

    const quizResponse = new QuizResponse({
      quiz: quizId,
      student: req.user._id,
      group: groupId,
      isGroupAttempt,
      status: 'in-progress'
    });

    await quizResponse.save();

    const questions = await Question.find({ quiz: quizId }).select('-correctAnswer -options.isCorrect');

    res.status(201).json({
      success: true,
      message: 'Quiz started',
      quizResponse: {
        id: quizResponse._id,
        quizId,
        totalQuestions: questions.length,
        timePerQuestion: quiz.timePerQuestion
      },
      questions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start quiz', error: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { responseId, questionId, selectedOption, selectedAnswer, timeSpent } = req.body;

    const quizResponse = await QuizResponse.findById(responseId);

    if (!quizResponse) {
      return res.status(404).json({ message: 'Quiz response not found' });
    }

    if (quizResponse.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to submit answers for this response' });
    }

    if (quizResponse.status !== 'in-progress') {
      return res.status(400).json({ message: 'Quiz is not in progress' });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    if (question.quiz.toString() !== quizResponse.quiz.toString()) {
      return res.status(400).json({ message: 'Question does not belong to this quiz response' });
    }

    const alreadyAnswered = quizResponse.answers.some(
      (answer) => answer.questionId.toString() === questionId
    );

    if (alreadyAnswered) {
      return res.status(400).json({ message: 'Question already answered' });
    }

    let isCorrect = false;

    if (question.questionType === 'multiple-choice') {
      const correctOption = question.options.find(opt => opt.isCorrect);
      isCorrect = correctOption && correctOption.text === selectedOption;
    } else if (question.questionType === 'true-false') {
      isCorrect = selectedAnswer === question.correctAnswer;
    } else if (question.questionType === 'short-answer') {
      const normalizedSelected = (selectedAnswer || '').toLowerCase().trim();
      const normalizedCorrect = (question.correctAnswer || '').toLowerCase().trim();
      isCorrect = normalizedSelected === normalizedCorrect;
    }

    quizResponse.answers.push({
      questionId,
      selectedOption,
      selectedAnswer,
      isCorrect,
      timeSpent
    });

    await quizResponse.save();

    res.status(200).json({
      success: true,
      message: 'Answer submitted',
      isCorrect
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit answer', error: error.message });
  }
};

export const completeQuiz = async (req, res) => {
  try {
    const { responseId } = req.params;

    const quizResponse = await QuizResponse.findById(responseId);

    if (!quizResponse) {
      return res.status(404).json({ message: 'Quiz response not found' });
    }

    if (quizResponse.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to complete this quiz response' });
    }

    if (quizResponse.status !== 'in-progress') {
      return res.status(400).json({ message: 'Quiz is already completed or abandoned' });
    }

    if (quizResponse.answers.length === 0) {
      return res.status(400).json({ message: 'Cannot complete quiz without answering at least one question' });
    }

    const correctAnswers = quizResponse.answers.filter(a => a.isCorrect).length;
    const totalScore = correctAnswers * 10;
    const percentageScore = (correctAnswers / quizResponse.answers.length) * 100;
    const duration = Math.floor((Date.now() - quizResponse.startedAt) / 1000);

    quizResponse.totalQuestions = quizResponse.answers.length;
    quizResponse.correctAnswers = correctAnswers;
    quizResponse.totalScore = totalScore;
    quizResponse.percentageScore = percentageScore;
    quizResponse.duration = duration;
    quizResponse.completedAt = new Date();
    quizResponse.status = 'completed';

    await quizResponse.save();

    // Update leaderboard
    await updateLeaderboard(quizResponse.quiz, quizResponse.student, quizResponse.group);

    res.status(200).json({
      success: true,
      message: 'Quiz completed',
      result: {
        totalScore,
        percentageScore,
        correctAnswers,
        totalQuestions: quizResponse.answers.length,
        duration
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete quiz', error: error.message });
  }
};

const updateLeaderboard = async (quizId, studentId, groupId) => {
  try {
    const responses = await QuizResponse.find({
      quiz: quizId,
      student: studentId,
      status: 'completed',
      ...(groupId && { group: groupId })
    });

    const totalScore = responses.reduce((sum, r) => sum + r.totalScore, 0);
    const averageScore = totalScore / responses.length;

    let leaderboard = await Leaderboard.findOne({
      quiz: quizId,
      ...(groupId && { group: groupId }),
      period: 'all-time'
    });

    if (!leaderboard) {
      leaderboard = new Leaderboard({
        quiz: quizId,
        group: groupId,
        period: 'all-time',
        entries: []
      });
    }

    const entryIndex = leaderboard.entries.findIndex(
      e => e.student.toString() === studentId.toString()
    );

    if (entryIndex > -1) {
      leaderboard.entries[entryIndex].totalScore = totalScore;
      leaderboard.entries[entryIndex].averageScore = averageScore;
      leaderboard.entries[entryIndex].attemptCount = responses.length;
      leaderboard.entries[entryIndex].lastAttemptDate = new Date();
    } else {
      leaderboard.entries.push({
        student: studentId,
        totalScore,
        averageScore,
        attemptCount: responses.length,
        lastAttemptDate: new Date()
      });
    }

    // Sort and assign ranks
    leaderboard.entries.sort((a, b) => b.averageScore - a.averageScore);
    leaderboard.entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    await leaderboard.save();
  } catch (error) {
    console.error('Failed to update leaderboard:', error);
  }
};

export const getQuizHistory = async (req, res) => {
  try {
    const { quizId } = req.params;

    const history = await QuizResponse.find({
      quiz: quizId,
      student: req.user._id,
      status: 'completed'
    }).sort({ completedAt: -1 });

    res.status(200).json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const { quizId, groupId, period } = req.query;

    if (!quizId) {
      return res.status(400).json({ message: 'quizId is required' });
    }

    const query = { quiz: quizId, period: period || 'all-time' };
    if (groupId) query.group = groupId;

    const leaderboard = await Leaderboard.findOne(query).populate('entries.student', 'firstName lastName nickname email');

    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found' });
    }

    res.status(200).json({
      success: true,
      leaderboard: leaderboard.entries
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
};
