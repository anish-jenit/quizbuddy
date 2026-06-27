import express from 'express';
import {
	register,
	login,
	getCurrentUser,
	updateProfile,
	changePassword,
	resetTeacherPassword
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-teacher-password', resetTeacherPassword);
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

export default router;
