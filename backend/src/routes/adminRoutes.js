import express from 'express';
import {
  getAllUsers,
  updateUserRole,
  getReportedQuestions,
  resolveQuestionReport,
  getDashboardStats,
  getPendingTeacherRequests,
  getReviewedTeacherRequests,
  reviewTeacherRequest,
  getPendingMentorRemovals,
  reviewMentorRemoval,
  getReportedQuizzes,
  reviewQuizReport
} from '../controllers/adminController.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/users', authenticate, adminOnly, getAllUsers);
router.put('/users/role', authenticate, adminOnly, updateUserRole);
router.get('/teachers/pending', authenticate, adminOnly, getPendingTeacherRequests);
router.get('/teachers/reviewed', authenticate, adminOnly, getReviewedTeacherRequests);
router.put('/teachers/review', authenticate, adminOnly, reviewTeacherRequest);
router.get('/questions/reported', authenticate, adminOnly, getReportedQuestions);
router.put('/questions/report/resolve', authenticate, adminOnly, resolveQuestionReport);
router.get('/quizzes/reported', authenticate, adminOnly, getReportedQuizzes);
router.put('/quizzes/report/review', authenticate, adminOnly, reviewQuizReport);
router.get('/stats', authenticate, adminOnly, getDashboardStats);
router.get('/mentor-removals/pending', authenticate, adminOnly, getPendingMentorRemovals);
router.put('/mentor-removals/review', authenticate, adminOnly, reviewMentorRemoval);

export default router;
