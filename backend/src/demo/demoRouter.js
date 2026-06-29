import express from 'express';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { parseQuizCsv, quizCsvTemplate } from './csvQuizImporter.js';
import { additionalQuizSets } from './additionalQuizSets.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const QUIZ_REPORT_THRESHOLD = 5;
const CORE_GENRES = ['Tamil', 'English', 'Math', 'Science', 'History'];

const nowIso = () => new Date().toISOString();

const demoMentorEmail = process.env.DEMO_MENTOR_EMAIL || 'mock-mentor@example.com';
const demoMentorPassword = process.env.DEMO_MENTOR_PASSWORD || 'MockPass@123';

const state = {
  users: [],
  quizzes: [],
  questions: [],
  responses: [],
  groups: [],
  leaderboards: [],
  challenges: []
};

const demoSeedUsers = [
  {
    email: 'teacher1@example.com',
    firstName: 'Teacher',
    lastName: 'One',
    password: 'teacher1',
    role: 'mentor'
  },
  {
    email: 'teacher2@example.com',
    firstName: 'Teacher',
    lastName: 'Two',
    password: 'teacher2',
    role: 'mentor'
  },
  {
    email: 'teacher3@example.com',
    firstName: 'Teacher',
    lastName: 'Three',
    password: 'teacher3',
    role: 'mentor'
  },
  {
    email: 'student1@example.com',
    firstName: 'Student',
    lastName: 'One',
    password: 'student1',
    role: 'student'
  },
  {
    email: 'student2@example.com',
    firstName: 'Student',
    lastName: 'Two',
    password: 'student2',
    role: 'student'
  },
  {
    email: 'student3@example.com',
    firstName: 'Student',
    lastName: 'Three',
    password: 'student3',
    role: 'student'
  }
];

