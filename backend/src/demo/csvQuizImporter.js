const REQUIRED_COLUMNS = [
  'quiz_title', 'category', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option'
];
const CORE_GENRES = ['Tamil', 'English', 'Math', 'Science', 'History'];

const parseRows = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
};

export const parseQuizCsv = (csvText) => {
  const rows = parseRows(String(csvText || '').replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('CSV must include a header and at least one question row');

  const headers = rows[0].map((value) => value.toLowerCase().trim());
  const missing = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}`);

  const quizzes = new Map();
  rows.slice(1).forEach((values, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column] || '']));
    const title = record.quiz_title.trim();
    if (!title) throw new Error(`Row ${index + 2}: quiz_title is required`);
    const genre = CORE_GENRES.find((item) => item.toLowerCase() === record.category.trim().toLowerCase());
    if (!genre) throw new Error(`Row ${index + 2}: category must be one of ${CORE_GENRES.join(', ')}`);

    if (!quizzes.has(title)) {
      quizzes.set(title, {
        title,
        description: record.description || 'Imported public quiz',
        category: genre,
        difficulty: record.difficulty || 'medium',
        timePerQuestion: Math.min(300, Math.max(10, Number(record.time_per_question) || 30)),
        questions: []
      });
    }

    const quiz = quizzes.get(title);
    if (quiz.questions.length >= 10) throw new Error(`${title}: a quiz cannot contain more than 10 questions`);

    const correct = record.correct_option.toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(correct)) {
      throw new Error(`Row ${index + 2}: correct_option must be A, B, C, or D`);
    }
    const optionValues = [record.option_a, record.option_b, record.option_c, record.option_d];
    if (!record.question || optionValues.some((option) => !option)) {
      throw new Error(`Row ${index + 2}: question and all four options are required`);
    }

    quiz.questions.push({
      questionText: record.question,
      options: optionValues.map((text, optionIndex) => ({
        text,
        isCorrect: optionIndex === ['A', 'B', 'C', 'D'].indexOf(correct)
      })),
      correctAnswer: optionValues[['A', 'B', 'C', 'D'].indexOf(correct)],
      explanation: record.explanation || '',
      difficulty: record.difficulty || quiz.difficulty
    });
  });

  return [...quizzes.values()];
};

export const quizCsvTemplate = [
  'quiz_title,description,category,difficulty,time_per_question,question,option_a,option_b,option_c,option_d,correct_option,explanation',
  'Tamil Basics,An example public quiz,Tamil,easy,30,What does Nandri mean?,Hello,Thank you,Goodbye,Please,B,Nandri means thank you.'
].join('\n');
