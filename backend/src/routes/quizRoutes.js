import express from 'express';
import {
  createQuiz,
  getQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  reactToQuiz,
  reportQuiz
} from '../controllers/quizController.js';
import { authenticate, mentorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, mentorOrAdmin, createQuiz);
router.get('/', authenticate, getQuizzes);
router.get('/:id', authenticate, getQuizById);
router.put('/:id', authenticate, mentorOrAdmin, updateQuiz);
router.delete('/:id', authenticate, mentorOrAdmin, deleteQuiz);
router.put('/:id/publish', authenticate, mentorOrAdmin, publishQuiz);
router.put('/:id/reaction', authenticate, reactToQuiz);
router.post('/:id/report', authenticate, reportQuiz);

export default router;