const baseUsers = [
  {
    id: randomUUID(),
    email: demoMentorEmail,
    firstName: 'Mock',
    lastName: 'Mentor',
    password: demoMentorPassword,
    role: 'mentor',
    approvalStatus: 'approved',
    requestedRole: null,
    isEmailVerified: true,
    groups: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  {
    id: randomUUID(),
    email: 'admin@example.com',
    firstName: 'Demo',
    lastName: 'Admin',
    password: 'Admin@123',
    role: 'admin',
    approvalStatus: 'approved',
    requestedRole: null,
    isEmailVerified: true,
    groups: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  },
  ...demoSeedUsers.map((user) => ({
    id: randomUUID(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    password: user.password,
    role: user.role,
    approvalStatus: 'approved',
    requestedRole: null,
    isEmailVerified: true,
    groups: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  }))
];

state.users.push(...baseUsers);

const importQuizSpecs = (quizSpecs, createdBy) => {
  let publicGroup = state.groups.find((group) => group.name === 'Public Quiz Library');
  if (!publicGroup) {
    publicGroup = {
      id: randomUUID(),
      _id: null,
      name: 'Public Quiz Library',
      description: 'Public quizzes available to every player',
      category: 'General',
      code: 'PUBLIC01',
      quizVisibility: 'public',
      createdBy,
      mentors: [],
      students: [],
      pendingMentors: [],
      pendingMentorRemovals: [],
      quizzes: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    publicGroup._id = publicGroup.id;
    state.groups.push(publicGroup);
  }

  let questionCount = 0;
  quizSpecs.forEach((spec) => {
    const existing = state.quizzes.find((quiz) => quiz.title.toLowerCase() === spec.title.toLowerCase());
    if (existing) {
      state.questions = state.questions.filter((question) => question.quiz !== existing.id);
      state.quizzes = state.quizzes.filter((quiz) => quiz.id !== existing.id);
      publicGroup.quizzes = publicGroup.quizzes.filter((id) => id !== existing.id);
    }

    const quiz = {
      id: randomUUID(),
      _id: null,
      title: spec.title,
      description: spec.description,
      category: ['Tamil', 'English', 'Math', 'Science', 'History'].includes(spec.category) ? spec.category : 'Tamil',
      difficulty: ['easy', 'medium', 'hard'].includes(spec.difficulty) ? spec.difficulty : 'medium',
      createdBy,
      group: publicGroup.id,
      questions: [],
      timePerQuestion: spec.timePerQuestion,
      reactions: [],
      reports: [],
      likeCount: 0,
      dislikeCount: 0,
      reportCount: 0,
      moderationStatus: 'approved',
      isPublished: true,
      isActive: true,
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    quiz._id = quiz.id;

    spec.questions.forEach((item) => {
      const question = {
        id: randomUUID(),
        _id: null,
        quiz: quiz.id,
        questionText: item.questionText,
        questionType: 'multiple-choice',
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        difficulty: item.difficulty,
        isReported: false,
        reports: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      question._id = question.id;
      state.questions.push(question);
      quiz.questions.push(question.id);
      questionCount += 1;
    });

    state.quizzes.push(quiz);
    publicGroup.quizzes.push(quiz.id);
  });

  publicGroup.updatedAt = nowIso();
  return { quizCount: quizSpecs.length, questionCount };
};

const adminSeedUser = baseUsers.find((user) => user.role === 'admin');
const defaultCsvPath = fileURLToPath(new URL('./default-quizzes.csv', import.meta.url));
importQuizSpecs(parseQuizCsv(readFileSync(defaultCsvPath, 'utf8')), adminSeedUser.id);
importQuizSpecs(additionalQuizSets, adminSeedUser.id);

const stripPassword = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const signToken = (user) =>
  jwt.sign({
    id: user.id,
    role: user.role,
    sessionUser: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname || '',
      isGuest: !!user.isGuest
    }
  }, JWT_SECRET, { expiresIn: JWT_EXPIRE });

const getUserById = (id) => state.users.find((user) => user.id === id);
const getGroupById = (id) => state.groups.find((group) => group.id === id);
const getChallengeByCode = (code) => state.challenges.find(
  (challenge) => challenge.code === String(code || '').trim().toUpperCase()
);

const summarizeUser = (user) => (
  user
    ? {
        id: user.id,
        _id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname || '',
        email: user.email
      }
    : null
);

const isUserInGroup = (group, userId) => (
  !!group && (
    group.createdBy === userId ||
    (group.mentors || []).includes(userId) ||
    (group.students || []).includes(userId)
  )
);

const canStudentAttemptQuiz = (quiz, userId) => {
  if (!quiz.isPublished || !quiz.isActive || quiz.moderationStatus !== 'approved') return false;
  const group = quiz.group ? getGroupById(quiz.group) : null;
  if (!group) return true;
  return (group.quizVisibility || 'private') === 'public' || isUserInGroup(group, userId);
};

const serializeQuiz = (quiz, user) => {
  const group = quiz.group ? getGroupById(quiz.group) : null;
  const userId = user?.id;
  const reaction = (quiz.reactions || []).find((item) => item.user === userId);

  return {
    ...quiz,
    createdBy: summarizeUser(getUserById(quiz.createdBy)) || quiz.createdBy,
    group: group
      ? {
          id: group.id,
          _id: group.id,
          name: group.name,
          code: group.code,
          quizVisibility: group.quizVisibility || 'private',
          createdBy: group.createdBy,
          mentors: group.mentors || [],
          students: group.students || []
        }
      : null,
    visibility: group?.quizVisibility || 'private',
    currentUserReaction: reaction?.value || null,
    canAttemptWithoutGroup: !group || (group.quizVisibility || 'private') === 'public' || isUserInGroup(group, userId),
    isUnderReview: quiz.moderationStatus !== 'approved'
  };
};

const sortQuizzes = (quizzes, sortBy) => {
  const items = [...quizzes];
  if (sortBy === 'title') {
    return items.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === 'newest') {
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (sortBy === 'mostDisliked') {
    return items.sort((a, b) => (b.dislikeCount || 0) - (a.dislikeCount || 0));
  }
  return items.sort((a, b) => {
    const likeDiff = (b.likeCount || 0) - (a.likeCount || 0);
    if (likeDiff !== 0) return likeDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
};

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    let user = getUserById(decoded.id);

    // Demo hosting can recycle the Node process while a browser still holds a
    // valid JWT. Restore the trusted session identity embedded in newer tokens
    // so the player is not rejected merely because in-memory users were reset.
    if (!user && decoded.sessionUser?.email) {
      user = {
        id: decoded.id,
        email: decoded.sessionUser.email,
        firstName: decoded.sessionUser.firstName || 'Player',
        lastName: decoded.sessionUser.lastName || '',
        nickname: decoded.sessionUser.nickname || '',
        password: null,
        role: decoded.role || 'student',
        isGuest: !!decoded.sessionUser.isGuest,
        approvalStatus: 'approved',
        requestedRole: null,
        isEmailVerified: !decoded.sessionUser.isGuest,
        groups: [],
        createdAt: nowIso(),
        updatedAt: nowIso()
      };
      state.users.push(user);
    }

    if (!user) return res.status(401).json({ message: 'Invalid token user' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const requireRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }
  return next();
};

const sanitizeQuestionForAttempt = (question) => ({
  id: question.id,
  _id: question.id,
  quiz: question.quiz,
  questionText: question.questionText,
  questionType: question.questionType,
  options: (question.options || []).map((opt) => ({ text: opt.text })),
  explanation: question.explanation,
  difficulty: question.difficulty
});

const findQuizQuestions = (quizId) => state.questions.filter((q) => q.quiz === quizId);

const serializeChallenge = (challenge) => {
  const quiz = state.quizzes.find((item) => item.id === challenge.quiz);
  const participants = challenge.participants.map((participant) => {
    const user = getUserById(participant.user);
    return {
      nickname: user?.nickname || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Guest Player',
      isCreator: participant.user === challenge.createdBy,
      status: participant.status,
      score: participant.score,
      percentageScore: participant.percentageScore,
      duration: participant.duration,
      finishedAt: participant.finishedAt
    };
  });
  const finished = participants.filter((participant) => participant.status === 'completed');
  let winner = null;
  if (finished.length === 2) {
    const ranked = [...finished].sort((a, b) => b.percentageScore - a.percentageScore || a.duration - b.duration);
    winner = ranked[0].percentageScore === ranked[1].percentageScore && ranked[0].duration === ranked[1].duration
      ? { isTie: true }
      : { nickname: ranked[0].nickname, isTie: false };
  }
  return {
    code: challenge.code,
    status: finished.length === 2 ? 'completed' : participants.length === 2 ? 'accepted' : 'pending',
    quiz: quiz ? { id: quiz.id, _id: quiz.id, title: quiz.title, category: quiz.category, difficulty: quiz.difficulty } : null,
    participants,
    winner,
    expiresAt: challenge.expiresAt
  };
};

const updateLeaderboard = (quizId, studentId, groupId) => {
  const completedResponses = state.responses.filter(
    (response) =>
      response.quiz === quizId &&
      response.student === studentId &&
      response.status === 'completed' &&
      ((!groupId && !response.group) || response.group === groupId)
  );

  if (!completedResponses.length) return;

  const totalScore = completedResponses.reduce((sum, response) => sum + response.totalScore, 0);
  const averageScore = totalScore / completedResponses.length;

  const period = 'all-time';
  let leaderboard = state.leaderboards.find(
    (item) => item.quiz === quizId && item.period === period && item.group === (groupId || null)
  );

  if (!leaderboard) {
    leaderboard = {
      id: randomUUID(),
      quiz: quizId,
      group: groupId || null,
      period,
      entries: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    state.leaderboards.push(leaderboard);
  }

  const existing = leaderboard.entries.find((entry) => entry.student === studentId);
  if (existing) {
    existing.totalScore = totalScore;
    existing.averageScore = averageScore;
    existing.attemptCount = completedResponses.length;
    existing.lastAttemptDate = nowIso();
  } else {
    leaderboard.entries.push({
      id: randomUUID(),
      student: studentId,
      totalScore,
      averageScore,
      attemptCount: completedResponses.length,
      lastAttemptDate: nowIso(),
      rank: 0
    });
  }

  leaderboard.entries.sort((a, b) => b.averageScore - a.averageScore);
  leaderboard.entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });
  leaderboard.updatedAt = nowIso();
};

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running (demo mode)' });
});

router.post('/auth/register', (req, res) => {
  const { email, firstName, lastName, nickname, password, confirmPassword, registerAsTeacher } = req.body;

  if (!email || !firstName || !lastName || !password) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (state.users.some((user) => user.email === email.toLowerCase())) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    firstName,
    lastName,
    nickname: String(nickname || '').trim(),
    password,
    role: 'student',
    approvalStatus: registerAsTeacher ? 'pending' : 'approved',
    requestedRole: registerAsTeacher ? 'mentor' : null,
    isEmailVerified: true,
    groups: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  state.users.push(user);

  return res.status(201).json({
    success: true,
    message: registerAsTeacher
      ? 'Teacher registration submitted for admin approval'
      : 'Registration successful',
    token: signToken(user),
    user: stripPassword(user)
  });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = state.users.find((item) => item.email === String(email || '').toLowerCase());

  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  if (user.approvalStatus === 'pending' && user.requestedRole === 'mentor') {
    return res.status(403).json({ message: 'Teacher account pending admin approval' });
  }

  if (user.approvalStatus === 'rejected' && user.requestedRole === 'mentor') {
    return res.status(403).json({ message: 'Teacher request was rejected by admin' });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    token: signToken(user),
    user: stripPassword(user)
  });
});

router.post('/auth/guest', (req, res) => {
  const name = String(req.body?.name || '').trim().replace(/\s+/g, ' ');

  if (name.length < 2 || name.length > 40) {
    return res.status(400).json({ message: 'Please enter a name between 2 and 40 characters' });
  }

  const [firstName, ...lastNameParts] = name.split(' ');
  const user = {
    id: randomUUID(),
    email: `guest-${randomUUID()}@demo.local`,
    firstName,
    lastName: lastNameParts.join(' '),
    nickname: name,
    password: null,
    role: 'student',
    isGuest: true,
    approvalStatus: 'approved',
    requestedRole: null,
    isEmailVerified: false,
    groups: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  state.users.push(user);

  return res.status(201).json({
    success: true,
    message: 'Guest session created',
    token: signToken(user),
    user: stripPassword(user)
  });
});

router.post('/auth/reset-teacher-password', (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const user = state.users.find((item) => item.email === String(email).toLowerCase());
  if (!user) {
    return res.status(404).json({ message: 'Teacher account not found' });
  }

  const isTeacherAccount = user.role === 'mentor' || user.role === 'admin' || user.requestedRole === 'mentor';
  if (!isTeacherAccount) {
    return res.status(403).json({ message: 'This reset flow is only available for teacher accounts' });
  }

  user.password = newPassword;
  user.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: 'Password reset successful. You can now login with your new password.'
  });
});

router.get('/auth/me', auth, (req, res) => {
  return res.status(200).json({ success: true, user: stripPassword(req.user) });
});

router.put('/auth/profile', auth, (req, res) => {
  const { firstName, lastName } = req.body;
  req.user.firstName = firstName || req.user.firstName;
  req.user.lastName = lastName || req.user.lastName;
  req.user.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: stripPassword(req.user)
  });
});

