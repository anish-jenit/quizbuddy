import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
// Explicit DEMO_MODE wins. With no database configured, fall back to the
// in-memory demo so a fresh hosted deployment remains usable.
const DEMO_MODE = process.env.DEMO_MODE === 'true' ||
  (process.env.DEMO_MODE !== 'false' && !process.env.MONGODB_URI);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');

console.log('===================================');
console.log(`Demo Mode: ${DEMO_MODE}`);
console.log(`Port: ${PORT}`);
console.log('===================================');

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Health endpoint (available in both modes)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    demoMode: DEMO_MODE
  });
});

// Demo Mode
if (DEMO_MODE) {

  console.log('Running in DEMO MODE');

  app.use('/api', demoRouter);

} else {

  console.log('Connecting to database...');

  connectDB();

  app.use('/api/auth', authRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/questions', questionRoutes);
  app.use('/api/responses', responseRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/admin', adminRoutes);

}

// Serve React build
app.use(express.static(PUBLIC_DIR));

// React fallback
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
