import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/database.js';
import demoRouter from './demo/demoRouter.js';

import authRoutes from './routes/authRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Connect DB only if not demo
if (!DEMO_MODE) {
  connectDB();
}

// Routes
if (DEMO_MODE) {
  app.use('/api', demoRouter);
} else {
  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/responses', responseRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/admin', adminRoutes);

  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Server is running' });
  });
}

// Serve React build
app.use(express.static(path.join(process.cwd(), 'public')));

// React fallback (MUST be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});