router.put('/auth/change-password', auth, (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (req.user.password !== currentPassword) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: 'New passwords do not match' });
  }

  req.user.password = newPassword;
  req.user.updatedAt = nowIso();

  return res.status(200).json({ success: true, message: 'Password changed successfully' });
});

router.post('/quizzes', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const { title, description, category, difficulty, groupId, timePerQuestion } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  let group = null;
  if (req.user.role === 'mentor') {
    if (!groupId) {
      return res.status(400).json({ message: 'Mentors must select a group for the quiz' });
    }

    group = state.groups.find((item) => item.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isMentorInGroup = group.createdBy === req.user.id || group.mentors.includes(req.user.id);
    if (!isMentorInGroup) {
      return res.status(403).json({ message: 'You can only create quizzes for groups you mentor' });
    }
  } else if (groupId) {
    group = state.groups.find((item) => item.id === groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
  }

  if (group?.quizVisibility === 'public' && !CORE_GENRES.includes(category)) {
    return res.status(400).json({ message: 'Public quizzes must have one of the five core genres' });
  }
  if (category && !CORE_GENRES.includes(category)) {
    return res.status(400).json({ message: 'Invalid quiz genre' });
  }

  const quiz = {
    id: randomUUID(),
    _id: null,
    title,
    description: description || '',
    category: category || '',
    difficulty: difficulty || 'medium',
    createdBy: req.user.id,
    group: groupId || null,
    questions: [],
    timePerQuestion: Number(timePerQuestion || 30),
    reactions: [],
    reports: [],
    likeCount: 0,
    dislikeCount: 0,
    reportCount: 0,
    moderationStatus: 'approved',
    isPublished: false,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  quiz._id = quiz.id;

  state.quizzes.push(quiz);

  if (group && !group.quizzes.includes(quiz.id)) {
    group.quizzes.push(quiz.id);
    group.updatedAt = nowIso();
  }

  return res.status(201).json({
    success: true,
    message: 'Quiz created successfully',
    quiz
  });
});

router.get('/quizzes', auth, (req, res) => {
  const { groupId, category, isPublished, sortBy } = req.query;

  let quizzes = [...state.quizzes];

  if (groupId) quizzes = quizzes.filter((quiz) => quiz.group === groupId);
  if (category) quizzes = quizzes.filter((quiz) => quiz.category === category);
  if (isPublished !== undefined) {
    quizzes = quizzes.filter((quiz) => quiz.isPublished === (isPublished === 'true'));
  }

  let serialized = quizzes.map((quiz) => serializeQuiz(quiz, req.user));

  if (req.user.role === 'student') {
    serialized = serialized.filter((quiz) => canStudentAttemptQuiz(quiz, req.user.id));
  }

  serialized = sortQuizzes(serialized, sortBy || (req.user.role === 'student' ? 'mostLiked' : 'newest'));

  return res.status(200).json({ success: true, quizzes: serialized });
});

router.get('/quizzes/:id', auth, (req, res) => {
  const quiz = state.quizzes.find((item) => item.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (req.user.role === 'student') {
    if (!quiz.isPublished || !quiz.isActive) {
      return res.status(403).json({ message: 'This quiz is not available' });
    }
    if (quiz.moderationStatus !== 'approved') {
      return res.status(403).json({ message: 'This quiz is temporarily unavailable while under admin review' });
    }
  }

  return res.status(200).json({ success: true, quiz: serializeQuiz(quiz, req.user) });
});

router.put('/quizzes/:id', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const quiz = state.quizzes.find((item) => item.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (quiz.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized to update this quiz' });
  }

  const group = quiz.group ? getGroupById(quiz.group) : null;
  const nextGenre = req.body.category !== undefined ? req.body.category : quiz.category;
  if (group?.quizVisibility === 'public' && !CORE_GENRES.includes(nextGenre)) {
    return res.status(400).json({ message: 'Public quizzes must have one of the five core genres' });
  }

  Object.assign(quiz, req.body, { updatedAt: nowIso() });

  return res.status(200).json({
    success: true,
    message: 'Quiz updated successfully',
    quiz
  });
});

router.delete('/quizzes/:id', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const quizIdx = state.quizzes.findIndex((item) => item.id === req.params.id);
  if (quizIdx === -1) return res.status(404).json({ message: 'Quiz not found' });

  const quiz = state.quizzes[quizIdx];
  if (quiz.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized to delete this quiz' });
  }

  state.quizzes.splice(quizIdx, 1);
  state.questions = state.questions.filter((question) => question.quiz !== req.params.id);

  return res.status(200).json({ success: true, message: 'Quiz deleted successfully' });
});

router.put('/quizzes/:id/publish', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const quiz = state.quizzes.find((item) => item.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  const questionCount = findQuizQuestions(quiz.id).length;
  if (questionCount === 0) return res.status(400).json({ message: 'Quiz must have at least one question' });
  if (questionCount > 10) return res.status(400).json({ message: 'Quiz cannot have more than 10 questions' });

  const group = quiz.group ? getGroupById(quiz.group) : null;
  if (group?.quizVisibility === 'public' && !CORE_GENRES.includes(quiz.category)) {
    return res.status(400).json({ message: 'Choose a core genre before publishing this public quiz' });
  }

  quiz.isPublished = true;
  quiz.updatedAt = nowIso();

  return res.status(200).json({ success: true, message: 'Quiz published successfully', quiz });
});

router.put('/quizzes/:id/reaction', auth, (req, res) => {
  const { value } = req.body;
  if (!['like', 'dislike', 'clear'].includes(value)) {
    return res.status(400).json({ message: 'Invalid reaction value' });
  }

  const quiz = state.quizzes.find((item) => item.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  quiz.reactions = (quiz.reactions || []).filter((item) => item.user !== req.user.id);
  if (value !== 'clear') {
    quiz.reactions.push({ user: req.user.id, value, reactedAt: nowIso() });
  }

  quiz.likeCount = quiz.reactions.filter((item) => item.value === 'like').length;
  quiz.dislikeCount = quiz.reactions.filter((item) => item.value === 'dislike').length;
  quiz.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: value === 'clear' ? 'Reaction removed' : 'Reaction saved',
    quiz: serializeQuiz(quiz, req.user)
  });
});

router.post('/quizzes/:id/report', auth, (req, res) => {
  const { reason, description } = req.body;
  if (!reason) return res.status(400).json({ message: 'Report reason is required' });

  const quiz = state.quizzes.find((item) => item.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  const reports = quiz.reports || [];
  const existing = reports.find((item) => item.reportedBy === req.user.id);
  if (existing) {
    existing.reason = reason;
    existing.description = description || '';
    existing.reportedAt = nowIso();
  } else {
    reports.push({
      reportedBy: req.user.id,
      reason,
      description: description || '',
      reportedAt: nowIso()
    });
  }

  quiz.reports = reports;
  quiz.reportCount = reports.length;
  if (quiz.reportCount > QUIZ_REPORT_THRESHOLD) {
    quiz.moderationStatus = 'pending-review';
  }
  quiz.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: quiz.reportCount > QUIZ_REPORT_THRESHOLD
      ? 'Quiz reported and hidden pending admin review'
      : 'Quiz reported successfully',
    quiz: serializeQuiz(quiz, req.user)
  });
});

