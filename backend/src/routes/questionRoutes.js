import express from 'express';
import {
  addQuestion,
  getQuestionsByQuiz,
  updateQuestion,
  deleteQuestion,
  reportQuestion
} from '../controllers/questionController.js';
import { authenticate, mentorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/:quizId/questions', authenticate, mentorOrAdmin, addQuestion);
router.get('/:quizId/questions', authenticate, getQuestionsByQuiz);
router.put('/:id', authenticate, mentorOrAdmin, updateQuestion);
router.delete('/:id', authenticate, mentorOrAdmin, deleteQuestion);
router.post('/:id/report', authenticate, reportQuestion);

export default router;
