import express from 'express';
import {
  createGroup,
  getGroupById,
  joinGroup,
  getMyGroups,
  addMentor,
  removeMentor,
  leaveGroup,
  getPendingMentors,
  reviewMentorRequest,
  addStudentByEmail,
  removeStudent
} from '../controllers/groupController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticate, createGroup);
router.get('/:id', authenticate, getGroupById);
router.post('/join', authenticate, joinGroup);
router.get('/', authenticate, getMyGroups);
router.post('/mentor/add', authenticate, addMentor);
router.post('/mentor/remove', authenticate, removeMentor);
router.post('/leave', authenticate, leaveGroup);
router.get('/:id/pending-mentors', authenticate, getPendingMentors);
router.put('/:id/review-mentor', authenticate, reviewMentorRequest);
router.post('/:id/add-student', authenticate, addStudentByEmail);
router.post('/:id/remove-student', authenticate, removeStudent);

export default router;