router.post('/questions/:quizId/questions', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const quiz = state.quizzes.find((item) => item.id === req.params.quizId);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (quiz.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized to add questions to this quiz' });
  }

  const quizQuestionCount = findQuizQuestions(quiz.id).length;
  if (quizQuestionCount >= 10) {
    return res.status(400).json({ message: 'Quiz cannot have more than 10 questions' });
  }

  const { questionText, questionType, options, correctAnswer, explanation, difficulty } = req.body;

  const question = {
    id: randomUUID(),
    _id: null,
    quiz: quiz.id,
    questionText,
    questionType: questionType || 'multiple-choice',
    options: options || [],
    correctAnswer: correctAnswer || '',
    explanation: explanation || '',
    difficulty: difficulty || 'medium',
    isReported: false,
    reports: [],
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  question._id = question.id;

  state.questions.push(question);
  quiz.questions.push(question.id);

  return res.status(201).json({ success: true, message: 'Question added successfully', question });
});

router.get('/questions/:quizId/questions', auth, (req, res) => {
  const questions = findQuizQuestions(req.params.quizId);
  if (!questions.length) {
    return res.status(404).json({ message: 'No questions found for this quiz' });
  }

  return res.status(200).json({ success: true, questions });
});

router.put('/questions/:id', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const question = state.questions.find((item) => item.id === req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const quiz = state.quizzes.find((item) => item.id === question.quiz);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (quiz.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized to update this question' });
  }

  Object.assign(question, req.body, { updatedAt: nowIso() });

  return res.status(200).json({
    success: true,
    message: 'Question updated successfully',
    question
  });
});

