import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { Card, Button, Input, Alert } from '../components/UI';
import { questionAPI, quizAPI } from '../utils/api';

const emptyQuestion = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  explanation: ''
};

const AddQuizQuestions = () => {
  const { id: quizId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const requestedCount = useMemo(() => {
    const raw = Number(location.state?.questionCount || 1);
    if (Number.isNaN(raw)) return 1;
    return Math.min(10, Math.max(1, raw));
  }, [location.state]);

  const [quizTitle, setQuizTitle] = useState(location.state?.quizTitle || 'Quiz');
  const [targetCount, setTargetCount] = useState(requestedCount);
  const [existingCount, setExistingCount] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [formData, setFormData] = useState(emptyQuestion);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadQuizAndQuestions = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [quizRes, questionRes] = await Promise.allSettled([
          quizAPI.getQuizById(quizId),
          questionAPI.getQuestions(quizId)
        ]);

        if (quizRes.status === 'fulfilled') {
          const title = quizRes.value.data?.quiz?.title;
          if (title) setQuizTitle(title);
        }

        if (questionRes.status === 'fulfilled') {
          const fetchedQuestions = questionRes.value.data?.questions || [];
          const count = fetchedQuestions.length || 0;
          setQuestions(fetchedQuestions);
          setExistingCount(Math.min(10, count));
        } else {
          const status = questionRes.reason?.response?.status;
          if (status === 404) {
            setQuestions([]);
            setExistingCount(0);
          } else {
            throw questionRes.reason;
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz details');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuizAndQuestions();
  }, [quizId]);

  const currentCount = existingCount;
  const remaining = Math.max(targetCount - currentCount, 0);
  const isTargetReached = remaining === 0;
  const hardMaxReached = currentCount >= 10;

  const getOptionTextByLabel = (question, label) => {
    if (label === 'A') return question?.options?.[0]?.text || '';
    if (label === 'B') return question?.options?.[1]?.text || '';
    if (label === 'C') return question?.options?.[2]?.text || '';
    if (label === 'D') return question?.options?.[3]?.text || '';
    return '';
  };

  const resolveCorrectOptionLabel = (question) => {
    const options = question?.options || [];
    const markedIdx = options.findIndex((opt) => opt.isCorrect);
    if (markedIdx !== -1) return ['A', 'B', 'C', 'D'][markedIdx] || 'A';

    const answerText = String(question?.correctAnswer || '').trim();
    const matchedIdx = options.findIndex((opt) => String(opt?.text || '').trim() === answerText);
    if (matchedIdx !== -1) return ['A', 'B', 'C', 'D'][matchedIdx] || 'A';

    return 'A';
  };

  const startEditQuestion = (question) => {
    const resolvedOption = resolveCorrectOptionLabel(question);

    setEditingQuestionId(question._id || question.id);
    setFormData({
      questionText: question.questionText || '',
      optionA: getOptionTextByLabel(question, 'A'),
      optionB: getOptionTextByLabel(question, 'B'),
      optionC: getOptionTextByLabel(question, 'C'),
      optionD: getOptionTextByLabel(question, 'D'),
      correctOption: resolvedOption,
      explanation: question.explanation || ''
    });
    setError('');
    setSuccess('Editing question. Save to update it.');
  };

  const resetEditor = () => {
    setEditingQuestionId(null);
    resetForm();
  };

  const upsertQuestionInList = (updatedQuestion) => {
    const updatedId = updatedQuestion?._id || updatedQuestion?.id;
    setQuestions((prev) => {
      const index = prev.findIndex((item) => (item._id || item.id) === updatedId);
      if (index === -1) return [...prev, updatedQuestion];
      const next = [...prev];
      next[index] = updatedQuestion;
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'targetCount') {
      const parsed = Number(value);
      if (Number.isNaN(parsed)) return;
      setTargetCount(Math.min(10, Math.max(1, parsed)));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyQuestion);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (hardMaxReached && !editingQuestionId) {
      setError('Quiz already has the maximum 10 questions.');
      return;
    }

    if (isTargetReached && !editingQuestionId) {
      setError('Target question count already reached.');
      return;
    }

    const optionMap = {
      A: formData.optionA,
      B: formData.optionB,
      C: formData.optionC,
      D: formData.optionD
    };

    const optionEntries = Object.values(optionMap).map((item) => item.trim());
    const hasEmptyOption = optionEntries.some((item) => !item);
    if (hasEmptyOption) {
      setError('Please fill all four options.');
      return;
    }

    const options = [
      { text: formData.optionA.trim(), isCorrect: formData.correctOption === 'A' },
      { text: formData.optionB.trim(), isCorrect: formData.correctOption === 'B' },
      { text: formData.optionC.trim(), isCorrect: formData.correctOption === 'C' },
      { text: formData.optionD.trim(), isCorrect: formData.correctOption === 'D' }
    ];

    const payload = {
      questionText: formData.questionText.trim(),
      questionType: 'multiple-choice',
      options,
      correctAnswer: optionMap[formData.correctOption].trim(),
      explanation: formData.explanation.trim(),
      difficulty: 'medium'
    };

    try {
      setIsSubmitting(true);
      if (editingQuestionId) {
        const response = await questionAPI.updateQuestion(editingQuestionId, payload);
        const updatedQuestion = response.data?.question;
        if (updatedQuestion) upsertQuestionInList(updatedQuestion);
        setSuccess('Question updated successfully.');
        resetEditor();
      } else {
        const response = await questionAPI.addQuestion(quizId, payload);
        const createdQuestion = response.data?.question;
        if (createdQuestion) upsertQuestionInList(createdQuestion);

        const newCount = currentCount + 1;
        setExistingCount(newCount);
        resetForm();

        const nextRemaining = Math.max(targetCount - newCount, 0);
        if (nextRemaining === 0) {
          setSuccess(`Added question ${newCount}/${targetCount}. Target completed.`);
        } else {
          setSuccess(`Added question ${newCount}/${targetCount}. ${nextRemaining} remaining.`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Navbar />
          <div className="p-4 sm:p-6 lg:p-8">
            <Card className="max-w-3xl mx-auto">
              <p className="text-gray-600">Loading quiz details...</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Navbar />
        <div className="p-4 sm:p-6 lg:p-8">
          <Card className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Add Questions</h1>
            <p className="text-gray-600 mb-1">{quizTitle}</p>
            <p className="text-sm text-gray-500 mb-6">MCQ only in this flow. Max 10 questions per quiz.</p>

            {error && <Alert type="error">{error}</Alert>}
            {success && <Alert type="success">{success}</Alert>}

            <div className="grid md:grid-cols-3 gap-3 my-5">
              <Card className="p-4">
                <p className="text-xs text-gray-500">Target</p>
                <Input
                  type="number"
                  name="targetCount"
                  min="1"
                  max="10"
                  value={targetCount}
                  onChange={handleChange}
                />
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500">Added</p>
                <p className="text-2xl font-semibold">{currentCount}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-gray-500">Remaining</p>
                <p className="text-2xl font-semibold">{remaining}</p>
              </Card>
            </div>

            <form onSubmit={handleAddQuestion} className="space-y-4 mt-4">
              <h2 className="text-lg font-semibold">{editingQuestionId ? 'Edit MCQ' : 'Add MCQ'}</h2>
              <Input
                label="Question"
                name="questionText"
                value={formData.questionText}
                onChange={handleChange}
                placeholder="Enter MCQ question"
                required
              />

              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Option A"
                  name="optionA"
                  value={formData.optionA}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Option B"
                  name="optionB"
                  value={formData.optionB}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Option C"
                  name="optionC"
                  value={formData.optionC}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Option D"
                  name="optionD"
                  value={formData.optionD}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Correct Option</label>
                <select
                  name="correctOption"
                  value={formData.correctOption}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <Input
                label="Explanation (optional)"
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                placeholder="Why this is correct"
              />

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={() => navigate('/quizzes')}>
                  Back to Quizzes
                </Button>
                {editingQuestionId && (
                  <Button type="button" variant="secondary" onClick={resetEditor}>
                    Cancel Edit
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={(isTargetReached || hardMaxReached) && !editingQuestionId}
                >
                  {editingQuestionId ? 'Save Changes' : 'Add Question'}
                </Button>
                <Button
                  type="button"
                  variant="success"
                  onClick={() => navigate('/quizzes')}
                  disabled={!isTargetReached && !hardMaxReached}
                >
                  Finish
                </Button>
              </div>
            </form>

            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Existing Questions</h2>
              {questions.length === 0 ? (
                <p className="text-gray-500">No questions added yet.</p>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const qId = question._id || question.id;
                    return (
                      <Card key={qId} className="p-4">
                        <p className="font-semibold mb-2">Q{index + 1}. {question.questionText}</p>
                        <ul className="text-sm text-gray-700 space-y-1 mb-3">
                          {(question.options || []).map((option, optIdx) => {
                            const label = ['A', 'B', 'C', 'D'][optIdx] || String(optIdx + 1);
                            const isCorrect =
                              !!option.isCorrect ||
                              String(option.text || '').trim() === String(question.correctAnswer || '').trim();
                            return (
                              <li key={`${qId}-${label}`}>
                                <span className={isCorrect ? 'font-semibold text-green-700' : ''}>
                                  {label}. {option.text}
                                  {isCorrect ? ' (Correct)' : ''}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        <Button variant="secondary" size="sm" onClick={() => startEditQuestion(question)}>
                          Edit Question
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AddQuizQuestions;
