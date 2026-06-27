const API_BASE = process.env.SMOKE_API_BASE || 'http://localhost:5000/api';
const mentorEmail = process.env.SMOKE_MENTOR_EMAIL;
const mentorPassword = process.env.SMOKE_MENTOR_PASSWORD;

const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const studentEmail = `smoke-student-${randomSuffix}@example.com`;
const studentPassword = 'Test@12345';

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

async function request(path, options = {}) {
  const mergedHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const finalOptions = {
    ...options,
    headers: mergedHeaders,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...finalOptions,
  });

  let body;
  const text = await response.text();
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message = body?.message || `HTTP ${response.status}`;
    throw new Error(`${path} failed: ${message}`);
  }

  return body;
}

async function login(email, password) {
  const body = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return body.token;
}

async function registerStudent() {
  const body = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: studentEmail,
      firstName: 'Smoke',
      lastName: 'Student',
      password: studentPassword,
      confirmPassword: studentPassword,
    }),
  });

  return body.token;
}

async function run() {
  console.log('Starting smoke test...');
  requireEnv('SMOKE_MENTOR_EMAIL', mentorEmail);
  requireEnv('SMOKE_MENTOR_PASSWORD', mentorPassword);

  const mentorToken = await login(mentorEmail, mentorPassword);
  console.log('Mentor login: ok');

  const quizRes = await request('/quizzes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${mentorToken}` },
    body: JSON.stringify({
      title: `Smoke Quiz ${randomSuffix}`,
      description: 'Smoke test quiz',
      category: 'Tamil',
      difficulty: 'easy',
      timePerQuestion: 30,
    }),
  });
  const quizId = quizRes.quiz._id;
  console.log('Quiz created:', quizId);

  await request(`/questions/${quizId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mentorToken}` },
    body: JSON.stringify({
      questionText: 'Tamil is a language.',
      questionType: 'true-false',
      correctAnswer: 'true',
      difficulty: 'easy',
    }),
  });

  await request(`/questions/${quizId}/questions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${mentorToken}` },
    body: JSON.stringify({
      questionText: 'Select the Tamil letter',
      questionType: 'multiple-choice',
      options: [
        { text: 'A', isCorrect: false },
        { text: 'ஆ', isCorrect: true },
        { text: 'B', isCorrect: false },
        { text: 'C', isCorrect: false },
      ],
      correctAnswer: 'ஆ',
      difficulty: 'easy',
    }),
  });
  console.log('Questions added: ok');

  await request(`/quizzes/${quizId}/publish`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${mentorToken}` },
  });
  console.log('Quiz published: ok');

  const studentToken = await registerStudent();
  console.log('Student registered:', studentEmail);

  const startRes = await request('/responses/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ quizId, isGroupAttempt: false }),
  });

  const responseId = startRes.quizResponse.id;
  const questions = startRes.questions || [];
  if (questions.length < 2) {
    throw new Error('Expected at least 2 questions in started quiz response');
  }
  console.log('Quiz started: ok');

  for (const q of questions) {
    if (q.questionType === 'true-false') {
      await request('/responses/submit-answer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          responseId,
          questionId: q._id,
          selectedAnswer: 'true',
          timeSpent: 5,
        }),
      });
    } else if (q.questionType === 'multiple-choice') {
      const firstOption = q.options?.[0]?.text || '';
      await request('/responses/submit-answer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          responseId,
          questionId: q._id,
          selectedOption: firstOption,
          timeSpent: 5,
        }),
      });
    } else {
      await request('/responses/submit-answer', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          responseId,
          questionId: q._id,
          selectedAnswer: 'smoke',
          timeSpent: 5,
        }),
      });
    }
  }
  console.log('Answers submitted: ok');

  await request(`/responses/${responseId}/complete`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log('Quiz completed: ok');

  const leaderboardRes = await request(`/responses/leaderboard?quizId=${quizId}&period=all-time`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });

  if (!Array.isArray(leaderboardRes.leaderboard)) {
    throw new Error('Leaderboard response format invalid');
  }

  console.log('Leaderboard fetched: ok');
  console.log('Smoke test passed successfully.');
}

run().catch((err) => {
  console.error('Smoke test failed.');
  console.error(err.message);
  process.exit(1);
});