router.delete('/questions/:id', auth, requireRoles('mentor', 'admin'), (req, res) => {
  const questionIndex = state.questions.findIndex((item) => item.id === req.params.id);
  if (questionIndex === -1) return res.status(404).json({ message: 'Question not found' });

  const question = state.questions[questionIndex];
  const quiz = state.quizzes.find((item) => item.id === question.quiz);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (quiz.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized to delete this question' });
  }

  state.questions.splice(questionIndex, 1);
  quiz.questions = quiz.questions.filter((qId) => qId !== question.id);

  return res.status(200).json({ success: true, message: 'Question deleted successfully' });
});

router.post('/questions/:id/report', auth, (req, res) => {
  const question = state.questions.find((item) => item.id === req.params.id);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  const { reason, description } = req.body;
  question.reports.push({
    reportedBy: req.user.id,
    reason,
    description,
    reportedAt: nowIso()
  });
  question.isReported = question.reports.length > 0;

  return res.status(200).json({ success: true, message: 'Question reported successfully', question });
});

router.post('/challenges', auth, (req, res) => {
  const quiz = state.quizzes.find((item) => item.id === req.body?.quizId);
  if (!quiz || !canStudentAttemptQuiz(quiz, req.user.id)) {
    return res.status(400).json({ message: 'Only an available public quiz can be challenged' });
  }

  let code;
  do {
    code = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  } while (getChallengeByCode(code));

  const challenge = {
    id: randomUUID(),
    code,
    quiz: quiz.id,
    createdBy: req.user.id,
    participants: [{ user: req.user.id, status: 'ready', score: null, percentageScore: null, duration: null, finishedAt: null }],
    createdAt: nowIso(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  state.challenges.push(challenge);
  return res.status(201).json({ success: true, message: 'Challenge created', challenge: serializeChallenge(challenge) });
});

router.get('/challenges/:code', (req, res) => {
  const challenge = getChallengeByCode(req.params.code);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found or expired' });
  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ message: 'This challenge has expired' });
  }
  return res.status(200).json({ success: true, challenge: serializeChallenge(challenge) });
});

router.post('/challenges/:code/accept', auth, (req, res) => {
  const challenge = getChallengeByCode(req.params.code);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found or expired' });
  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    return res.status(410).json({ message: 'This challenge has expired' });
  }

  const existing = challenge.participants.find((participant) => participant.user === req.user.id);
  if (!existing) {
    if (challenge.participants.length >= 2) return res.status(409).json({ message: 'This challenge already has two players' });
    challenge.participants.push({
      user: req.user.id,
      status: 'ready',
      score: null,
      percentageScore: null,
      duration: null,
      finishedAt: null
    });
  }
  return res.status(200).json({ success: true, message: 'Challenge accepted', challenge: serializeChallenge(challenge) });
});

router.post('/responses/start', auth, (req, res) => {
  const { quizId, isGroupAttempt, groupId, challengeCode } = req.body;
  const quiz = state.quizzes.find((item) => item.id === quizId);

  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });
  if (!quiz.isPublished) return res.status(400).json({ message: 'Quiz is not published yet' });
  if (!quiz.isActive || quiz.moderationStatus !== 'approved') {
    return res.status(403).json({ message: 'This quiz is temporarily unavailable while under admin review' });
  }

  if (quiz.group) {
    const group = state.groups.find((g) => g.id === quiz.group);
    if (group && (group.quizVisibility || 'private') !== 'public') {
      const uid = req.user.id;
      const isMember =
        group.createdBy === uid ||
        group.mentors.includes(uid) ||
        group.students.includes(uid);
      if (!isMember) {
        return res.status(403).json({
          message: 'You must join this group first to attempt this quiz',
          requiresGroupJoin: true,
          groupId: quiz.group
        });
      }
    }
  }

  let challenge = null;
  if (challengeCode) {
    challenge = getChallengeByCode(challengeCode);
    if (!challenge || challenge.quiz !== quizId) {
      return res.status(400).json({ message: 'Invalid challenge for this quiz' });
    }
    if (!challenge.participants.some((participant) => participant.user === req.user.id)) {
      return res.status(403).json({ message: 'Accept this challenge before starting the quiz' });
    }
    const participant = challenge.participants.find((item) => item.user === req.user.id);
    if (participant.status === 'completed') {
      return res.status(409).json({ message: 'You have already completed this challenge' });
    }
    participant.status = 'in-progress';
  }

  const response = {
    id: randomUUID(),
    _id: null,
    quiz: quizId,
    student: req.user.id,
    group: groupId || null,
    challenge: challenge?.id || null,
    isGroupAttempt: !!isGroupAttempt,
    answers: [],
    totalScore: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    percentageScore: 0,
    startedAt: nowIso(),
    completedAt: null,
    duration: 0,
    status: 'in-progress',
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  response._id = response.id;

  state.responses.push(response);

  const questions = findQuizQuestions(quizId).map(sanitizeQuestionForAttempt);

  return res.status(201).json({
    success: true,
    message: 'Quiz started',
    quizResponse: {
      id: response.id,
      quizId,
      totalQuestions: questions.length,
      timePerQuestion: quiz.timePerQuestion
    },
    questions
  });
});

router.post('/responses/submit-answer', auth, (req, res) => {
  const { responseId, questionId, selectedOption, selectedAnswer, timeSpent } = req.body;

  const response = state.responses.find((item) => item.id === responseId);
  if (!response) return res.status(404).json({ message: 'Quiz response not found' });

  if (response.student !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to submit answers for this response' });
  }

  if (response.status !== 'in-progress') {
    return res.status(400).json({ message: 'Quiz is not in progress' });
  }

  const question = state.questions.find((item) => item.id === questionId);
  if (!question) return res.status(404).json({ message: 'Question not found' });

  if (question.quiz !== response.quiz) {
    return res.status(400).json({ message: 'Question does not belong to this quiz response' });
  }

  if (response.answers.some((ans) => ans.questionId === questionId)) {
    return res.status(400).json({ message: 'Question already answered' });
  }

  let isCorrect = false;
  if (question.questionType === 'multiple-choice') {
    const correctOpt = (question.options || []).find((opt) => opt.isCorrect);
    isCorrect = !!correctOpt && correctOpt.text === selectedOption;
  } else if (question.questionType === 'true-false') {
    isCorrect = (selectedAnswer || '').toLowerCase() === String(question.correctAnswer || '').toLowerCase();
  } else {
    isCorrect = String(selectedAnswer || '').trim().toLowerCase() === String(question.correctAnswer || '').trim().toLowerCase();
  }

  response.answers.push({
    questionId,
    selectedOption,
    selectedAnswer,
    isCorrect,
    timeSpent: Number(timeSpent || 0)
  });
  response.updatedAt = nowIso();

  return res.status(200).json({ success: true, message: 'Answer submitted', isCorrect });
});

