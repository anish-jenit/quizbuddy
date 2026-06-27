import express from 'express';
import {
  startQuiz,
  submitAnswer,
  completeQuiz,
  getQuizHistory,
  getLeaderboard
} from '../controllers/responseController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/start', authenticate, startQuiz);
router.post('/submit-answer', authenticate, submitAnswer);
router.put('/:responseId/complete', authenticate, completeQuiz);
router.get('/history/:quizId', authenticate, getQuizHistory);
router.get('/leaderboard', authenticate, getLeaderboard);

export default router;
