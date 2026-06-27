import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';

export const addQuestion = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { questionText, questionType, options, correctAnswer, explanation, difficulty } = req.body;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to add questions to this quiz' });
    }

    const questionCount = await Question.countDocuments({ quiz: quizId });

    if (questionCount >= 10) {
      return res.status(400).json({ message: 'Quiz cannot have more than 10 questions' });
    }

    const question = new Question({
      quiz: quizId,
      questionText,
      questionType,
      options,
      correctAnswer,
      explanation,
      difficulty: difficulty || 'medium'
    });

    await question.save();
    await Quiz.findByIdAndUpdate(quizId, { $push: { questions: question._id } });

    res.status(201).json({
      success: true,
      message: 'Question added successfully',
      question
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add question', error: error.message });
  }
};

export const getQuestionsByQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const questions = await Question.find({ quiz: quizId });

    if (questions.length === 0) {
      return res.status(404).json({ message: 'No questions found for this quiz' });
    }

    res.status(200).json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch questions', error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const quiz = await Quiz.findById(question.quiz);

    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this question' });
    }

    const updatedQuestion = await Question.findByIdAndUpdate(id, req.body, { new: true });

    res.status(200).json({
      success: true,
      message: 'Question updated successfully',
      question: updatedQuestion
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update question', error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const quiz = await Quiz.findById(question.quiz);

    if (quiz.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this question' });
    }

    await Question.findByIdAndDelete(id);
    await Quiz.findByIdAndUpdate(question.quiz, { $pull: { questions: id } });

    res.status(200).json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete question', error: error.message });
  }
};

export const reportQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    question.reports.push({
      reportedBy: req.user._id,
      reason,
      description
    });

    if (question.reports.length > 0) {
      question.isReported = true;
    }

    await question.save();

    res.status(200).json({
      success: true,
      message: 'Question reported successfully',
      question
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to report question', error: error.message });
  }
};