router.put('/responses/:responseId/complete', auth, (req, res) => {
  const response = state.responses.find((item) => item.id === req.params.responseId);
  if (!response) return res.status(404).json({ message: 'Quiz response not found' });

  if (response.student !== req.user.id) {
    return res.status(403).json({ message: 'Unauthorized to complete this quiz response' });
  }

  if (response.status !== 'in-progress') {
    return res.status(400).json({ message: 'Quiz is already completed or abandoned' });
  }

  if (!response.answers.length) {
    return res.status(400).json({ message: 'Cannot complete quiz without answering at least one question' });
  }

  const correctAnswers = response.answers.filter((answer) => answer.isCorrect).length;
  const totalScore = correctAnswers * 10;
  const percentageScore = (correctAnswers / response.answers.length) * 100;
  const duration = Math.floor((Date.now() - new Date(response.startedAt).getTime()) / 1000);

  response.correctAnswers = correctAnswers;
  response.totalQuestions = response.answers.length;
  response.totalScore = totalScore;
  response.percentageScore = percentageScore;
  response.duration = duration;
  response.completedAt = nowIso();
  response.status = 'completed';
  response.updatedAt = nowIso();

  updateLeaderboard(response.quiz, response.student, response.group);

  if (response.challenge) {
    const challenge = state.challenges.find((item) => item.id === response.challenge);
    const participant = challenge?.participants.find((item) => item.user === response.student);
    if (participant) {
      participant.status = 'completed';
      participant.score = totalScore;
      participant.percentageScore = percentageScore;
      participant.duration = duration;
      participant.finishedAt = nowIso();
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Quiz completed',
    result: {
      totalScore,
      percentageScore,
      correctAnswers,
      totalQuestions: response.answers.length,
      duration,
      challengeCode: response.challenge
        ? state.challenges.find((item) => item.id === response.challenge)?.code || null
        : null
    }
  });
});

router.get('/responses/history/:quizId', auth, (req, res) => {
  const history = state.responses
    .filter((item) => item.quiz === req.params.quizId && item.student === req.user.id && item.status === 'completed')
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  return res.status(200).json({ success: true, history });
});

router.get('/responses/leaderboard', auth, (req, res) => {
  const { quizId, groupId, period } = req.query;
  if (!quizId) return res.status(400).json({ message: 'quizId is required' });

  const leaderboard = state.leaderboards.find(
    (item) =>
      item.quiz === quizId &&
      item.period === (period || 'all-time') &&
      item.group === (groupId || null)
  );

  if (!leaderboard) return res.status(404).json({ message: 'Leaderboard not found' });

  const entries = leaderboard.entries.map((entry) => {
    const student = getUserById(entry.student);
    return {
      ...entry,
      _id: entry.id,
      student: student
        ? {
            _id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            nickname: student.nickname || '',
            email: student.email
          }
        : null
    };
  });

  return res.status(200).json({ success: true, leaderboard: entries });
});

router.post('/groups', auth, (req, res) => {
  const { name, description, category, quizVisibility } = req.body;
  if (!name) return res.status(400).json({ message: 'Group name is required' });

  const group = {
    id: randomUUID(),
    _id: null,
    name,
    description: description || '',
    code: Math.random().toString(36).slice(2, 10).toUpperCase(),
    createdBy: req.user.id,
    mentors: [req.user.id],
    students: [],
    pendingMentors: [],
    quizzes: [],
    category: category || 'Tamil',
    quizVisibility: quizVisibility === 'public' ? 'public' : 'private',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  group._id = group.id;

  state.groups.push(group);

  return res.status(201).json({
    success: true,
    message: 'Group created successfully',
    group: { id: group.id, name: group.name, code: group.code, description: group.description }
  });
});

router.get('/groups', auth, (req, res) => {
  const groups = state.groups.filter(
    (group) => group.createdBy === req.user.id || group.mentors.includes(req.user.id) || group.students.includes(req.user.id)
  );

  return res.status(200).json({ success: true, groups });
});

router.get('/groups/:id', auth, (req, res) => {
  const group = state.groups.find((item) => item.id === req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const populateUser = (uid) => {
    const u = getUserById(uid);
    return u ? { id: u.id, _id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email } : { id: uid, _id: uid };
  };

  const populated = {
    ...group,
    mentors: (group.mentors || []).map(populateUser),
    students: (group.students || []).map(populateUser),
    pendingMentors: (group.pendingMentors || []).map(populateUser),
    createdBy: populateUser(group.createdBy)
  };

  return res.status(200).json({ success: true, group: populated });
});

router.put('/groups/:id/visibility', auth, (req, res) => {
  const group = getGroupById(req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });
  if (group.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the group owner or admin can change visibility' });
  }

  const visibility = req.body.visibility === 'public' ? 'public' : 'private';
  if (visibility === 'public') {
    const missingGenre = (group.quizzes || [])
      .map((id) => state.quizzes.find((quiz) => quiz.id === id))
      .filter((quiz) => quiz && !CORE_GENRES.includes(quiz.category))
      .map((quiz) => quiz.title);
    if (missingGenre.length) {
      return res.status(400).json({ message: `Add a genre before making this group public: ${missingGenre.join(', ')}` });
    }
  }

  group.quizVisibility = visibility;
  group.updatedAt = nowIso();
  return res.status(200).json({ success: true, message: `Group is now ${visibility}`, group });
});

router.post('/groups/join', auth, (req, res) => {
  const { code } = req.body;
  const group = state.groups.find((item) => item.code === code);

  if (!group) return res.status(404).json({ message: 'Invalid group code' });

  const uid = req.user.id;
  const isMentor = req.user.role === 'mentor';

  if (isMentor) {
    if (group.mentors.includes(uid)) {
      return res.status(400).json({ message: 'You are already a mentor in this group' });
    }
    if ((group.pendingMentors || []).includes(uid)) {
      return res.status(400).json({ message: 'Your mentor request is already pending approval' });
    }
    if (!group.pendingMentors) group.pendingMentors = [];
    group.pendingMentors.push(uid);
    group.updatedAt = nowIso();
    return res.status(200).json({
      success: true,
      pendingMentorRequest: true,
      message: 'Your request to join as mentor has been sent to the group owner for approval'
    });
  }

  if (group.students.includes(uid)) {
    return res.status(400).json({ message: 'You are already a member of this group' });
  }

  group.students.push(uid);
  group.updatedAt = nowIso();
  req.user.groups = Array.from(new Set([...(req.user.groups || []), group.id]));

  return res.status(200).json({
    success: true,
    message: 'Joined group successfully',
    group: { id: group.id, name: group.name, description: group.description }
  });
});

router.get('/groups/:id/pending-mentors', auth, (req, res) => {
  const group = state.groups.find((item) => item.id === req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const uid = req.user.id;
  const canView = group.createdBy === uid || group.mentors.includes(uid) || req.user.role === 'admin';
  if (!canView) return res.status(403).json({ message: 'Unauthorized' });

  const pendingMentors = (group.pendingMentors || []).map((mId) => {
    const u = getUserById(mId);
    return u ? { id: u.id, _id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email } : null;
  }).filter(Boolean);

  return res.status(200).json({ success: true, pendingMentors });
});

router.put('/groups/:id/review-mentor', auth, (req, res) => {
  const group = state.groups.find((item) => item.id === req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  if (group.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only the group owner can approve mentor requests' });
  }

  const { userId, action } = req.body;
  group.pendingMentors = (group.pendingMentors || []).filter((id) => id !== userId);

  if (action === 'approve') {
    if (!group.mentors.includes(userId)) group.mentors.push(userId);
    const u = getUserById(userId);
    if (u) u.role = 'mentor';
  }

  group.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: action === 'approve' ? 'Mentor approved' : 'Mentor request rejected'
  });
});

router.post('/groups/:id/add-student', auth, (req, res) => {
  const group = state.groups.find((item) => item.id === req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const uid = req.user.id;
  const canManage = group.createdBy === uid || group.mentors.includes(uid) || req.user.role === 'admin';
  if (!canManage) return res.status(403).json({ message: 'Unauthorized' });

  const { studentEmail } = req.body;
  const student = state.users.find((u) => u.email === String(studentEmail || '').toLowerCase());
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (group.students.includes(student.id)) {
    return res.status(400).json({ message: 'Student is already in this group' });
  }

  group.students.push(student.id);
  student.groups = Array.from(new Set([...(student.groups || []), group.id]));
  group.updatedAt = nowIso();

  return res.status(200).json({ success: true, message: 'Student added successfully' });
});

router.post('/groups/:id/remove-student', auth, (req, res) => {
  const group = state.groups.find((item) => item.id === req.params.id);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const uid = req.user.id;
  const canManage = group.createdBy === uid || group.mentors.includes(uid) || req.user.role === 'admin';
  if (!canManage) return res.status(403).json({ message: 'Unauthorized' });

  const { studentId } = req.body;
  group.students = group.students.filter((id) => id !== studentId);
  const student = getUserById(studentId);
  if (student) student.groups = (student.groups || []).filter((id) => id !== group.id);
  group.updatedAt = nowIso();

  return res.status(200).json({ success: true, message: 'Student removed' });
});

router.post('/groups/mentor/add', auth, (req, res) => {
  const { groupId, mentorEmail } = req.body;
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  if (group.createdBy !== req.user.id) {
    return res.status(403).json({ message: 'Only group creator can add mentors' });
  }

  const mentor = state.users.find((user) => user.email === String(mentorEmail || '').toLowerCase());
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

  if (!group.mentors.includes(mentor.id)) group.mentors.push(mentor.id);
  mentor.role = 'mentor';

  return res.status(200).json({ success: true, message: 'Mentor added successfully' });
});

router.post('/groups/mentor/remove', auth, (req, res) => {
  const { groupId, mentorId } = req.body;
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const requesterId = req.user.id;
  const isOwner = group.createdBy === requesterId;

  if (isOwner || req.user.role === 'admin') {
    group.mentors = group.mentors.filter((id) => id !== mentorId);
    group.pendingMentorRemovals = (group.pendingMentorRemovals || []).filter(
      (r) => r.mentorId !== mentorId
    );
    group.updatedAt = nowIso();
    return res.status(200).json({ success: true, message: 'Mentor removed successfully' });
  }

  if (!group.mentors.includes(requesterId)) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const alreadyRequested = (group.pendingMentorRemovals || []).some((r) => r.mentorId === mentorId);
  if (alreadyRequested) {
    return res.status(400).json({ message: 'A removal request for this mentor is already pending admin review' });
  }

  group.pendingMentorRemovals = group.pendingMentorRemovals || [];
  group.pendingMentorRemovals.push({ mentorId, requestedBy: requesterId, requestedAt: nowIso() });
  group.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    pendingAdminReview: true,
    message: 'Removal request submitted for admin review'
  });
});

router.post('/groups/leave', auth, (req, res) => {
  const { groupId } = req.body;
  const group = state.groups.find((item) => item.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  group.students = group.students.filter((id) => id !== req.user.id);
  req.user.groups = (req.user.groups || []).filter((id) => id !== groupId);

  return res.status(200).json({ success: true, message: 'Left group successfully' });
});

router.get('/admin/mentor-removals/pending', auth, requireRoles('admin'), (req, res) => {
  const requests = [];
  for (const group of state.groups) {
    for (const r of (group.pendingMentorRemovals || [])) {
      const mentor = getUserById(r.mentorId);
      const requester = getUserById(r.requestedBy);
      requests.push({
        groupId: group.id,
        groupName: group.name,
        mentorId: r.mentorId,
        mentorName: mentor ? `${mentor.firstName} ${mentor.lastName}` : r.mentorId,
        mentorEmail: mentor?.email || '',
        requestedBy: requester ? `${requester.firstName} ${requester.lastName}` : '',
        requestedAt: r.requestedAt
      });
    }
  }
  return res.status(200).json({ success: true, pendingRemovals: requests });
});

router.put('/admin/mentor-removals/review', auth, requireRoles('admin'), (req, res) => {
  const { groupId, mentorId, action } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  group.pendingMentorRemovals = (group.pendingMentorRemovals || []).filter((r) => r.mentorId !== mentorId);

  if (action === 'approve') {
    group.mentors = group.mentors.filter((id) => id !== mentorId);
  }

  group.updatedAt = nowIso();
  return res.status(200).json({
    success: true,
    message: action === 'approve' ? 'Mentor removed from group' : 'Removal request rejected'
  });
});

router.get('/admin/users', auth, requireRoles('admin'), (req, res) => {
  const { role } = req.query;
  const users = state.users
    .filter((user) => !role || user.role === role)
    .map((user) => stripPassword(user));

  return res.status(200).json({ success: true, users });
});

router.put('/admin/users/role', auth, requireRoles('admin'), (req, res) => {
  const { userId, newRole } = req.body;
  if (!['student', 'mentor', 'admin'].includes(newRole)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.role = newRole;
  user.updatedAt = nowIso();

  return res.status(200).json({ success: true, message: 'User role updated successfully', user: stripPassword(user) });
});

router.get('/admin/teachers/pending', auth, requireRoles('admin'), (req, res) => {
  const pendingRequests = state.users
    .filter((user) => user.approvalStatus === 'pending' && user.requestedRole === 'mentor')
    .map((user) => stripPassword(user))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.status(200).json({ success: true, pendingRequests });
});

router.get('/admin/teachers/reviewed', auth, requireRoles('admin'), (req, res) => {
  const reviewedRequests = state.users
    .filter(
      (user) =>
        user.requestedRole === 'mentor' &&
        (user.approvalStatus === 'approved' || user.approvalStatus === 'rejected')
    )
    .map((user) => stripPassword(user))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return res.status(200).json({ success: true, reviewedRequests });
});

router.put('/admin/teachers/review', auth, requireRoles('admin'), (req, res) => {
  const { userId, action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const user = getUserById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (action === 'approve') {
    user.role = 'mentor';
    user.approvalStatus = 'approved';
  } else {
    user.role = 'student';
    user.approvalStatus = 'rejected';
  }

  user.requestedRole = 'mentor';
  user.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: action === 'approve' ? 'Teacher request approved' : 'Teacher request rejected',
    user: stripPassword(user)
  });
});

router.get('/admin/questions/reported', auth, requireRoles('admin'), (req, res) => {
  const reportedQuestions = state.questions.filter((question) => question.isReported);
  return res.status(200).json({ success: true, reportedQuestions });
});

router.get('/admin/quizzes/reported', auth, requireRoles('admin'), (req, res) => {
  const reportedQuizzes = state.quizzes
    .filter((quiz) => (quiz.reportCount || 0) > 0 || ['pending-review', 'hidden'].includes(quiz.moderationStatus))
    .map((quiz) => serializeQuiz(quiz, req.user))
    .sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0));

  return res.status(200).json({ success: true, reportedQuizzes });
});

router.get('/admin/quizzes/import-template', auth, requireRoles('admin'), (req, res) => {
  res.type('text/csv').send(quizCsvTemplate);
});

router.post('/admin/quizzes/import', auth, requireRoles('admin'), (req, res) => {
  try {
    const quizSpecs = parseQuizCsv(req.body?.csv);
    const imported = importQuizSpecs(quizSpecs, req.user.id);
    return res.status(201).json({
      success: true,
      message: `Imported ${imported.quizCount} public quizzes with ${imported.questionCount} questions`,
      ...imported
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.put('/admin/quizzes/report/review', auth, requireRoles('admin'), (req, res) => {
  const { quizId, action } = req.body;
  if (!['approve', 'keep-hidden'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const quiz = state.quizzes.find((item) => item.id === quizId);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

  if (action === 'approve') {
    quiz.moderationStatus = 'approved';
    quiz.reports = [];
    quiz.reportCount = 0;
  } else {
    quiz.moderationStatus = 'hidden';
  }
  quiz.updatedAt = nowIso();

  return res.status(200).json({
    success: true,
    message: action === 'approve' ? 'Quiz approved and visible again' : 'Quiz will remain hidden from students'
  });
});

router.put('/admin/questions/report/resolve', auth, requireRoles('admin'), (req, res) => {
  const { questionId, action } = req.body;
  const question = state.questions.find((item) => item.id === questionId);

  if (!question) return res.status(404).json({ message: 'Question not found' });

  if (action === 'approve') {
    question.isReported = false;
    question.reports = [];
    return res.status(200).json({ success: true, message: 'Report resolved successfully', question });
  }

  if (action === 'delete') {
    state.questions = state.questions.filter((item) => item.id !== questionId);
    const quiz = state.quizzes.find((item) => item.id === question.quiz);
    if (quiz) quiz.questions = quiz.questions.filter((id) => id !== questionId);
    return res.status(200).json({ success: true, message: 'Question deleted' });
  }

  return res.status(400).json({ message: 'Invalid action' });
});

router.get('/admin/stats', auth, requireRoles('admin'), (req, res) => {
  const totalUsers = state.users.length;
  const totalMentors = state.users.filter((user) => user.role === 'mentor').length;
  const totalQuizzes = state.quizzes.length;
  const reportedQuestions = state.questions.filter((question) => question.isReported).length;
  const reportedQuizzes = state.quizzes.filter(
    (quiz) => (quiz.reportCount || 0) > 0 || ['pending-review', 'hidden'].includes(quiz.moderationStatus)
  ).length;

  return res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalMentors,
      totalQuizzes,
      reportedQuestions,
      reportedQuizzes
    }
  });
});

export default router;
